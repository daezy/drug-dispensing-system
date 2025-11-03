const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DrugInventoryContract", function () {
  let drugInventoryContract;
  let owner, pharmacist, manager, unauthorized;
  let PHARMACIST_ROLE, MANAGER_ROLE, DEFAULT_ADMIN_ROLE;

  beforeEach(async function () {
    // Get signers
    [owner, pharmacist, manager, unauthorized] = await ethers.getSigners();

    // Deploy contract
    const DrugInventoryContract = await ethers.getContractFactory(
      "DrugInventoryContract"
    );
    drugInventoryContract = await DrugInventoryContract.deploy();
    await drugInventoryContract.waitForDeployment();

    // Get role hashes
    PHARMACIST_ROLE = await drugInventoryContract.PHARMACIST_ROLE();
    MANAGER_ROLE = await drugInventoryContract.MANAGER_ROLE();
    DEFAULT_ADMIN_ROLE = await drugInventoryContract.DEFAULT_ADMIN_ROLE();

    // Grant roles
    await drugInventoryContract.grantRole(PHARMACIST_ROLE, pharmacist.address);
    await drugInventoryContract.grantRole(MANAGER_ROLE, manager.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(
        await drugInventoryContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)
      ).to.be.true;
    });

    it("Should initialize drug counter to 0", async function () {
      await expect(drugInventoryContract.getDrug(0)).to.be.revertedWith(
        "Drug does not exist"
      );
    });
  });

  describe("Role Management", function () {
    it("Should grant PHARMACIST_ROLE correctly", async function () {
      expect(
        await drugInventoryContract.hasRole(PHARMACIST_ROLE, pharmacist.address)
      ).to.be.true;
    });

    it("Should grant MANAGER_ROLE correctly", async function () {
      expect(await drugInventoryContract.hasRole(MANAGER_ROLE, manager.address))
        .to.be.true;
    });

    it("Should allow admin to grant roles", async function () {
      const newPharmacist = unauthorized;
      await drugInventoryContract.grantRole(
        PHARMACIST_ROLE,
        newPharmacist.address
      );
      expect(
        await drugInventoryContract.hasRole(
          PHARMACIST_ROLE,
          newPharmacist.address
        )
      ).to.be.true;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .grantRole(PHARMACIST_ROLE, unauthorized.address)
      ).to.be.reverted;
    });
  });

  describe("Add Drug", function () {
    it("Should allow pharmacist to add drug", async function () {
      const name = "Paracetamol";
      const genericName = "Acetaminophen";
      const initialQuantity = 1000;
      const minimumStockLevel = 100;
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
      const batchNumber = "BATCH123";

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug(
            name,
            genericName,
            initialQuantity,
            minimumStockLevel,
            expiryDate,
            batchNumber
          )
      ).to.emit(drugInventoryContract, "DrugAdded");
    });

    it("Should increment drug ID", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug1", "Generic1", 100, 10, expiryDate, "BATCH1");
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug2", "Generic2", 200, 20, expiryDate, "BATCH2");

      const drug1 = await drugInventoryContract.getDrug(1);
      const drug2 = await drugInventoryContract.getDrug(2);

      expect(drug1.name).to.equal("Drug1");
      expect(drug2.name).to.equal("Drug2");
    });

    it("Should set correct drug data", async function () {
      const name = "Paracetamol";
      const genericName = "Acetaminophen";
      const initialQuantity = 1000;
      const minimumStockLevel = 100;
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const batchNumber = "BATCH123";

      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          name,
          genericName,
          initialQuantity,
          minimumStockLevel,
          expiryDate,
          batchNumber
        );

      const drug = await drugInventoryContract.getDrug(1);

      expect(drug.name).to.equal(name);
      expect(drug.genericName).to.equal(genericName);
      expect(drug.currentQuantity).to.equal(initialQuantity);
      expect(drug.minimumStockLevel).to.equal(minimumStockLevel);
      expect(drug.expiryDate).to.equal(expiryDate);
      expect(drug.batchNumber).to.equal(batchNumber);
      expect(drug.isActive).to.be.true;
    });

    it("Should not allow non-pharmacist to add drug", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        drugInventoryContract
          .connect(unauthorized)
          .addDrug("Drug", "Generic", 100, 10, expiryDate, "BATCH")
      ).to.be.reverted;
    });

    it("Should not allow empty name", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug("", "Generic", 100, 10, expiryDate, "BATCH")
      ).to.be.revertedWith("Drug name cannot be empty");
    });

    it("Should not allow past expiry date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 1000;

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug("Drug", "Generic", 100, 10, pastDate, "BATCH")
      ).to.be.revertedWith("Expiry date must be in the future");
    });

    it("Should emit LowStockAlert if quantity <= reorderLevel", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug("Drug", "Generic", 50, 100, expiryDate, "BATCH")
      ).to.emit(drugInventoryContract, "LowStockAlert");
    });
  });

  describe("Update Stock", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should allow pharmacist to update stock (increase)", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, 500, "Restocking", ethers.ZeroHash)
      ).to.emit(drugInventoryContract, "DrugStockUpdated");
    });

    it("Should allow pharmacist to update stock (decrease)", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, -300, "Sale", ethers.ZeroHash)
      ).to.emit(drugInventoryContract, "DrugStockUpdated");
    });

    it("Should update drug quantity correctly", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 500, "Restocking", ethers.ZeroHash);
      let drug = await drugInventoryContract.getDrug(1);
      expect(drug.currentQuantity).to.equal(1500);

      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, -200, "Sale", ethers.ZeroHash);
      drug = await drugInventoryContract.getDrug(1);
      expect(drug.currentQuantity).to.equal(1300);
    });

    it("Should record stock transaction", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 500, "Restocking", ethers.ZeroHash);

      const transactions = await drugInventoryContract.getDrugTransactions(1);
      expect(transactions.length).to.equal(1);
      expect(transactions[0].quantityChange).to.equal(500);
      expect(transactions[0].transactionType).to.equal("Restocking");
      expect(transactions[0].performedBy).to.equal(pharmacist.address);
    });

    it("Should emit LowStockAlert when stock goes below reorder level", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, -950, "Large order", ethers.ZeroHash)
      ).to.emit(drugInventoryContract, "LowStockAlert");
    });

    it("Should not allow non-pharmacist to update stock", async function () {
      await expect(
        drugInventoryContract
          .connect(unauthorized)
          .updateStock(1, 100, "Test", ethers.ZeroHash)
      ).to.be.reverted;
    });

    it("Should not allow zero amount", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, 0, "Test", ethers.ZeroHash)
      ).to.be.revertedWith("Quantity change cannot be zero");
    });

    it("Should not allow reducing stock below zero", async function () {
      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, -2000, "Too much", ethers.ZeroHash)
      ).to.be.revertedWith("Insufficient stock");
    });

    it("Should not allow updating inactive drug", async function () {
      await drugInventoryContract.connect(manager).deactivateDrug(1);

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, 100, "Test", ethers.ZeroHash)
      ).to.be.revertedWith("Drug is not active");
    });

    it("Should not allow updating expired drug", async function () {
      await drugInventoryContract.connect(manager).markDrugExpired(1);

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, 100, "Test", ethers.ZeroHash)
      ).to.be.revertedWith("Drug is not active");
    });
  });

  describe("Mark Drug Expired", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should allow manager to mark drug as expired", async function () {
      await expect(drugInventoryContract.connect(manager).markDrugExpired(1))
        .to.emit(drugInventoryContract, "DrugExpired")
        .withArgs(1);
    });

    it("Should update drug expired status", async function () {
      await drugInventoryContract.connect(manager).markDrugExpired(1);
      const drug = await drugInventoryContract.getDrug(1);
      expect(drug.isExpired).to.be.true;
    });

    it("Should not allow non-manager to mark expired", async function () {
      await expect(
        drugInventoryContract.connect(unauthorized).markDrugExpired(1)
      ).to.be.reverted;
    });

    it("Should not mark non-existent drug", async function () {
      await expect(
        drugInventoryContract.connect(manager).markDrugExpired(999)
      ).to.be.revertedWith("Drug does not exist");
    });

    it("Should not mark already expired drug", async function () {
      await drugInventoryContract.connect(manager).markDrugExpired(1);

      await expect(
        drugInventoryContract.connect(manager).markDrugExpired(1)
      ).to.be.revertedWith("Drug is already marked as expired");
    });
  });

  describe("Deactivate Drug", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should allow manager to deactivate drug", async function () {
      await expect(drugInventoryContract.connect(manager).deactivateDrug(1))
        .to.emit(drugInventoryContract, "DrugDeactivated")
        .withArgs(1);
    });

    it("Should update drug active status", async function () {
      await drugInventoryContract.connect(manager).deactivateDrug(1);
      const drug = await drugInventoryContract.getDrug(1);
      expect(drug.isActive).to.be.false;
    });

    it("Should not allow non-manager to deactivate", async function () {
      await expect(
        drugInventoryContract.connect(unauthorized).deactivateDrug(1)
      ).to.be.reverted;
    });

    it("Should not deactivate already inactive drug", async function () {
      await drugInventoryContract.connect(manager).deactivateDrug(1);

      await expect(
        drugInventoryContract.connect(manager).deactivateDrug(1)
      ).to.be.revertedWith("Drug is already inactive");
    });
  });

  describe("Get Stock Level", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should return correct stock level", async function () {
      const stockLevel = await drugInventoryContract.getStockLevel(1);
      expect(stockLevel).to.equal(1000);
    });

    it("Should return updated stock level", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 500, "Restocking", ethers.ZeroHash);
      const stockLevel = await drugInventoryContract.getStockLevel(1);
      expect(stockLevel).to.equal(1500);
    });

    it("Should revert for non-existent drug", async function () {
      await expect(drugInventoryContract.getStockLevel(999)).to.be.revertedWith(
        "Drug does not exist"
      );
    });
  });

  describe("Is Low Stock", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should return false when stock is above reorder level", async function () {
      const isLow = await drugInventoryContract.isLowStock(1);
      expect(isLow).to.be.false;
    });

    it("Should return true when stock is at reorder level", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, -900, "Sale", ethers.ZeroHash);
      const isLow = await drugInventoryContract.isLowStock(1);
      expect(isLow).to.be.true;
    });

    it("Should return true when stock is below reorder level", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, -950, "Sale", ethers.ZeroHash);
      const isLow = await drugInventoryContract.isLowStock(1);
      expect(isLow).to.be.true;
    });
  });

  describe("Get Stock History", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug(
          "Paracetamol",
          "Acetaminophen",
          1000,
          100,
          expiryDate,
          "BATCH123"
        );
    });

    it("Should return empty array for drug with no transactions", async function () {
      const history = await drugInventoryContract.getDrugTransactions(1);
      expect(history.length).to.equal(0);
    });

    it("Should return all transactions for a drug", async function () {
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 500, "Restocking", ethers.ZeroHash);
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, -200, "Sale", ethers.ZeroHash);
      await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 100, "Return", ethers.ZeroHash);

      const history = await drugInventoryContract.getDrugTransactions(1);
      expect(history.length).to.equal(3);

      expect(history[0].quantityChange).to.equal(500);
      expect(history[0].transactionType).to.equal("Restocking");

      expect(history[1].quantityChange).to.equal(-200);
      expect(history[1].transactionType).to.equal("Sale");

      expect(history[2].quantityChange).to.equal(100);
      expect(history[2].transactionType).to.equal("Return");
    });

    it("Should record timestamp for each transaction", async function () {
      const tx = await drugInventoryContract
        .connect(pharmacist)
        .updateStock(1, 500, "Test", ethers.ZeroHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const history = await drugInventoryContract.getDrugTransactions(1);
      expect(history[0].timestamp).to.equal(block.timestamp);
    });
  });

  describe("Get Active Drugs", function () {
    it("Should return all active drugs", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug1", "Generic1", 100, 10, expiryDate, "BATCH1");
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug2", "Generic2", 200, 20, expiryDate, "BATCH2");
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug3", "Generic3", 300, 30, expiryDate, "BATCH3");

      await drugInventoryContract.connect(manager).deactivateDrug(2);

      const activeDrugs = await drugInventoryContract.getActiveDrugs();
      expect(activeDrugs.length).to.equal(2);
      expect(activeDrugs[0]).to.equal(1);
      expect(activeDrugs[1]).to.equal(3);
    });

    it("Should return empty array when no active drugs", async function () {
      const activeDrugs = await drugInventoryContract.getActiveDrugs();
      expect(activeDrugs.length).to.equal(0);
    });
  });

  describe("Get Low Stock Drugs", function () {
    it("Should return all low stock drugs", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await drugInventoryContract.connect(pharmacist).addDrug(
        "Drug1",
        "Generic1",
        50,
        100, // Low stock
        expiryDate,
        "BATCH1"
      );
      await drugInventoryContract.connect(pharmacist).addDrug(
        "Drug2",
        "Generic2",
        500,
        100, // Good stock
        expiryDate,
        "BATCH2"
      );
      await drugInventoryContract.connect(pharmacist).addDrug(
        "Drug3",
        "Generic3",
        30,
        100, // Low stock
        expiryDate,
        "BATCH3"
      );

      const lowStockDrugs = await drugInventoryContract.getLowStockDrugs();
      expect(lowStockDrugs.length).to.equal(2);
      expect(lowStockDrugs[0]).to.equal(1);
      expect(lowStockDrugs[1]).to.equal(3);
    });

    it("Should return empty array when no low stock drugs", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug1", "Generic1", 500, 100, expiryDate, "BATCH1");

      const lowStockDrugs = await drugInventoryContract.getLowStockDrugs();
      expect(lowStockDrugs.length).to.equal(0);
    });
  });

  describe("Events", function () {
    it("Should emit DrugAdded event with correct parameters", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug(
            "Paracetamol",
            "Acetaminophen",
            1000,
            100,
            expiryDate,
            "BATCH123"
          )
      ).to.emit(drugInventoryContract, "DrugAdded");
    });

    it("Should emit DrugStockUpdated event", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await drugInventoryContract
        .connect(pharmacist)
        .addDrug("Drug", "Generic", 1000, 100, expiryDate, "BATCH");

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .updateStock(1, 500, "Test", ethers.ZeroHash)
      )
        .to.emit(drugInventoryContract, "DrugStockUpdated");
    });

    it("Should emit LowStockAlert event", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        drugInventoryContract
          .connect(pharmacist)
          .addDrug("Drug", "Generic", 50, 100, expiryDate, "BATCH")
      ).to.emit(drugInventoryContract, "LowStockAlert");
    });
  });
});
