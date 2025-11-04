# Wallet Setup Guide - Base Sepolia Testnet

## Overview

This application uses **Base Sepolia** testnet for blockchain operations. Follow this guide to properly configure your wallet and connect to the network.

## Quick Fix for "Failed to fetch blockchain status" Error

The error occurs when the blockchain connection is not properly configured. Here's how to fix it:

### 1. Network Configuration ✅

The application is now configured to use:

- **Primary Network**: Base Sepolia (Chain ID: 84532)
- **Secondary Network**: Sepolia (Chain ID: 11155111)

### 2. Environment Variables

Ensure your `.env` file has:

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base Sepolia RPC Endpoint
BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org

# Optional: Private key for backend transactions
BLOCKCHAIN_PRIVATE_KEY=0x...
```

### 3. Add Base Sepolia to MetaMask

#### Option A: Automatic (When Using the App)

1. Open the app
2. Click "Connect Wallet"
3. Select MetaMask
4. The app will prompt you to add Base Sepolia network
5. Click "Approve" to add the network

#### Option B: Manual Setup

1. Open MetaMask
2. Click the network dropdown (top left)
3. Click "Add Network" → "Add a network manually"
4. Enter the following details:

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

5. Click "Save"
6. Switch to Base Sepolia network

### 4. Get Testnet ETH

You need testnet ETH to interact with the blockchain:

#### Base Sepolia Faucets:

1. **Alchemy Faucet** (Recommended)

   - URL: https://www.alchemy.com/faucets/base-sepolia
   - Requires: Alchemy account (free)
   - Amount: 0.1 ETH per day

2. **QuickNode Faucet**

   - URL: https://faucet.quicknode.com/base/sepolia
   - Requires: QuickNode account (free)
   - Amount: 0.05 ETH per request

3. **Base Sepolia Bridge** (if you have Sepolia ETH)
   - Get Sepolia ETH from: https://sepoliafaucet.com
   - Bridge to Base Sepolia: https://bridge.base.org

### 5. Verify Connection

After setup, verify your connection:

1. **Check Network**: MetaMask should show "Base Sepolia" at the top
2. **Check Balance**: You should see testnet ETH in your wallet
3. **Test Connection**:
   - Open the app
   - Go to Dashboard
   - Look for "Blockchain Status" component
   - Should show: ✅ Connected to Base Sepolia

## WalletConnect Project ID Setup

If you see "YOUR_PROJECT_ID" in the console:

1. Visit: https://cloud.walletconnect.com
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID
5. Add to `.env`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...
   ```
6. Restart your development server

## Supported Wallets

The application supports:

- ✅ **MetaMask** (Recommended)
- ✅ **WalletConnect** (Mobile wallets)
- ✅ **Coinbase Wallet**
- ✅ **Injected wallets** (Brave, Trust Wallet, etc.)

## Troubleshooting

### Error: "Failed to fetch blockchain status"

**Cause**: Application cannot connect to blockchain RPC endpoint

**Solutions**:

1. ✅ Verify `.env` has `BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org`
2. ✅ Check internet connection
3. ✅ Try alternative RPC: `https://base-sepolia.blockpi.network/v1/rpc/public`
4. ✅ Restart development server: `npm run dev`

### Error: "Network mismatch"

**Cause**: Wallet is on wrong network

**Solution**:

1. Open MetaMask
2. Click network dropdown
3. Select "Base Sepolia"
4. Refresh the page

### Error: "Insufficient funds"

**Cause**: No testnet ETH in wallet

**Solution**:

1. Visit faucet: https://www.alchemy.com/faucets/base-sepolia
2. Enter your wallet address
3. Request testnet ETH
4. Wait 1-2 minutes for confirmation

### Error: "User rejected connection"

**Cause**: You clicked "Reject" in MetaMask

**Solution**:

1. Click "Connect Wallet" again
2. Click "Next" then "Connect" in MetaMask
3. Approve the connection

## Network Information Reference

### Base Sepolia (Testnet)

```
Chain ID: 84532
RPC URL: https://sepolia.base.org
Explorer: https://sepolia.basescan.org
Currency: ETH (Testnet)
```

### Sepolia (Ethereum Testnet)

```
Chain ID: 11155111
RPC URL: https://sepolia.infura.io/v3/YOUR-API-KEY
Explorer: https://sepolia.etherscan.io
Currency: ETH (Testnet)
```

## Backend Configuration

For server-side transactions, you need a private key:

### Generate a New Wallet (for development)

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Create in MetaMask
# 1. Create new account
# 2. Export private key
# 3. Add to .env as BLOCKCHAIN_PRIVATE_KEY
```

⚠️ **Security Warning**:

- NEVER use production private keys in development
- NEVER commit private keys to git
- Keep `.env` in `.gitignore`
- Use environment variables in production

## Testing the Integration

### 1. Check Dashboard

- Navigate to `/dashboard/doctor`
- Look for "BlockchainStatus" component
- Should display network info and connection status

### 2. Create a Prescription

- Search for a patient
- Fill prescription form
- Submit
- Success message should include blockchain transaction ID
- Prescription should show "🛡️ Blockchain Verified" badge

### 3. View Blockchain Verification

- Click on any prescription
- Open details modal
- Look for "Blockchain Verified" section
- Should display transaction hash and ID

## Additional Resources

- **Base Documentation**: https://docs.base.org
- **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Base Explorer**: https://sepolia.basescan.org
- **WalletConnect Docs**: https://docs.walletconnect.com
- **MetaMask Guide**: https://metamask.io/faqs/

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure you're on the correct network (Base Sepolia)
4. Try clearing browser cache and reconnecting wallet
5. Check that RPC endpoint is responding: `curl https://sepolia.base.org`

---

**Last Updated**: November 4, 2025
**Network**: Base Sepolia (Chain ID: 84532)
**Status**: ✅ Fully Configured
