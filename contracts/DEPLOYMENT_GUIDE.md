# Smart Contract Deployment Guide

## 📋 Prerequisites

1. **Base Sepolia ETH** (testnet) or **ETH on Base** (mainnet)

   - Get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Bridge to Base: https://bridge.base.org

2. **Backend Wallet**

   - Create a new wallet for backend transactions
   - **NEVER use your personal wallet**
   - Keep private key secure

3. **BaseScan API Key** (optional, for verification)
   - Get free API key: https://basescan.org/apis

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
cd contracts
npm install
```

### Step 2: Configure Environment

Edit `.env.local` in the root directory:

```bash
# Backend wallet private key (KEEP THIS SECRET!)
BLOCKCHAIN_PRIVATE_KEY=0x... # Your wallet private key

# RPC endpoint (already configured)
BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org

# BaseScan API key (optional, for contract verification)
BASESCAN_API_KEY=YOUR_API_KEY_HERE
```

**⚠️ SECURITY WARNING:**

- Never commit `.env.local` to git
- Never share your private key
- Use a dedicated wallet for backend operations
- Keep only minimal funds in the backend wallet

### Step 3: Compile Contracts

```bash
cd contracts
npm run compile
```

Expected output:

```
Compiled 2 Solidity files successfully
```

### Step 4: Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:sepolia
```

Expected output:

```
🚀 Starting PharmChain contracts deployment...
Network: baseSepolia
---
Deploying contracts with account: 0x...
Account balance: 0.1 ETH
---
📝 Deploying PrescriptionContract...
✅ PrescriptionContract deployed to: 0x...
---
💊 Deploying DrugInventoryContract...
✅ DrugInventoryContract deployed to: 0x...
---
📄 Deployment info saved to: deployments/baseSepolia-....json
---
🔧 Updating .env.local with contract addresses...
✅ .env.local updated successfully
---
🎉 Deployment Summary:
======================
Network: baseSepolia
Chain ID: 84532
Contract Addresses:
- PrescriptionContract: 0x...
- DrugInventoryContract: 0x...
```

### Step 5: Verify Contracts on BaseScan (Optional)

```bash
npx hardhat verify --network baseSepolia PRESCRIPTION_CONTRACT_ADDRESS
npx hardhat verify --network baseSepolia DRUG_INVENTORY_CONTRACT_ADDRESS
```

This makes your contracts' source code public and verifiable on BaseScan.

### Step 6: Grant Roles

Edit `contracts/scripts/grantRoles.js` and add authorized addresses:

```javascript
const doctorAddresses = ["0xDoctorWalletAddress1", "0xDoctorWalletAddress2"];

const pharmacistAddresses = [
  "0xPharmacistWalletAddress1",
  "0xPharmacistWalletAddress2",
];
```

Then run:

```bash
npx hardhat run scripts/grantRoles.js --network baseSepolia
```

### Step 7: Enable Blockchain Sync

Update `.env.local`:

```bash
# Enable auto-sync
BLOCKCHAIN_AUTO_INIT=true
BLOCKCHAIN_AUTO_SYNC=true

# Start syncing from current block (or specific block)
BLOCKCHAIN_SYNC_FROM_BLOCK=12000000
```

### Step 8: Restart Application

```bash
# Stop dev server (Ctrl+C)
# Start again
npm run dev
```

## 🧪 Testing Deployment

### Test 1: Check Contract Addresses

```bash
curl http://localhost:3002/api/blockchain?action=status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return contract addresses in network info.

### Test 2: View on BaseScan

Visit:

- https://sepolia.basescan.org/address/PRESCRIPTION_CONTRACT_ADDRESS
- https://sepolia.basescan.org/address/DRUG_INVENTORY_CONTRACT_ADDRESS

### Test 3: Check Roles

In Hardhat console:

```bash
npx hardhat console --network baseSepolia
```

```javascript
const prescriptionAddress = "0x...";
const PrescriptionContract = await ethers.getContractFactory(
  "PrescriptionContract"
);
const contract = await PrescriptionContract.attach(prescriptionAddress);

// Check if address has doctor role
const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
const hasRole = await contract.hasRole(DOCTOR_ROLE, "0xDoctorAddress");
console.log("Has doctor role:", hasRole);
```

## 🏭 Production Deployment (Base Mainnet)

When ready for production:

### Step 1: Update RPC Endpoint

```bash
BLOCKCHAIN_RPC_ENDPOINT=https://mainnet.base.org
```

### Step 2: Fund Your Wallet

- Ensure backend wallet has sufficient ETH on Base mainnet
- Recommended: 0.05 - 0.1 ETH for deployments and operations

### Step 3: Deploy

```bash
npm run deploy:mainnet
```

### Step 4: Verify

```bash
npm run verify:mainnet
```

## 📊 Gas Costs Estimate

Based on current Base network gas prices:

| Operation                    | Estimated Gas | Cost (at 0.1 gwei) |
| ---------------------------- | ------------- | ------------------ |
| Deploy PrescriptionContract  | ~2,500,000    | ~$0.25             |
| Deploy DrugInventoryContract | ~3,000,000    | ~$0.30             |
| Create Prescription          | ~150,000      | ~$0.015            |
| Dispense Prescription        | ~80,000       | ~$0.008            |
| Add Drug                     | ~200,000      | ~$0.020            |
| Update Stock                 | ~70,000       | ~$0.007            |

**Total deployment cost: ~$0.55 on Base**

## 🔐 Security Best Practices

1. **Private Key Management**

   - Use environment variables only
   - Never hardcode keys
   - Consider hardware wallet for mainnet
   - Use key management service in production

2. **Role Management**

   - Grant roles only to verified addresses
   - Regularly audit role assignments
   - Use multi-sig wallet for admin role
   - Implement role revocation if needed

3. **Contract Security**

   - Contracts use OpenZeppelin libraries
   - Access control via roles
   - ReentrancyGuard protection
   - Consider audit before mainnet

4. **Monitoring**
   - Set up event monitoring
   - Track unusual transactions
   - Monitor gas costs
   - Alert on failed transactions

## 📁 Deployment Files

After deployment, you'll have:

```
contracts/
├── PrescriptionContract.sol
├── DrugInventoryContract.sol
├── hardhat.config.js
├── package.json
├── scripts/
│   ├── deploy.js
│   └── grantRoles.js
├── deployments/
│   └── baseSepolia-[timestamp].json  # Deployment info
├── artifacts/                         # Compiled contracts
└── cache/                            # Build cache
```

## 🔄 Re-deploying Contracts

If you need to redeploy:

```bash
# Clean build
rm -rf artifacts cache

# Compile fresh
npm run compile

# Deploy
npm run deploy:sepolia
```

**Note:** New deployment = new contract addresses. Update all references!

## 🆘 Troubleshooting

### "Insufficient funds for gas"

**Solution:** Add more ETH to your deployer wallet

### "Nonce too high"

**Solution:** Reset your wallet nonce or wait for pending transactions

### "Contract verification failed"

**Solution:** Ensure BaseScan API key is correct and contract is deployed

### "Cannot find module '@openzeppelin/contracts'"

**Solution:** Run `npm install` in the contracts directory

### "Invalid private key"

**Solution:** Ensure private key starts with `0x` and is 64 characters (32 bytes)

## 📞 Support

- Base Docs: https://docs.base.org
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin: https://docs.openzeppelin.com

## ✅ Deployment Checklist

Before deploying to mainnet:

- [ ] Contracts compiled successfully
- [ ] Tested on Base Sepolia testnet
- [ ] All roles granted correctly
- [ ] Events emitting properly
- [ ] Frontend integration working
- [ ] Backend sync operational
- [ ] Security review completed
- [ ] Gas costs acceptable
- [ ] Backup private key securely
- [ ] Documentation updated
- [ ] Team trained on operations
- [ ] Monitoring set up

---

**Ready to deploy!** Follow the steps above and your smart contracts will be live on Base network. 🚀
