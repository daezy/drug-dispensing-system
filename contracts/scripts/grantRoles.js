const hre = require("hardhat");

async function main() {
  // Get contract addresses from environment
  const prescriptionAddress =
    process.env.NEXT_PUBLIC_PRESCRIPTION_CONTRACT_ADDRESS;
  const drugInventoryAddress =
    process.env.NEXT_PUBLIC_DRUG_INVENTORY_CONTRACT_ADDRESS;

  if (!prescriptionAddress || !drugInventoryAddress) {
    console.error("❌ Contract addresses not found in environment variables");
    console.log("Please deploy contracts first using: npm run deploy:sepolia");
    process.exit(1);
  }

  console.log("🔐 Granting roles to authorized addresses...");
  console.log("Network:", hre.network.name);
  console.log("---");

  const [admin] = await hre.ethers.getSigners();
  console.log("Admin account:", admin.address);
  console.log("---");

  // Get contract instances
  const PrescriptionContract = await hre.ethers.getContractFactory(
    "PrescriptionContract"
  );
  const prescriptionContract = PrescriptionContract.attach(prescriptionAddress);

  const DrugInventoryContract = await hre.ethers.getContractFactory(
    "DrugInventoryContract"
  );
  const drugInventoryContract =
    DrugInventoryContract.attach(drugInventoryAddress);

  // Example addresses (replace with actual addresses)
  const doctorAddresses = [
    // Add doctor wallet addresses here
    // "0x1234...",
  ];

  const pharmacistAddresses = [
    // Add pharmacist wallet addresses here
    // "0x5678...",
  ];

  // Grant Doctor roles
  if (doctorAddresses.length > 0) {
    console.log("👨‍⚕️ Granting Doctor roles...");
    for (const address of doctorAddresses) {
      const tx = await prescriptionContract.grantDoctorRole(address);
      await tx.wait();
      console.log(`✅ Granted DOCTOR_ROLE to: ${address}`);
    }
  } else {
    console.log("⚠️ No doctor addresses provided");
  }

  console.log("---");

  // Grant Pharmacist roles
  if (pharmacistAddresses.length > 0) {
    console.log("💊 Granting Pharmacist roles...");
    for (const address of pharmacistAddresses) {
      // Grant in PrescriptionContract
      let tx = await prescriptionContract.grantPharmacistRole(address);
      await tx.wait();
      console.log(
        `✅ Granted PHARMACIST_ROLE in PrescriptionContract to: ${address}`
      );

      // Grant in DrugInventoryContract
      tx = await drugInventoryContract.grantPharmacistRole(address);
      await tx.wait();
      console.log(
        `✅ Granted PHARMACIST_ROLE in DrugInventoryContract to: ${address}`
      );
    }
  } else {
    console.log("⚠️ No pharmacist addresses provided");
  }

  console.log("---");

  // Grant Verifier roles (typically pharmacists can also verify)
  if (pharmacistAddresses.length > 0) {
    console.log("🔍 Granting Verifier roles...");
    for (const address of pharmacistAddresses) {
      const tx = await prescriptionContract.grantVerifierRole(address);
      await tx.wait();
      console.log(`✅ Granted VERIFIER_ROLE to: ${address}`);
    }
  }

  console.log("---");
  console.log("✨ Role assignment complete!");
  console.log("\n📝 To add more addresses, edit this script and run again:");
  console.log("   npx hardhat run scripts/grantRoles.js --network baseSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error granting roles:", error);
    process.exit(1);
  });
