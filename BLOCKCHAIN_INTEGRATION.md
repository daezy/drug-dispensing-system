# Blockchain Integration - Phase 3 Implementation

## 🎯 Overview

Complete implementation of blockchain integration layer connecting the PharmChain application to Base network. This enables on-chain prescription management and drug inventory tracking with full event synchronization.

## ✅ Implemented Components

### 1. **Base Network Client** (`src/lib/blockchain/BaseClient.ts`)

Manages connections to Base blockchain using viem.

**Features:**

- ✅ Public client for reading blockchain data
- ✅ Wallet client for submitting transactions
- ✅ Singleton pattern for connection management
- ✅ Support for Base Mainnet and Base Sepolia
- ✅ Block and transaction queries
- ✅ Transaction receipt monitoring

**Key Methods:**

```typescript
getPublicClient(); // Read-only blockchain access
getWalletClient(); // Write transactions
getBlockNumber(); // Current block height
getTransaction(hash); // Get transaction by hash
waitForTransaction(); // Wait for confirmations
```

### 2. **Smart Contract ABIs** (`src/lib/blockchain/contracts.ts`)

Defines contract interfaces for prescription and drug inventory contracts.

**Contracts:**

#### PrescriptionContract

- **Events:**
  - `PrescriptionCreated` - New prescription issued
  - `PrescriptionVerified` - Prescription verified by pharmacist
  - `PrescriptionDispensed` - Prescription fulfilled
- **Functions:**
  - `createPrescription()` - Create new prescription on-chain
  - `verifyPrescription()` - Verify prescription
  - `dispensePrescription()` - Mark as dispensed
  - `getPrescription()` - Read prescription data

#### DrugInventoryContract

- **Events:**
  - `DrugAdded` - New drug added to inventory
  - `DrugStockUpdated` - Stock quantity changed
  - `DrugExpired` - Drug marked as expired
- **Functions:**
  - `addDrug()` - Add drug to on-chain inventory
  - `updateStock()` - Update stock quantity
  - `getDrug()` - Read drug data
  - `getStockLevel()` - Get current stock

### 3. **Event Listener Service** (`src/lib/blockchain/EventListenerService.ts`)

Monitors smart contract events in real-time.

**Features:**

- ✅ Automatic block polling (12 second intervals)
- ✅ Event handler registration
- ✅ Historical event fetching
- ✅ Last processed block tracking
- ✅ Handles all contract events

**Usage:**

```typescript
eventListenerService.registerHandlers({
  onPrescriptionCreated: async (event, log) => {
    /* ... */
  },
  onPrescriptionDispensed: async (event, log) => {
    /* ... */
  },
  onDrugStockUpdated: async (event, log) => {
    /* ... */
  },
  onDrugAdded: async (event, log) => {
    /* ... */
  },
});

await eventListenerService.startListening(fromBlock);
```

### 4. **Blockchain Sync Service** (`src/lib/blockchain/BlockchainSyncService.ts`)

Synchronizes blockchain events with MongoDB database.

**Features:**

- ✅ Automatic event-to-database synchronization
- ✅ Handles prescription creation/dispensing events
- ✅ Updates drug inventory on stock changes
- ✅ Creates inventory transaction records
- ✅ Blockchain reorganization handling
- ✅ Historical event sync

**Event Handlers:**

- `handlePrescriptionCreated()` - Updates prescription with tx hash
- `handlePrescriptionDispensed()` - Updates status and quantity
- `handleDrugStockUpdated()` - Updates stock and creates transaction
- `handleDrugAdded()` - Links on-chain drug ID

### 5. **Contract Interaction Service** (`src/lib/blockchain/ContractService.ts`)

Handles writing transactions to smart contracts.

**Features:**

- ✅ Create prescriptions on-chain
- ✅ Dispense prescriptions
- ✅ Add drugs to inventory
- ✅ Update drug stock
- ✅ Read contract state

**Usage:**

```typescript
// Create prescription
const { txHash, prescriptionId } = await contractService.createPrescription(
  patientAddress,
  drugId,
  quantity,
  dosageInstructions,
  duration
);

// Dispense prescription
const { txHash } = await contractService.dispensePrescription(
  prescriptionId,
  quantityDispensed,
  blockchainHash
);

// Add drug
const { txHash, drugId } = await contractService.addDrug(
  name,
  genericName,
  initialQuantity,
  minimumStockLevel,
  expiryDate,
  batchNumber
);
```

### 6. **Database Model Updates**

Added blockchain fields to Drug and Prescription schemas:

**New Fields:**

```typescript
// Drug model
onchain_tx_hash: string; // Transaction hash
onchain_block_number: number; // Block number
onchain_drug_id: number; // On-chain drug ID

// Prescription model
onchain_tx_hash: string; // Transaction hash
onchain_block_number: number; // Block number
onchain_prescription_id: number; // On-chain prescription ID
```

### 7. **API Endpoints** (`src/app/api/blockchain/route.ts`)

Backend API for blockchain operations.

**GET Endpoints:**

- `/api/blockchain?action=status` - Get sync and network status
- `/api/blockchain?action=transaction&hash=0x...` - Get transaction details
- `/api/blockchain?action=block&number=123` - Get block details

**POST Endpoints:**

- `POST /api/blockchain` - Start/stop sync
  ```json
  { "action": "start", "fromBlock": "12345" }
  { "action": "stop" }
  { "action": "sync-historical", "fromBlock": "12345", "toBlock": "12500" }
  { "action": "handle-reorg", "fromBlock": "12345" }
  ```

### 8. **React Components**

#### BlockchainStatus (`src/components/BlockchainStatus.tsx`)

Displays blockchain synchronization status on dashboard.

**Features:**

- Real-time sync status
- Network information
- Current block number
- Event listener status
- Auto-refresh every 30 seconds

#### TransactionHash (`src/components/TransactionHash.tsx`)

Displays transaction hashes with explorer links.

**Features:**

- Shortened hash display
- Copy to clipboard
- Block explorer links
- Block number display
- Transaction status badges

### 9. **Initialization Module** (`src/lib/blockchain/init.ts`)

Bootstrap blockchain integration on server start.

**Features:**

- ✅ Auto-initialize on server start
- ✅ Configurable via environment variables
- ✅ Graceful degradation if blockchain unavailable
- ✅ Status checking

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Base Network Configuration
BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org
# For mainnet: https://mainnet.base.org

# Smart Contract Addresses (update after deployment)
NEXT_PUBLIC_PRESCRIPTION_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_DRUG_INVENTORY_CONTRACT_ADDRESS=0x...

# Backend Wallet (for submitting transactions)
BLOCKCHAIN_PRIVATE_KEY=0x...

# Sync Configuration
BLOCKCHAIN_AUTO_INIT=true         # Initialize on server start
BLOCKCHAIN_AUTO_SYNC=true         # Start sync automatically
BLOCKCHAIN_SYNC_FROM_BLOCK=12345  # Optional: start from specific block
```

## 🚀 Usage Guide

### Starting Blockchain Sync

**Option 1: Automatic (Recommended)**
Set in `.env.local`:

```bash
BLOCKCHAIN_AUTO_INIT=true
BLOCKCHAIN_AUTO_SYNC=true
```

**Option 2: Manual via API**

```bash
curl -X POST http://localhost:3002/api/blockchain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "fromBlock": "12345"}'
```

**Option 3: Programmatic**

```typescript
import { initializeBlockchain } from "@/lib/blockchain/init";
await initializeBlockchain();
```

### Syncing Historical Events

```typescript
import { blockchainSyncService } from "@/lib/blockchain/BlockchainSyncService";

await blockchainSyncService.syncHistoricalEvents(
  BigInt(12345), // fromBlock
  BigInt(12500) // toBlock
);
```

### Submitting Transactions

```typescript
import { contractService } from "@/lib/blockchain/ContractService";

// Create prescription on-chain
const { txHash, prescriptionId } = await contractService.createPrescription(
  "0xPatientAddress",
  BigInt(1), // drugId
  BigInt(30), // quantity
  "Take 1 tablet daily",
  BigInt(30) // duration in days
);

// Update drug stock on-chain
const { txHash } = await contractService.updateDrugStock(
  BigInt(1), // drugId
  BigInt(-10), // quantity change (negative for decrease)
  "dispensed",
  "0xLocalBlockchainHash"
);
```

### Displaying Blockchain Status

Add to your dashboard:

```typescript
import { BlockchainStatus } from "@/components/BlockchainStatus";

export default function Dashboard() {
  return (
    <div>
      <BlockchainStatus />
      {/* Rest of dashboard */}
    </div>
  );
}
```

### Showing Transaction Hashes

```typescript
import { TransactionHash, TransactionStatus } from '@/components/TransactionHash';

<TransactionHash
  txHash={prescription.onchain_tx_hash}
  blockNumber={prescription.onchain_block_number}
  label="Prescription Created"
/>

<TransactionStatus status="confirmed" confirmations={12} />
```

## 🔄 Data Flow

### Prescription Creation Flow

1. **Backend**: Doctor creates prescription in MongoDB
2. **Blockchain**: Submit `createPrescription()` transaction
3. **Event**: `PrescriptionCreated` event emitted
4. **Sync**: Event listener captures event
5. **Database**: Update prescription with `onchain_tx_hash` and `onchain_prescription_id`

### Drug Dispensing Flow

1. **Backend**: Pharmacist dispenses prescription (MongoDB update)
2. **Blockchain**: Submit `dispensePrescription()` transaction
3. **Blockchain**: Submit `updateStock()` transaction for drug
4. **Events**: `PrescriptionDispensed` and `DrugStockUpdated` emitted
5. **Sync**: Events captured and synced to MongoDB
6. **Database**: Prescription and drug records updated with tx hashes

### Stock Update Flow

1. **Backend**: Pharmacist updates drug stock (MongoDB)
2. **Blockchain**: Submit `updateStock()` transaction
3. **Event**: `DrugStockUpdated` event emitted
4. **Sync**: Event captured and inventory transaction created
5. **Database**: Drug record updated with tx hash and block number

## 🛡️ Error Handling

### Blockchain Connection Failures

- App continues to function with local database only
- Sync can be started manually later
- All operations work offline

### Transaction Failures

- Errors are caught and logged
- Database remains consistent
- Retry logic can be implemented

### Event Sync Issues

- Failed event processing is logged
- Last processed block is saved
- Can re-sync from any block

### Blockchain Reorganization

```typescript
await blockchainSyncService.handleReorg(BigInt(12345));
// Marks affected records for re-sync
// Automatically re-syncs from reorg point
```

## 📊 Monitoring

### Check Sync Status

```bash
curl http://localhost:3002/api/blockchain?action=status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Transaction

```bash
curl "http://localhost:3002/api/blockchain?action=transaction&hash=0x..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Current Block

```typescript
import { baseClient } from "@/lib/blockchain/BaseClient";
const currentBlock = await baseClient.getBlockNumber();
console.log(`Current block: ${currentBlock}`);
```

## 🔐 Security Considerations

1. **Private Key**: Never commit `BLOCKCHAIN_PRIVATE_KEY` to git
2. **Admin Only**: Blockchain operations require admin/pharmacist role
3. **Contract Validation**: Always validate contract addresses
4. **Gas Management**: Monitor gas costs for transactions
5. **Rate Limiting**: Implement rate limits for API endpoints

## 📝 Database Schema

### Prescription Collection

```javascript
{
  _id: ObjectId,
  // Existing fields...
  onchain_tx_hash: "0x...",           // Transaction hash
  onchain_block_number: 12345,        // Block number
  onchain_prescription_id: 1          // On-chain ID
}
```

### Drug Collection

```javascript
{
  _id: ObjectId,
  // Existing fields...
  onchain_tx_hash: "0x...",           // Transaction hash
  onchain_block_number: 12345,        // Block number
  onchain_drug_id: 1                  // On-chain ID
}
```

### InventoryTransaction Collection

```javascript
{
  _id: ObjectId,
  drug_id: ObjectId,
  transaction_type: "dispensed",
  quantity: -10,
  blockchain_transaction_hash: "0x...", // Local hash
  onchain_tx_hash: "0x...",            // On-chain tx hash
  onchain_block_number: 12345,
  timestamp: Date
}
```

## 🧪 Testing

### Test Blockchain Connection

```typescript
import { baseClient } from "@/lib/blockchain/BaseClient";

const networkInfo = baseClient.getNetworkInfo();
console.log("Network:", networkInfo);

const currentBlock = await baseClient.getBlockNumber();
console.log("Current block:", currentBlock);
```

### Test Event Listener

```typescript
import { eventListenerService } from "@/lib/blockchain/EventListenerService";

eventListenerService.registerHandlers({
  onPrescriptionCreated: async (event, log) => {
    console.log("Prescription created:", event);
  },
});

await eventListenerService.startListening();
```

### Test Contract Interaction

```typescript
import { contractService } from "@/lib/blockchain/ContractService";

// Check if contracts are configured
const isConfigured = contractService.areContractsConfigured();
console.log("Contracts configured:", isConfigured);
```

## 🚧 Next Steps

1. **Deploy Smart Contracts**: Deploy contracts to Base network
2. **Update Contract Addresses**: Add addresses to `.env.local`
3. **Generate Backend Wallet**: Create wallet for transactions
4. **Test on Testnet**: Use Base Sepolia for testing
5. **Enable Auto-Sync**: Set `BLOCKCHAIN_AUTO_SYNC=true`
6. **Add Dashboard Widget**: Show BlockchainStatus on pharmacist dashboard
7. **Monitor Gas Costs**: Track transaction costs
8. **Implement Retry Logic**: Add transaction retry on failure

## 📚 Resources

- [Base Network Docs](https://docs.base.org)
- [Viem Documentation](https://viem.sh)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Base Mainnet Explorer](https://basescan.org)

## 🎉 Summary

Phase 3 blockchain integration is complete with:

✅ Base network connection (viem)
✅ Smart contract ABIs defined
✅ Event listeners implemented
✅ Blockchain sync service
✅ Contract interaction methods
✅ Database models updated
✅ API endpoints created
✅ React components for UI
✅ Automatic synchronization
✅ Comprehensive error handling
✅ Full documentation

The application now has a complete blockchain integration layer ready for connecting to deployed smart contracts on Base network!
