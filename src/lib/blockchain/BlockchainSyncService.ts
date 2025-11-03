// Blockchain Synchronization Service
// Syncs blockchain events with MongoDB database

import { eventListenerService } from "./EventListenerService";
import {
  PrescriptionCreatedEvent,
  PrescriptionDispensedEvent,
  DrugStockUpdatedEvent,
  DrugAddedEvent,
} from "./contracts";
import { Log } from "viem";
import mongoose from "mongoose";
import { DatabaseManager } from "../database/connection";

// Get models (lazy loading to avoid circular dependencies)
const getPrescriptionModel = () => {
  return (
    mongoose.models.Prescription ||
    mongoose.model("Prescription", new mongoose.Schema({}, { strict: false }))
  );
};

const getDrugModel = () => {
  return (
    mongoose.models.Drug ||
    mongoose.model("Drug", new mongoose.Schema({}, { strict: false }))
  );
};

const getInventoryTransactionModel = () => {
  return (
    mongoose.models.InventoryTransaction ||
    mongoose.model(
      "InventoryTransaction",
      new mongoose.Schema({}, { strict: false })
    )
  );
};

/**
 * Blockchain Synchronization Service
 * Handles syncing blockchain events with MongoDB
 */
export class BlockchainSyncService {
  private static instance: BlockchainSyncService;
  private isSyncing = false;

  private constructor() {
    this.registerEventHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BlockchainSyncService {
    if (!BlockchainSyncService.instance) {
      BlockchainSyncService.instance = new BlockchainSyncService();
    }
    return BlockchainSyncService.instance;
  }

  /**
   * Register event handlers with event listener service
   */
  private registerEventHandlers(): void {
    eventListenerService.registerHandlers({
      onPrescriptionCreated: this.handlePrescriptionCreated.bind(this),
      onPrescriptionDispensed: this.handlePrescriptionDispensed.bind(this),
      onDrugStockUpdated: this.handleDrugStockUpdated.bind(this),
      onDrugAdded: this.handleDrugAdded.bind(this),
    });
  }

  /**
   * Start syncing blockchain events
   */
  public async startSync(fromBlock?: bigint): Promise<void> {
    if (this.isSyncing) {
      console.log("⚠️ Blockchain sync already running");
      return;
    }

    try {
      await DatabaseManager.getInstance().ensureConnection();
      this.isSyncing = true;

      // Start event listener
      await eventListenerService.startListening(fromBlock);

      console.log("✅ Blockchain synchronization started");
    } catch (error) {
      console.error("❌ Error starting blockchain sync:", error);
      this.isSyncing = false;
      throw error;
    }
  }

  /**
   * Stop syncing blockchain events
   */
  public stopSync(): void {
    eventListenerService.stopListening();
    this.isSyncing = false;
    console.log("🛑 Blockchain synchronization stopped");
  }

  /**
   * Handle PrescriptionCreated event
   */
  private async handlePrescriptionCreated(
    event: PrescriptionCreatedEvent,
    log: Log
  ): Promise<void> {
    try {
      const PrescriptionModel = getPrescriptionModel();

      console.log("📝 PrescriptionCreated event:", {
        prescriptionId: event.prescriptionId.toString(),
        patientAddress: event.patientAddress,
        doctorAddress: event.doctorAddress,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });

      // Find prescription by on-chain ID or create placeholder
      const filter = { onchain_prescription_id: Number(event.prescriptionId) };
      const update = {
        $set: {
          onchain_tx_hash: log.transactionHash,
          onchain_block_number: Number(log.blockNumber),
          onchain_prescription_id: Number(event.prescriptionId),
        },
      };

      await PrescriptionModel.findOneAndUpdate(filter, update, {
        upsert: false, // Don't create if not exists (should be created by backend first)
      });

      console.log(
        `✅ Synced PrescriptionCreated: ${event.prescriptionId} at block ${log.blockNumber}`
      );
    } catch (error) {
      console.error("❌ Error handling PrescriptionCreated event:", error);
    }
  }

  /**
   * Handle PrescriptionDispensed event
   */
  private async handlePrescriptionDispensed(
    event: PrescriptionDispensedEvent,
    log: Log
  ): Promise<void> {
    try {
      const PrescriptionModel = getPrescriptionModel();

      console.log("💊 PrescriptionDispensed event:", {
        prescriptionId: event.prescriptionId.toString(),
        pharmacistAddress: event.pharmacistAddress,
        quantityDispensed: event.quantityDispensed.toString(),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });

      // Update prescription with on-chain data
      await PrescriptionModel.findOneAndUpdate(
        { onchain_prescription_id: Number(event.prescriptionId) },
        {
          $set: {
            onchain_tx_hash: log.transactionHash,
            onchain_block_number: Number(log.blockNumber),
            status: "dispensed",
            quantity_dispensed: Number(event.quantityDispensed),
            date_dispensed: new Date(Number(event.timestamp) * 1000),
          },
        }
      );

      console.log(
        `✅ Synced PrescriptionDispensed: ${event.prescriptionId} at block ${log.blockNumber}`
      );
    } catch (error) {
      console.error("❌ Error handling PrescriptionDispensed event:", error);
    }
  }

  /**
   * Handle DrugStockUpdated event
   */
  private async handleDrugStockUpdated(
    event: DrugStockUpdatedEvent,
    log: Log
  ): Promise<void> {
    try {
      const DrugModel = getDrugModel();
      const InventoryTransactionModel = getInventoryTransactionModel();

      console.log("📦 DrugStockUpdated event:", {
        drugId: event.drugId.toString(),
        previousQuantity: event.previousQuantity.toString(),
        newQuantity: event.newQuantity.toString(),
        transactionType: event.transactionType,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });

      // Update drug stock
      const drug = await DrugModel.findOneAndUpdate(
        { onchain_drug_id: Number(event.drugId) },
        {
          $set: {
            stock_quantity: Number(event.newQuantity),
            onchain_tx_hash: log.transactionHash,
            onchain_block_number: Number(log.blockNumber),
          },
        },
        { new: true }
      );

      if (drug) {
        // Create inventory transaction record
        await InventoryTransactionModel.create({
          drug_id: drug._id,
          transaction_type: event.transactionType.toLowerCase(),
          quantity: Number(event.newQuantity) - Number(event.previousQuantity),
          blockchain_transaction_hash: event.blockchainHash,
          onchain_tx_hash: log.transactionHash,
          onchain_block_number: Number(log.blockNumber),
          timestamp: new Date(Number(event.timestamp) * 1000),
          notes: `Blockchain sync: ${event.transactionType}`,
        });
      }

      console.log(
        `✅ Synced DrugStockUpdated: ${event.drugId} at block ${log.blockNumber}`
      );
    } catch (error) {
      console.error("❌ Error handling DrugStockUpdated event:", error);
    }
  }

  /**
   * Handle DrugAdded event
   */
  private async handleDrugAdded(
    event: DrugAddedEvent,
    log: Log
  ): Promise<void> {
    try {
      const DrugModel = getDrugModel();

      console.log("➕ DrugAdded event:", {
        drugId: event.drugId.toString(),
        name: event.name,
        initialQuantity: event.initialQuantity.toString(),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });

      // Update drug with on-chain data
      await DrugModel.findOneAndUpdate(
        { name: event.name }, // Match by name (should match when drug is created)
        {
          $set: {
            onchain_tx_hash: log.transactionHash,
            onchain_block_number: Number(log.blockNumber),
            onchain_drug_id: Number(event.drugId),
          },
        }
      );

      console.log(
        `✅ Synced DrugAdded: ${event.drugId} (${event.name}) at block ${log.blockNumber}`
      );
    } catch (error) {
      console.error("❌ Error handling DrugAdded event:", error);
    }
  }

  /**
   * Sync historical events from a specific block range
   */
  public async syncHistoricalEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<void> {
    try {
      await DatabaseManager.getInstance().ensureConnection();

      console.log(
        `📜 Syncing historical events from block ${fromBlock} to ${toBlock}`
      );

      await eventListenerService.fetchHistoricalEvents(fromBlock, toBlock);

      console.log("✅ Historical sync complete");
    } catch (error) {
      console.error("❌ Error syncing historical events:", error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      isListenerRunning: eventListenerService.isRunning(),
      lastProcessedBlock: eventListenerService
        .getLastProcessedBlock()
        .toString(),
    };
  }

  /**
   * Handle blockchain reorganization (reorg)
   * This ensures data consistency when blocks are replaced
   */
  public async handleReorg(fromBlock: bigint): Promise<void> {
    try {
      console.log(
        `⚠️ Handling blockchain reorganization from block ${fromBlock}`
      );

      const PrescriptionModel = getPrescriptionModel();
      const DrugModel = getDrugModel();

      // Mark affected records for re-sync
      await PrescriptionModel.updateMany(
        { onchain_block_number: { $gte: Number(fromBlock) } },
        { $unset: { onchain_tx_hash: "", onchain_block_number: "" } }
      );

      await DrugModel.updateMany(
        { onchain_block_number: { $gte: Number(fromBlock) } },
        { $unset: { onchain_tx_hash: "", onchain_block_number: "" } }
      );

      // Re-sync from the reorg point
      eventListenerService.setLastProcessedBlock(fromBlock - 1n);

      console.log("✅ Reorg handling complete, re-syncing...");
    } catch (error) {
      console.error("❌ Error handling reorg:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainSyncService = BlockchainSyncService.getInstance();
export default BlockchainSyncService;
