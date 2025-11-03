// Smart Contract Interaction Service
// Handles writing transactions to smart contracts

import { baseClient } from "./BaseClient";
import {
  PrescriptionContractABI,
  DrugInventoryContractABI,
  CONTRACT_ADDRESSES,
} from "./contracts";
import { encodeFunctionData, parseEther } from "viem";

/**
 * Contract Interaction Service
 * Methods for submitting transactions to smart contracts
 */
export class ContractService {
  private static instance: ContractService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  /**
   * Create a prescription on-chain
   */
  public async createPrescription(
    patientAddress: `0x${string}`,
    drugId: bigint,
    quantity: bigint,
    dosageInstructions: string,
    duration: bigint
  ): Promise<{ txHash: `0x${string}`; prescriptionId: bigint }> {
    try {
      const walletClient = baseClient.getWalletClient();
      if (!walletClient) {
        throw new Error("Wallet client not initialized");
      }

      const publicClient = baseClient.getPublicClient();

      // Encode function call
      const data = encodeFunctionData({
        abi: PrescriptionContractABI,
        functionName: "createPrescription",
        args: [patientAddress, drugId, quantity, dosageInstructions, duration],
      });

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESSES.PRESCRIPTION,
        data,
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      // Extract prescription ID from logs
      const prescriptionId = receipt.logs[0]?.topics[1]
        ? BigInt(receipt.logs[0].topics[1])
        : 0n;

      console.log(`✅ Prescription created on-chain: ${prescriptionId}`);
      console.log(`   Transaction: ${txHash}`);

      return { txHash, prescriptionId };
    } catch (error) {
      console.error("Error creating prescription on-chain:", error);
      throw error;
    }
  }

  /**
   * Dispense a prescription on-chain
   */
  public async dispensePrescription(
    prescriptionId: bigint,
    quantityDispensed: bigint,
    blockchainHash: `0x${string}`
  ): Promise<{ txHash: `0x${string}` }> {
    try {
      const walletClient = baseClient.getWalletClient();
      if (!walletClient) {
        throw new Error("Wallet client not initialized");
      }

      const publicClient = baseClient.getPublicClient();

      // Encode function call
      const data = encodeFunctionData({
        abi: PrescriptionContractABI,
        functionName: "dispensePrescription",
        args: [prescriptionId, quantityDispensed, blockchainHash],
      });

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESSES.PRESCRIPTION,
        data,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      console.log(`✅ Prescription dispensed on-chain: ${prescriptionId}`);
      console.log(`   Transaction: ${txHash}`);

      return { txHash };
    } catch (error) {
      console.error("Error dispensing prescription on-chain:", error);
      throw error;
    }
  }

  /**
   * Add a drug to inventory on-chain
   */
  public async addDrug(
    name: string,
    genericName: string,
    initialQuantity: bigint,
    minimumStockLevel: bigint,
    expiryDate: bigint,
    batchNumber: string
  ): Promise<{ txHash: `0x${string}`; drugId: bigint }> {
    try {
      const walletClient = baseClient.getWalletClient();
      if (!walletClient) {
        throw new Error("Wallet client not initialized");
      }

      const publicClient = baseClient.getPublicClient();

      // Encode function call
      const data = encodeFunctionData({
        abi: DrugInventoryContractABI,
        functionName: "addDrug",
        args: [
          name,
          genericName,
          initialQuantity,
          minimumStockLevel,
          expiryDate,
          batchNumber,
        ],
      });

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        data,
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      // Extract drug ID from logs
      const drugId = receipt.logs[0]?.topics[1]
        ? BigInt(receipt.logs[0].topics[1])
        : 0n;

      console.log(`✅ Drug added on-chain: ${drugId} (${name})`);
      console.log(`   Transaction: ${txHash}`);

      return { txHash, drugId };
    } catch (error) {
      console.error("Error adding drug on-chain:", error);
      throw error;
    }
  }

  /**
   * Update drug stock on-chain
   */
  public async updateDrugStock(
    drugId: bigint,
    quantityChange: bigint,
    transactionType: string,
    blockchainHash: `0x${string}`
  ): Promise<{ txHash: `0x${string}` }> {
    try {
      const walletClient = baseClient.getWalletClient();
      if (!walletClient) {
        throw new Error("Wallet client not initialized");
      }

      const publicClient = baseClient.getPublicClient();

      // Encode function call
      const data = encodeFunctionData({
        abi: DrugInventoryContractABI,
        functionName: "updateStock",
        args: [drugId, quantityChange, transactionType, blockchainHash],
      });

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        data,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      console.log(`✅ Drug stock updated on-chain: ${drugId}`);
      console.log(`   Transaction: ${txHash}`);

      return { txHash };
    } catch (error) {
      console.error("Error updating drug stock on-chain:", error);
      throw error;
    }
  }

  /**
   * Get prescription from blockchain
   */
  public async getPrescription(prescriptionId: bigint) {
    try {
      const publicClient = baseClient.getPublicClient();

      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.PRESCRIPTION,
        abi: PrescriptionContractABI,
        functionName: "getPrescription",
        args: [prescriptionId],
      });

      return result;
    } catch (error) {
      console.error("Error reading prescription from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get drug from blockchain
   */
  public async getDrug(drugId: bigint) {
    try {
      const publicClient = baseClient.getPublicClient();

      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        abi: DrugInventoryContractABI,
        functionName: "getDrug",
        args: [drugId],
      });

      return result;
    } catch (error) {
      console.error("Error reading drug from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get drug stock level from blockchain
   */
  public async getDrugStockLevel(drugId: bigint): Promise<bigint> {
    try {
      const publicClient = baseClient.getPublicClient();

      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DRUG_INVENTORY,
        abi: DrugInventoryContractABI,
        functionName: "getStockLevel",
        args: [drugId],
      });

      return result as bigint;
    } catch (error) {
      console.error("Error reading drug stock from blockchain:", error);
      throw error;
    }
  }

  /**
   * Check if contracts are configured
   */
  public areContractsConfigured(): boolean {
    return !!(
      CONTRACT_ADDRESSES.PRESCRIPTION && CONTRACT_ADDRESSES.DRUG_INVENTORY
    );
  }
}

// Export singleton instance
export const contractService = ContractService.getInstance();
export default ContractService;
