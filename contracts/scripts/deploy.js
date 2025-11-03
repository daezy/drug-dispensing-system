const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting PharmChain contracts deployment...");
  console.log("Network:", hre.network.name);
  console.log("---");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("---");

  // Deploy PrescriptionContract
  console.log("📝 Deploying PrescriptionContract...");
  const PrescriptionContract = await hre.ethers.getContractFactory(
    "PrescriptionContract"
  );
  const prescriptionContract = await PrescriptionContract.deploy();
  await prescriptionContract.waitForDeployment();
  const prescriptionAddress = await prescriptionContract.getAddress();

  console.log("✅ PrescriptionContract deployed to:", prescriptionAddress);
  console.log("---");

  // Deploy DrugInventoryContract
  console.log("💊 Deploying DrugInventoryContract...");
  const DrugInventoryContract = await hre.ethers.getContractFactory(
    "DrugInventoryContract"
  );
  const drugInventoryContract = await DrugInventoryContract.deploy();
  await drugInventoryContract.waitForDeployment();
  const drugInventoryAddress = await drugInventoryContract.getAddress();

  console.log("✅ DrugInventoryContract deployed to:", drugInventoryAddress);
  console.log("---");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PrescriptionContract: {
        address: prescriptionAddress,
        constructorArgs: [],
      },
      DrugInventoryContract: {
        address: drugInventoryAddress,
        constructorArgs: [],
      },
    },
  };

  // Save to JSON file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log("📄 Deployment info saved to:", filepath);
  console.log("---");

  // Update .env.local file
  console.log("🔧 Updating .env.local with contract addresses...");
  const envPath = path.join(__dirname, "../../.env.local");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Update or add contract addresses
  const updateEnvVar = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  updateEnvVar(
    "NEXT_PUBLIC_PRESCRIPTION_CONTRACT_ADDRESS",
    prescriptionAddress
  );
  updateEnvVar(
    "NEXT_PUBLIC_DRUG_INVENTORY_CONTRACT_ADDRESS",
    drugInventoryAddress
  );

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env.local updated successfully");
  console.log("---");

  // Print summary
  console.log("🎉 Deployment Summary:");
  console.log("======================");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("- PrescriptionContract:", prescriptionAddress);
  console.log("- DrugInventoryContract:", drugInventoryAddress);
  console.log("\n📝 Next Steps:");
  console.log(
    "1. Verify contracts on block explorer (see verify command below)"
  );
  console.log("2. Grant roles to authorized addresses");
  console.log("3. Restart your application to load new contract addresses");
  console.log("4. Enable blockchain sync in .env.local");
  console.log("\n🔍 Verify on BaseScan:");
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${prescriptionAddress}`
  );
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${drugInventoryAddress}`
  );
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
