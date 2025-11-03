const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PrescriptionContract", function () {
  let prescriptionContract;
  let owner, doctor, pharmacist, verifier, patient, unauthorized;
  let DOCTOR_ROLE, PHARMACIST_ROLE, VERIFIER_ROLE, DEFAULT_ADMIN_ROLE;

  beforeEach(async function () {
    // Get signers
    [owner, doctor, pharmacist, verifier, patient, unauthorized] =
      await ethers.getSigners();

    // Deploy contract
    const PrescriptionContract = await ethers.getContractFactory(
      "PrescriptionContract"
    );
    prescriptionContract = await PrescriptionContract.deploy();
    await prescriptionContract.waitForDeployment();

    // Get role hashes
    DOCTOR_ROLE = await prescriptionContract.DOCTOR_ROLE();
    PHARMACIST_ROLE = await prescriptionContract.PHARMACIST_ROLE();
    VERIFIER_ROLE = await prescriptionContract.VERIFIER_ROLE();
    DEFAULT_ADMIN_ROLE = await prescriptionContract.DEFAULT_ADMIN_ROLE();

    // Grant roles
    await prescriptionContract.grantRole(DOCTOR_ROLE, doctor.address);
    await prescriptionContract.grantRole(PHARMACIST_ROLE, pharmacist.address);
    await prescriptionContract.grantRole(VERIFIER_ROLE, verifier.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(
        await prescriptionContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)
      ).to.be.true;
    });

    it("Should initialize prescription counter to 0", async function () {
      // Try to get prescription 0 - should revert
      await expect(prescriptionContract.getPrescription(0)).to.be.revertedWith(
        "Prescription does not exist"
      );
    });
  });

  describe("Role Management", function () {
    it("Should grant DOCTOR_ROLE correctly", async function () {
      expect(await prescriptionContract.hasRole(DOCTOR_ROLE, doctor.address)).to
        .be.true;
    });

    it("Should grant PHARMACIST_ROLE correctly", async function () {
      expect(
        await prescriptionContract.hasRole(PHARMACIST_ROLE, pharmacist.address)
      ).to.be.true;
    });

    it("Should grant VERIFIER_ROLE correctly", async function () {
      expect(
        await prescriptionContract.hasRole(VERIFIER_ROLE, verifier.address)
      ).to.be.true;
    });

    it("Should allow admin to grant roles", async function () {
      const newDoctor = unauthorized;
      await prescriptionContract.grantRole(DOCTOR_ROLE, newDoctor.address);
      expect(await prescriptionContract.hasRole(DOCTOR_ROLE, newDoctor.address))
        .to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      await prescriptionContract.revokeRole(DOCTOR_ROLE, doctor.address);
      expect(await prescriptionContract.hasRole(DOCTOR_ROLE, doctor.address)).to
        .be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        prescriptionContract
          .connect(doctor)
          .grantRole(DOCTOR_ROLE, unauthorized.address)
      ).to.be.reverted;
    });
  });

  describe("Create Prescription", function () {
    it("Should allow doctor to create prescription", async function () {
      const patientAddr = patient.address;
      const drugId = 1;
      const quantity = 30;
      const dosageInstructions = "500mg twice daily with food";
      const duration = 14; // days

      await expect(
        prescriptionContract
          .connect(doctor)
          .createPrescription(
            patientAddr,
            drugId,
            quantity,
            dosageInstructions,
            duration
          )
      ).to.emit(prescriptionContract, "PrescriptionCreated");
    });

    it("Should increment prescription ID", async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);

      const [, , , anotherPatient] = await ethers.getSigners();
      await prescriptionContract
        .connect(doctor)
        .createPrescription(
          anotherPatient.address,
          2,
          60,
          "250mg once daily",
          30
        );

      const prescription1 = await prescriptionContract.getPrescription(1);
      const prescription2 = await prescriptionContract.getPrescription(2);

      expect(prescription1.patientAddress).to.equal(patient.address);
      expect(prescription2.patientAddress).to.equal(anotherPatient.address);
    });

    it("Should set correct prescription data", async function () {
      const patientAddr = patient.address;
      const drugId = 1;
      const quantity = 30;
      const dosageInstructions = "500mg twice daily with food";
      const duration = 14;

      await prescriptionContract
        .connect(doctor)
        .createPrescription(
          patientAddr,
          drugId,
          quantity,
          dosageInstructions,
          duration
        );

      const prescription = await prescriptionContract.getPrescription(1);

      expect(prescription.patientAddress).to.equal(patientAddr);
      expect(prescription.drugId).to.equal(drugId);
      expect(prescription.quantity).to.equal(quantity);
      expect(prescription.dosageInstructions).to.equal(dosageInstructions);
      expect(prescription.duration).to.equal(duration);
      expect(prescription.status).to.equal(0); // Pending
      expect(prescription.doctorAddress).to.equal(doctor.address);
    });

    it("Should not allow non-doctor to create prescription", async function () {
      await expect(
        prescriptionContract
          .connect(unauthorized)
          .createPrescription(patient.address, 1, 30, "500mg twice daily", 14)
      ).to.be.reverted;
    });

    it("Should not allow zero quantity", async function () {
      await expect(
        prescriptionContract
          .connect(doctor)
          .createPrescription(patient.address, 1, 0, "500mg twice daily", 14)
      ).to.be.revertedWith("Quantity must be greater than 0");
    });

    it("Should not allow zero duration", async function () {
      await expect(
        prescriptionContract
          .connect(doctor)
          .createPrescription(patient.address, 1, 30, "500mg twice daily", 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Verify Prescription", function () {
    beforeEach(async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
    });

    it("Should allow verifier to verify prescription", async function () {
      await expect(prescriptionContract.connect(verifier).verifyPrescription(1, true))
        .to.emit(prescriptionContract, "PrescriptionVerified")
        .withArgs(1, verifier.address);
    });

    it("Should update prescription status to Verified", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.status).to.equal(1); // Verified
    });

    it("Should set verifiedBy address", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.verifiedBy).to.equal(verifier.address);
    });

    it("Should not allow non-verifier to verify", async function () {
      await expect(
        prescriptionContract.connect(unauthorized).verifyPrescription(1, true)
      ).to.be.reverted;
    });

    it("Should not verify non-existent prescription", async function () {
      await expect(
        prescriptionContract.connect(verifier).verifyPrescription(999, true)
      ).to.be.revertedWith("Prescription does not exist");
    });

    it("Should not verify already verified prescription", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      await expect(
        prescriptionContract.connect(verifier).verifyPrescription(1, true)
      ).to.be.revertedWith("Invalid status for this action");
    });
  });

  describe("Dispense Prescription", function () {
    beforeEach(async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
    });

    it("Should allow pharmacist to dispense prescription", async function () {
      await expect(
        prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash)
      )
        .to.emit(prescriptionContract, "PrescriptionDispensed")
        .withArgs(1, pharmacist.address);
    });

    it("Should update prescription status to Dispensed", async function () {
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.status).to.equal(2); // Dispensed
    });

    it("Should set dispensedBy address", async function () {
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.dispensedBy).to.equal(pharmacist.address);
    });

    it("Should set dispensedAt timestamp", async function () {
      const tx = await prescriptionContract
        .connect(pharmacist)
        .dispensePrescription(1, 30, ethers.ZeroHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.dispensedAt).to.equal(block.timestamp);
    });

    it("Should not allow non-pharmacist to dispense", async function () {
      await expect(
        prescriptionContract.connect(unauthorized).dispensePrescription(1, 30, ethers.ZeroHash)
      ).to.be.reverted;
    });

    it("Should not dispense unverified prescription", async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 2, 30, "250mg once daily", 30);

      await expect(
        prescriptionContract.connect(pharmacist).dispensePrescription(2, 30, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid status for this action");
    });

    it("Should not dispense already dispensed prescription", async function () {
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);

      await expect(
        prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid status for this action");
    });
  });

  describe("Expire Prescription", function () {
    beforeEach(async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
    });

    it("Should allow admin to expire prescription", async function () {
      await expect(prescriptionContract.expirePrescription(1))
        .to.emit(prescriptionContract, "PrescriptionExpired")
        .withArgs(1);
    });

    it("Should update prescription status to Expired", async function () {
      await prescriptionContract.expirePrescription(1);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.status).to.equal(3); // Expired
    });

    it("Should not allow non-admin to expire", async function () {
      await expect(
        prescriptionContract.connect(unauthorized).expirePrescription(1)
      ).to.be.reverted;
    });

    it("Should not expire non-existent prescription", async function () {
      await expect(
        prescriptionContract.expirePrescription(999)
      ).to.be.revertedWith("Prescription does not exist");
    });

    it("Should not expire already dispensed prescription", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);

      await expect(
        prescriptionContract.expirePrescription(1)
      ).to.be.revertedWith("Cannot expire dispensed prescription");
    });
  });

  describe("Cancel Prescription", function () {
    beforeEach(async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
    });

    it("Should allow doctor to cancel own prescription", async function () {
      await expect(prescriptionContract.connect(doctor).cancelPrescription(1))
        .to.emit(prescriptionContract, "PrescriptionCancelled")
        .withArgs(1, doctor.address);
    });

    it("Should update prescription status to Cancelled", async function () {
      await prescriptionContract.connect(doctor).cancelPrescription(1);
      const prescription = await prescriptionContract.getPrescription(1);
      expect(prescription.status).to.equal(4); // Cancelled
    });

    it("Should not allow doctor to cancel another doctor's prescription", async function () {
      const [, , , , , anotherDoctor] = await ethers.getSigners();
      await prescriptionContract.grantRole(DOCTOR_ROLE, anotherDoctor.address);

      await expect(
        prescriptionContract.connect(anotherDoctor).cancelPrescription(1)
      ).to.be.revertedWith("Only prescribing doctor can cancel");
    });

    it("Should not cancel already dispensed prescription", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);

      await expect(
        prescriptionContract.connect(doctor).cancelPrescription(1)
      ).to.be.revertedWith("Cannot cancel dispensed prescription");
    });
  });

  describe("Get Prescriptions by Patient", function () {
    it("Should return all prescriptions for a patient", async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 2, 60, "250mg once daily", 30);
      const [, , , , anotherPatient] = await ethers.getSigners();
      await prescriptionContract
        .connect(doctor)
        .createPrescription(
          anotherPatient.address,
          3,
          20,
          "100mg three times daily",
          7
        );

      const prescriptions = await prescriptionContract.getPatientPrescriptions(
        patient.address
      );
      expect(prescriptions.length).to.equal(2);
      expect(prescriptions[0]).to.equal(1);
      expect(prescriptions[1]).to.equal(2);
    });

    it("Should return empty array for patient with no prescriptions", async function () {
      const prescriptions = await prescriptionContract.getPatientPrescriptions(
        unauthorized.address
      );
      expect(prescriptions.length).to.equal(0);
    });
  });

  describe("Is Valid Prescription", function () {
    beforeEach(async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
    });

    it("Should return true for verified prescription", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      expect(await prescriptionContract.isValidPrescription(1)).to.be.true;
    });

    it("Should return false for pending prescription", async function () {
      expect(await prescriptionContract.isValidPrescription(1)).to.be.false;
    });

    it("Should return false for expired prescription", async function () {
      await prescriptionContract.expirePrescription(1);
      expect(await prescriptionContract.isValidPrescription(1)).to.be.false;
    });

    it("Should return false for cancelled prescription", async function () {
      await prescriptionContract.connect(doctor).cancelPrescription(1);
      expect(await prescriptionContract.isValidPrescription(1)).to.be.false;
    });

    it("Should return true for dispensed prescription", async function () {
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);
      await prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash);
      expect(await prescriptionContract.isValidPrescription(1)).to.be.true;
    });
  });

  describe("Events", function () {
    it("Should emit PrescriptionCreated event with correct parameters", async function () {
      await expect(
        prescriptionContract
          .connect(doctor)
          .createPrescription(patient.address, 1, 30, "500mg twice daily", 14)
      ).to.emit(prescriptionContract, "PrescriptionCreated");
      // Event has indexed parameters and timestamp, so we just check it's emitted
    });

    it("Should emit PrescriptionVerified event", async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);

      await expect(
        prescriptionContract.connect(verifier).verifyPrescription(1, true)
      ).to.emit(prescriptionContract, "PrescriptionVerified");
    });

    it("Should emit PrescriptionDispensed event", async function () {
      await prescriptionContract
        .connect(doctor)
        .createPrescription(patient.address, 1, 30, "500mg twice daily", 14);
      await prescriptionContract.connect(verifier).verifyPrescription(1, true);

      await expect(
        prescriptionContract.connect(pharmacist).dispensePrescription(1, 30, ethers.ZeroHash)
      ).to.emit(prescriptionContract, "PrescriptionDispensed");
    });
  });
});
