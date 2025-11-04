/**
 * BlockchainService Unit Tests
 * Tests the blockchain recording functionality
 */

import { blockchainService } from "@/lib/services/BlockchainService";

describe("BlockchainService Tests", () => {
  beforeEach(() => {
    // Reset blockchain for each test
    // Note: In a real scenario, you'd want to reset the singleton instance
  });

  describe("Prescription Creation Recording", () => {
    test("should record prescription creation with correct data", () => {
      const tx = blockchainService.recordPrescriptionCreation(
        "PRESC-TEST-001",
        "DRUG-001",
        "Amoxicillin",
        30,
        "Dr. John Smith",
        "Jane Doe",
        "Take twice daily for 7 days"
      );

      expect(tx).toBeDefined();
      expect(tx.transactionId).toContain("PRESC_");
      expect(tx.prescriptionId).toBe("PRESC-TEST-001");
      expect(tx.drugId).toBe("DRUG-001");
      expect(tx.drugName).toBe("Amoxicillin");
      expect(tx.performedBy).toBe("Dr. John Smith");
      expect(tx.hash).toBeTruthy();
      expect(tx.hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    test("should generate unique transaction IDs", () => {
      const tx1 = blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        "Patient1",
        "Notes1"
      );

      const tx2 = blockchainService.recordPrescriptionCreation(
        "PRESC-002",
        "DRUG-002",
        "DrugB",
        20,
        "Doctor2",
        "Patient2",
        "Notes2"
      );

      expect(tx1.transactionId).not.toBe(tx2.transactionId);
      expect(tx1.hash).not.toBe(tx2.hash);
    });

    test("should link transactions with previous hash", () => {
      const tx1 = blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        "Patient1",
        "Notes1"
      );

      const tx2 = blockchainService.recordPrescriptionCreation(
        "PRESC-002",
        "DRUG-002",
        "DrugB",
        20,
        "Doctor2",
        "Patient2",
        "Notes2"
      );

      expect(tx2.previousHash).toBe(tx1.hash);
    });

    test("should include patient name in notes", () => {
      const patientName = "Jane Doe";
      const tx = blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        patientName,
        "Additional notes"
      );

      expect(tx.notes).toContain(patientName);
      expect(tx.notes).toContain("Additional notes");
    });
  });

  describe("Blockchain Integrity", () => {
    test("should verify chain integrity after multiple transactions", () => {
      // Create several transactions
      for (let i = 0; i < 5; i++) {
        blockchainService.recordPrescriptionCreation(
          `PRESC-${i}`,
          `DRUG-${i}`,
          `Drug${i}`,
          30,
          `Doctor${i}`,
          `Patient${i}`,
          `Notes${i}`
        );
      }

      const verification = blockchainService.verifyChain();
      expect(verification.isValid).toBe(true);
      expect(verification.message).toContain("valid");
      expect(verification.invalidTransactions).toBeUndefined();
    });

    test("should retrieve all transactions", () => {
      const initialCount = blockchainService.getAllTransactions().length;

      blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        "Patient1",
        "Notes1"
      );

      const transactions = blockchainService.getAllTransactions();
      expect(transactions.length).toBe(initialCount + 1);
    });

    test("should retrieve blockchain statistics", () => {
      blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        "Patient1",
        "Notes1"
      );

      const stats = blockchainService.getStatistics();
      expect(stats).toHaveProperty("totalTransactions");
      expect(stats).toHaveProperty("chainIntegrity");
      expect(stats.chainIntegrity.isValid).toBe(true);
    });
  });

  describe("Transaction Retrieval", () => {
    test("should get recent transactions", () => {
      // Create multiple transactions
      for (let i = 0; i < 10; i++) {
        blockchainService.recordPrescriptionCreation(
          `PRESC-${i}`,
          `DRUG-${i}`,
          `Drug${i}`,
          30,
          `Doctor${i}`,
          `Patient${i}`,
          `Notes${i}`
        );
      }

      const recent = blockchainService.getRecentTransactions(5);
      expect(recent.length).toBeLessThanOrEqual(5);

      // Most recent should be first
      if (recent.length > 1) {
        expect(recent[0].timestamp).toBeGreaterThanOrEqual(recent[1].timestamp);
      }
    });

    test("should export blockchain data", () => {
      blockchainService.recordPrescriptionCreation(
        "PRESC-001",
        "DRUG-001",
        "DrugA",
        30,
        "Doctor1",
        "Patient1",
        "Notes1"
      );

      const chain = blockchainService.exportChain();
      expect(Array.isArray(chain)).toBe(true);
      expect(chain.length).toBeGreaterThan(0);
    });
  });
});
