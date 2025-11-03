// Blockchain service for drug inventory traceability
// Records all inventory transactions with cryptographic hash verification

import crypto from "crypto";

export interface BlockchainTransaction {
  transactionId: string;
  timestamp: number;
  drugId: string;
  drugName: string;
  transactionType:
    | "stock_in"
    | "dispensed"
    | "expired"
    | "damaged"
    | "returned"
    | "adjustment";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  performedBy: string;
  performedByRole: string;
  prescriptionId?: string;
  batchNumber?: string;
  notes?: string;
  previousHash: string;
  hash: string;
}

export interface BlockchainVerificationResult {
  isValid: boolean;
  message: string;
  invalidTransactions?: string[];
}

class BlockchainService {
  private chain: BlockchainTransaction[] = [];
  private static instance: BlockchainService;

  private constructor() {
    // Initialize with genesis block
    this.createGenesisBlock();
  }

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Create the genesis (first) block in the chain
   */
  private createGenesisBlock(): void {
    const genesisBlock: BlockchainTransaction = {
      transactionId: "genesis",
      timestamp: Date.now(),
      drugId: "0",
      drugName: "Genesis Block",
      transactionType: "stock_in",
      quantity: 0,
      previousQuantity: 0,
      newQuantity: 0,
      performedBy: "system",
      performedByRole: "system",
      notes: "Genesis block - Start of inventory blockchain",
      previousHash: "0",
      hash: this.calculateHash({
        transactionId: "genesis",
        timestamp: Date.now(),
        drugId: "0",
        drugName: "Genesis Block",
        transactionType: "stock_in",
        quantity: 0,
        previousQuantity: 0,
        newQuantity: 0,
        performedBy: "system",
        performedByRole: "system",
        previousHash: "0",
      }),
    };
    this.chain.push(genesisBlock);
  }

  /**
   * Calculate SHA-256 hash for a transaction
   */
  private calculateHash(transaction: Partial<BlockchainTransaction>): string {
    const data = JSON.stringify({
      transactionId: transaction.transactionId,
      timestamp: transaction.timestamp,
      drugId: transaction.drugId,
      drugName: transaction.drugName,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      previousQuantity: transaction.previousQuantity,
      newQuantity: transaction.newQuantity,
      performedBy: transaction.performedBy,
      performedByRole: transaction.performedByRole,
      prescriptionId: transaction.prescriptionId,
      batchNumber: transaction.batchNumber,
      notes: transaction.notes,
      previousHash: transaction.previousHash,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get the latest transaction in the chain
   */
  private getLatestTransaction(): BlockchainTransaction {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new transaction to the blockchain
   */
  public addTransaction(
    transactionData: Omit<
      BlockchainTransaction,
      "previousHash" | "hash" | "timestamp"
    >
  ): BlockchainTransaction {
    const previousTransaction = this.getLatestTransaction();
    const timestamp = Date.now();

    const newTransaction: BlockchainTransaction = {
      ...transactionData,
      timestamp,
      previousHash: previousTransaction.hash,
      hash: "",
    };

    // Calculate hash for the new transaction
    newTransaction.hash = this.calculateHash(newTransaction);

    // Add to chain
    this.chain.push(newTransaction);

    console.log(
      `✅ Blockchain: Added transaction ${newTransaction.transactionId}`
    );
    console.log(
      `   Drug: ${newTransaction.drugName} (${newTransaction.drugId})`
    );
    console.log(`   Type: ${newTransaction.transactionType}`);
    console.log(`   Quantity: ${newTransaction.quantity}`);
    console.log(`   Hash: ${newTransaction.hash.substring(0, 16)}...`);

    return newTransaction;
  }

  /**
   * Create a stock-in transaction (adding inventory)
   */
  public recordStockIn(
    drugId: string,
    drugName: string,
    quantity: number,
    previousQuantity: number,
    performedBy: string,
    performedByRole: string,
    batchNumber?: string,
    notes?: string
  ): BlockchainTransaction {
    return this.addTransaction({
      transactionId: `STOCK_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      drugId,
      drugName,
      transactionType: "stock_in",
      quantity,
      previousQuantity,
      newQuantity: previousQuantity + quantity,
      performedBy,
      performedByRole,
      batchNumber,
      notes,
    });
  }

  /**
   * Create a dispensing transaction
   */
  public recordDispensing(
    drugId: string,
    drugName: string,
    quantity: number,
    previousQuantity: number,
    performedBy: string,
    performedByRole: string,
    prescriptionId: string,
    notes?: string
  ): BlockchainTransaction {
    return this.addTransaction({
      transactionId: `DISP_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      drugId,
      drugName,
      transactionType: "dispensed",
      quantity,
      previousQuantity,
      newQuantity: previousQuantity - quantity,
      performedBy,
      performedByRole,
      prescriptionId,
      notes,
    });
  }

  /**
   * Create an expired drugs removal transaction
   */
  public recordExpiry(
    drugId: string,
    drugName: string,
    quantity: number,
    previousQuantity: number,
    performedBy: string,
    performedByRole: string,
    batchNumber?: string,
    notes?: string
  ): BlockchainTransaction {
    return this.addTransaction({
      transactionId: `EXP_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      drugId,
      drugName,
      transactionType: "expired",
      quantity,
      previousQuantity,
      newQuantity: previousQuantity - quantity,
      performedBy,
      performedByRole,
      batchNumber,
      notes,
    });
  }

  /**
   * Create a damaged drugs removal transaction
   */
  public recordDamage(
    drugId: string,
    drugName: string,
    quantity: number,
    previousQuantity: number,
    performedBy: string,
    performedByRole: string,
    notes?: string
  ): BlockchainTransaction {
    return this.addTransaction({
      transactionId: `DMG_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      drugId,
      drugName,
      transactionType: "damaged",
      quantity,
      previousQuantity,
      newQuantity: previousQuantity - quantity,
      performedBy,
      performedByRole,
      notes,
    });
  }

  /**
   * Create a stock adjustment transaction
   */
  public recordAdjustment(
    drugId: string,
    drugName: string,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    performedBy: string,
    performedByRole: string,
    notes?: string
  ): BlockchainTransaction {
    return this.addTransaction({
      transactionId: `ADJ_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      drugId,
      drugName,
      transactionType: "adjustment",
      quantity,
      previousQuantity,
      newQuantity,
      performedBy,
      performedByRole,
      notes,
    });
  }

  /**
   * Verify the integrity of the blockchain
   */
  public verifyChain(): BlockchainVerificationResult {
    const invalidTransactions: string[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      const currentTransaction = this.chain[i];
      const previousTransaction = this.chain[i - 1];

      // Verify hash
      const recalculatedHash = this.calculateHash(currentTransaction);
      if (currentTransaction.hash !== recalculatedHash) {
        invalidTransactions.push(
          `Transaction ${currentTransaction.transactionId}: Hash mismatch`
        );
      }

      // Verify previous hash link
      if (currentTransaction.previousHash !== previousTransaction.hash) {
        invalidTransactions.push(
          `Transaction ${currentTransaction.transactionId}: Previous hash link broken`
        );
      }
    }

    if (invalidTransactions.length > 0) {
      return {
        isValid: false,
        message: "Blockchain integrity compromised",
        invalidTransactions,
      };
    }

    return {
      isValid: true,
      message: "Blockchain is valid and intact",
    };
  }

  /**
   * Get transaction history for a specific drug
   */
  public getDrugHistory(drugId: string): BlockchainTransaction[] {
    return this.chain.filter(
      (transaction) =>
        transaction.drugId === drugId && transaction.drugId !== "0"
    );
  }

  /**
   * Get all transactions
   */
  public getAllTransactions(): BlockchainTransaction[] {
    return this.chain.filter((transaction) => transaction.drugId !== "0");
  }

  /**
   * Get recent transactions (last N)
   */
  public getRecentTransactions(limit: number = 10): BlockchainTransaction[] {
    const transactions = this.getAllTransactions();
    return transactions.slice(-limit).reverse();
  }

  /**
   * Get transaction by ID
   */
  public getTransactionById(
    transactionId: string
  ): BlockchainTransaction | undefined {
    return this.chain.find(
      (transaction) => transaction.transactionId === transactionId
    );
  }

  /**
   * Get blockchain statistics
   */
  public getStatistics() {
    const transactions = this.getAllTransactions();

    return {
      totalTransactions: transactions.length,
      stockInCount: transactions.filter((t) => t.transactionType === "stock_in")
        .length,
      dispensedCount: transactions.filter(
        (t) => t.transactionType === "dispensed"
      ).length,
      expiredCount: transactions.filter((t) => t.transactionType === "expired")
        .length,
      damagedCount: transactions.filter((t) => t.transactionType === "damaged")
        .length,
      adjustmentCount: transactions.filter(
        (t) => t.transactionType === "adjustment"
      ).length,
      totalDrugsTracked: new Set(transactions.map((t) => t.drugId)).size,
      chainIntegrity: this.verifyChain(),
    };
  }

  /**
   * Export blockchain data
   */
  public exportChain(): BlockchainTransaction[] {
    return [...this.chain];
  }

  /**
   * Get blockchain size
   */
  public getChainSize(): number {
    return this.chain.length;
  }
}

// Export singleton instance
export const blockchainService = BlockchainService.getInstance();
export default BlockchainService;
