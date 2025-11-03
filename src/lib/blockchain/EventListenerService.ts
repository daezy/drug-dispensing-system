// Blockchain Event Listener Service
// Listens to smart contract events and synchronizes with MongoDB

import { baseClient } from "./BaseClient";
import {
  PrescriptionContractABI,
  DrugInventoryContractABI,
  CONTRACT_ADDRESSES,
  PrescriptionCreatedEvent,
  PrescriptionDispensedEvent,
  DrugStockUpdatedEvent,
  DrugAddedEvent,
} from "./contracts";
import { parseAbiItem, Log } from "viem";

// Event handler types
export type PrescriptionCreatedHandler = (
  event: PrescriptionCreatedEvent,
  log: Log
) => Promise<void>;
export type PrescriptionDispensedHandler = (
  event: PrescriptionDispensedEvent,
  log: Log
) => Promise<void>;
export type DrugStockUpdatedHandler = (
  event: DrugStockUpdatedEvent,
  log: Log
) => Promise<void>;
export type DrugAddedHandler = (
  event: DrugAddedEvent,
  log: Log
) => Promise<void>;

interface EventHandlers {
  onPrescriptionCreated?: PrescriptionCreatedHandler;
  onPrescriptionDispensed?: PrescriptionDispensedHandler;
  onDrugStockUpdated?: DrugStockUpdatedHandler;
  onDrugAdded?: DrugAddedHandler;
}

/**
 * Blockchain Event Listener Service
 * Monitors smart contract events and triggers handlers
 */
export class EventListenerService {
  private static instance: EventListenerService;
  private handlers: EventHandlers = {};
  private isListening = false;
  private lastProcessedBlock: bigint = 0n;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 12000; // 12 seconds (Base block time)

  private constructor() {
    this.loadLastProcessedBlock();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventListenerService {
    if (!EventListenerService.instance) {
      EventListenerService.instance = new EventListenerService();
    }
    return EventListenerService.instance;
  }

  /**
   * Register event handlers
   */
  public registerHandlers(handlers: EventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
    console.log("✅ Event handlers registered");
  }

  /**
   * Start listening to blockchain events
   */
  public async startListening(fromBlock?: bigint): Promise<void> {
    if (this.isListening) {
      console.log("⚠️ Event listener already running");
      return;
    }

    const publicClient = baseClient.getPublicClient();

    // Set starting block
    if (fromBlock !== undefined) {
      this.lastProcessedBlock = fromBlock;
    } else if (this.lastProcessedBlock === 0n) {
      this.lastProcessedBlock = await publicClient.getBlockNumber();
    }

    console.log(
      `🎧 Starting event listener from block ${this.lastProcessedBlock}`
    );
    this.isListening = true;

    // Start polling for new events
    this.pollingInterval = setInterval(() => {
      this.pollForEvents().catch((error) => {
        console.error("Error polling for events:", error);
      });
    }, this.POLL_INTERVAL_MS);

    // Do initial poll
    await this.pollForEvents();
  }

  /**
   * Stop listening to blockchain events
   */
  public stopListening(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isListening = false;
    console.log("🛑 Event listener stopped");
  }

  /**
   * Poll for new events
   */
  private async pollForEvents(): Promise<void> {
    const publicClient = baseClient.getPublicClient();
    const currentBlock = await publicClient.getBlockNumber();

    if (currentBlock <= this.lastProcessedBlock) {
      return; // No new blocks
    }

    try {
      // Fetch events from last processed block to current
      await this.fetchPrescriptionEvents(
        this.lastProcessedBlock + 1n,
        currentBlock
      );
      await this.fetchDrugInventoryEvents(
        this.lastProcessedBlock + 1n,
        currentBlock
      );

      // Update last processed block
      this.lastProcessedBlock = currentBlock;
      this.saveLastProcessedBlock();

      console.log(
        `✅ Processed blocks ${this.lastProcessedBlock + 1n} to ${currentBlock}`
      );
    } catch (error) {
      console.error("Error processing events:", error);
    }
  }

  /**
   * Fetch prescription contract events
   */
  private async fetchPrescriptionEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<void> {
    if (!CONTRACT_ADDRESSES.PRESCRIPTION) {
      return; // Contract not configured
    }

    const publicClient = baseClient.getPublicClient();

    // Fetch PrescriptionCreated events
    if (this.handlers.onPrescriptionCreated) {
      const createdLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.PRESCRIPTION,
        event: parseAbiItem(
          "event PrescriptionCreated(uint256 indexed prescriptionId, address indexed patientAddress, address indexed doctorAddress, uint256 drugId, uint256 quantity, uint256 timestamp)"
        ),
        fromBlock,
        toBlock,
      });

      for (const log of createdLogs) {
        const event: PrescriptionCreatedEvent = {
          prescriptionId: log.args.prescriptionId!,
          patientAddress: log.args.patientAddress!,
          doctorAddress: log.args.doctorAddress!,
          drugId: log.args.drugId!,
          quantity: log.args.quantity!,
          timestamp: log.args.timestamp!,
        };
        await this.handlers.onPrescriptionCreated(event, log);
      }
    }

    // Fetch PrescriptionDispensed events
    if (this.handlers.onPrescriptionDispensed) {
      const dispensedLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.PRESCRIPTION,
        event: parseAbiItem(
          "event PrescriptionDispensed(uint256 indexed prescriptionId, address indexed pharmacistAddress, uint256 quantityDispensed, uint256 timestamp, bytes32 blockchainHash)"
        ),
        fromBlock,
        toBlock,
      });

      for (const log of dispensedLogs) {
        const event: PrescriptionDispensedEvent = {
          prescriptionId: log.args.prescriptionId!,
          pharmacistAddress: log.args.pharmacistAddress!,
          quantityDispensed: log.args.quantityDispensed!,
          timestamp: log.args.timestamp!,
          blockchainHash: log.args.blockchainHash!,
        };
        await this.handlers.onPrescriptionDispensed(event, log);
      }
    }
  }

  /**
   * Fetch drug inventory contract events
   */
  private async fetchDrugInventoryEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<void> {
    if (!CONTRACT_ADDRESSES.DRUG_INVENTORY) {
      return; // Contract not configured
    }

    const publicClient = baseClient.getPublicClient();

    // Fetch DrugAdded events
    if (this.handlers.onDrugAdded) {
      const addedLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        event: parseAbiItem(
          "event DrugAdded(uint256 indexed drugId, string name, uint256 initialQuantity, address indexed pharmacistAddress, uint256 timestamp)"
        ),
        fromBlock,
        toBlock,
      });

      for (const log of addedLogs) {
        const event: DrugAddedEvent = {
          drugId: log.args.drugId!,
          name: log.args.name!,
          initialQuantity: log.args.initialQuantity!,
          pharmacistAddress: log.args.pharmacistAddress!,
          timestamp: log.args.timestamp!,
        };
        await this.handlers.onDrugAdded(event, log);
      }
    }

    // Fetch DrugStockUpdated events
    if (this.handlers.onDrugStockUpdated) {
      const updatedLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        event: parseAbiItem(
          "event DrugStockUpdated(uint256 indexed drugId, uint256 previousQuantity, uint256 newQuantity, string transactionType, address indexed performedBy, uint256 timestamp, bytes32 blockchainHash)"
        ),
        fromBlock,
        toBlock,
      });

      for (const log of updatedLogs) {
        const event: DrugStockUpdatedEvent = {
          drugId: log.args.drugId!,
          previousQuantity: log.args.previousQuantity!,
          newQuantity: log.args.newQuantity!,
          transactionType: log.args.transactionType!,
          performedBy: log.args.performedBy!,
          timestamp: log.args.timestamp!,
          blockchainHash: log.args.blockchainHash!,
        };
        await this.handlers.onDrugStockUpdated(event, log);
      }
    }
  }

  /**
   * Fetch historical events (for syncing)
   */
  public async fetchHistoricalEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<void> {
    console.log(
      `📜 Fetching historical events from block ${fromBlock} to ${toBlock}`
    );
    await this.fetchPrescriptionEvents(fromBlock, toBlock);
    await this.fetchDrugInventoryEvents(fromBlock, toBlock);
  }

  /**
   * Get last processed block
   */
  public getLastProcessedBlock(): bigint {
    return this.lastProcessedBlock;
  }

  /**
   * Set last processed block (for manual sync)
   */
  public setLastProcessedBlock(blockNumber: bigint): void {
    this.lastProcessedBlock = blockNumber;
    this.saveLastProcessedBlock();
  }

  /**
   * Load last processed block from storage
   */
  private loadLastProcessedBlock(): void {
    try {
      // In production, load from database
      // For now, we'll start from latest block
      this.lastProcessedBlock = 0n;
    } catch (error) {
      console.error("Error loading last processed block:", error);
    }
  }

  /**
   * Save last processed block to storage
   */
  private saveLastProcessedBlock(): void {
    try {
      // In production, save to database
      // This ensures we don't reprocess events after restart
    } catch (error) {
      console.error("Error saving last processed block:", error);
    }
  }

  /**
   * Check if listener is running
   */
  public isRunning(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
export const eventListenerService = EventListenerService.getInstance();
export default EventListenerService;
