/**
 * TraceabilityService
 * Handles blockchain interactions for drug traceability
 * Tracks drug movement from manufacturer → pharmacist → patient
 */

import { ethers } from "ethers";
import {
  DrugTraceabilityContractABI,
  CONTRACT_ADDRESSES,
  DrugBatch,
  MovementRecord,
  DispensingRecord,
  MovementType,
} from "../blockchain/contracts";

export class TraceabilityService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize the blockchain provider and contract
   */
  private async initializeProvider() {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      if (CONTRACT_ADDRESSES.DRUG_TRACEABILITY) {
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESSES.DRUG_TRACEABILITY,
          DrugTraceabilityContractABI,
          this.provider
        );
      }
    } catch (error) {
      console.error("Failed to initialize TraceabilityService:", error);
    }
  }

  /**
   * Set the signer for transactions
   */
  public setSigner(signer: ethers.Signer) {
    this.signer = signer;
    if (this.contract) {
      this.contract = this.contract.connect(signer);
    }
  }

  /**
   * Create a new drug batch (manufacturer action)
   */
  async createDrugBatch(
    drugName: string,
    batchNumber: string,
    quantity: number,
    manufacturedDate: Date,
    expiryDate: Date,
    metadataHash?: string
  ): Promise<{
    success: boolean;
    batchId?: number;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      const manufacturedTimestamp = Math.floor(
        manufacturedDate.getTime() / 1000
      );
      const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
      const hash = metadataHash || ethers.ZeroHash;

      const tx = await this.contract.createDrugBatch(
        drugName,
        batchNumber,
        quantity,
        manufacturedTimestamp,
        expiryTimestamp,
        hash
      );

      const receipt = await tx.wait();

      // Extract batchId from event
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id(
            "DrugBatchCreated(uint256,string,string,address,uint256,uint256,uint256,uint256)"
          )
      );

      let batchId: number | undefined;
      if (event) {
        const parsedLog = this.contract.interface.parseLog({
          topics: event.topics as string[],
          data: event.data,
        });
        batchId = Number(parsedLog?.args[0]);
      }

      return {
        success: true,
        batchId,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Error creating drug batch:", error);
      return {
        success: false,
        error: error.message || "Failed to create drug batch",
      };
    }
  }

  /**
   * Record drug receipt by pharmacist
   */
  async recordPharmacistReceipt(
    batchId: number,
    quantity: number,
    notes: string = ""
  ): Promise<{
    success: boolean;
    movementId?: number;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      const tx = await this.contract.recordPharmacistReceipt(
        batchId,
        quantity,
        notes
      );
      const receipt = await tx.wait();

      // Extract movementId from event
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id(
            "DrugMovementRecorded(uint256,uint256,uint8,address,address,uint256,uint256,bytes32)"
          )
      );

      let movementId: number | undefined;
      if (event) {
        const parsedLog = this.contract.interface.parseLog({
          topics: event.topics as string[],
          data: event.data,
        });
        movementId = Number(parsedLog?.args[0]);
      }

      return {
        success: true,
        movementId,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Error recording pharmacist receipt:", error);
      return {
        success: false,
        error: error.message || "Failed to record pharmacist receipt",
      };
    }
  }

  /**
   * Record drug dispensing to patient
   */
  async recordPatientDispensing(
    batchId: number,
    prescriptionId: number,
    patientAddress: string,
    quantity: number
  ): Promise<{
    success: boolean;
    dispensingId?: number;
    verificationHash?: string;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      const tx = await this.contract.recordPatientDispensing(
        batchId,
        prescriptionId,
        patientAddress,
        quantity
      );
      const receipt = await tx.wait();

      // Extract dispensingId and verificationHash from event
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id(
            "DrugDispensed(uint256,uint256,uint256,address,address,uint256,bytes32,uint256)"
          )
      );

      let dispensingId: number | undefined;
      let verificationHash: string | undefined;

      if (event) {
        const parsedLog = this.contract.interface.parseLog({
          topics: event.topics as string[],
          data: event.data,
        });
        dispensingId = Number(parsedLog?.args[0]);
        verificationHash = parsedLog?.args[6]; // verificationHash
      }

      return {
        success: true,
        dispensingId,
        verificationHash,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Error recording patient dispensing:", error);
      return {
        success: false,
        error: error.message || "Failed to record patient dispensing",
      };
    }
  }

  /**
   * Verify drug authenticity using verification hash
   */
  async verifyDrugAuthenticity(verificationHash: string): Promise<{
    success: boolean;
    dispensing?: DispensingRecord;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract or signer not initialized");
      }

      const tx = await this.contract.verifyDrugAuthenticity(verificationHash);
      const receipt = await tx.wait();

      // Get the return value from the transaction
      const dispensing = await this.contract.getDispensingDetails(
        receipt.logs[0].args?.dispensingId
      );

      return {
        success: true,
        dispensing: this.parseDispensingRecord(dispensing),
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Error verifying drug authenticity:", error);
      return {
        success: false,
        error: error.message || "Failed to verify drug authenticity",
      };
    }
  }

  /**
   * Get batch movement history (for auditing)
   */
  async getBatchMovementHistory(batchId: number): Promise<{
    success: boolean;
    movements?: MovementRecord[];
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const movements = await this.contract.getBatchMovementHistory(batchId);

      return {
        success: true,
        movements: movements.map((m: any) => this.parseMovementRecord(m)),
      };
    } catch (error: any) {
      console.error("Error fetching batch movement history:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch batch movement history",
      };
    }
  }

  /**
   * Get batch details
   */
  async getBatchDetails(batchId: number): Promise<{
    success: boolean;
    batch?: DrugBatch;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const batch = await this.contract.getBatchDetails(batchId);

      return {
        success: true,
        batch: this.parseBatch(batch),
      };
    } catch (error: any) {
      console.error("Error fetching batch details:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch batch details",
      };
    }
  }

  /**
   * Get patient dispensing records
   */
  async getPatientDispensings(patientAddress: string): Promise<{
    success: boolean;
    dispensingIds?: number[];
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const dispensingIds = await this.contract.getPatientDispensings(
        patientAddress
      );

      return {
        success: true,
        dispensingIds: dispensingIds.map((id: bigint) => Number(id)),
      };
    } catch (error: any) {
      console.error("Error fetching patient dispensings:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch patient dispensings",
      };
    }
  }

  /**
   * Get dispensing details
   */
  async getDispensingDetails(dispensingId: number): Promise<{
    success: boolean;
    dispensing?: DispensingRecord;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const dispensing = await this.contract.getDispensingDetails(dispensingId);

      return {
        success: true,
        dispensing: this.parseDispensingRecord(dispensing),
      };
    } catch (error: any) {
      console.error("Error fetching dispensing details:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch dispensing details",
      };
    }
  }

  /**
   * Get batch dispensing records
   */
  async getBatchDispensings(batchId: number): Promise<{
    success: boolean;
    dispensingIds?: number[];
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const dispensingIds = await this.contract.getBatchDispensings(batchId);

      return {
        success: true,
        dispensingIds: dispensingIds.map((id: bigint) => Number(id)),
      };
    } catch (error: any) {
      console.error("Error fetching batch dispensings:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch batch dispensings",
      };
    }
  }

  /**
   * Get total statistics
   */
  async getStatistics(): Promise<{
    success: boolean;
    stats?: {
      totalBatches: number;
      totalMovements: number;
      totalDispensings: number;
    };
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const [totalBatches, totalMovements, totalDispensings] =
        await Promise.all([
          this.contract.getTotalBatches(),
          this.contract.getTotalMovements(),
          this.contract.getTotalDispensings(),
        ]);

      return {
        success: true,
        stats: {
          totalBatches: Number(totalBatches),
          totalMovements: Number(totalMovements),
          totalDispensings: Number(totalDispensings),
        },
      };
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch statistics",
      };
    }
  }

  /**
   * Helper: Parse batch from contract response
   */
  private parseBatch(batch: any): DrugBatch {
    return {
      batchId: BigInt(batch.batchId),
      drugName: batch.drugName,
      batchNumber: batch.batchNumber,
      manufacturer: batch.manufacturer,
      manufacturedDate: BigInt(batch.manufacturedDate),
      expiryDate: BigInt(batch.expiryDate),
      initialQuantity: BigInt(batch.initialQuantity),
      remainingQuantity: BigInt(batch.remainingQuantity),
      isActive: batch.isActive,
      metadataHash: batch.metadataHash,
    };
  }

  /**
   * Helper: Parse movement record from contract response
   */
  private parseMovementRecord(movement: any): MovementRecord {
    return {
      movementId: BigInt(movement.movementId),
      batchId: BigInt(movement.batchId),
      movementType: Number(movement.movementType),
      fromAddress: movement.fromAddress,
      toAddress: movement.toAddress,
      quantity: BigInt(movement.quantity),
      timestamp: BigInt(movement.timestamp),
      transactionHash: movement.transactionHash,
      notes: movement.notes,
      prescriptionId: BigInt(movement.prescriptionId),
    };
  }

  /**
   * Helper: Parse dispensing record from contract response
   */
  private parseDispensingRecord(dispensing: any): DispensingRecord {
    return {
      dispensingId: BigInt(dispensing.dispensingId),
      batchId: BigInt(dispensing.batchId),
      prescriptionId: BigInt(dispensing.prescriptionId),
      patientAddress: dispensing.patientAddress,
      pharmacistAddress: dispensing.pharmacistAddress,
      quantity: BigInt(dispensing.quantity),
      timestamp: BigInt(dispensing.timestamp),
      verificationHash: dispensing.verificationHash,
      isVerified: dispensing.isVerified,
    };
  }

  /**
   * Helper: Convert movement type enum to string
   */
  static movementTypeToString(type: number): string {
    const types = [
      "manufactured",
      "received_by_pharmacist",
      "dispensed_to_patient",
      "returned",
      "destroyed",
    ];
    return types[type] || "unknown";
  }

  /**
   * Check if contract is initialized
   */
  public isInitialized(): boolean {
    return this.contract !== null && this.provider !== null;
  }
}

// Export singleton instance
export const traceabilityService = new TraceabilityService();
