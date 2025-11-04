# Quick Reference - Base Sepolia Configuration

## ✅ Configuration Summary

Your application is now properly configured to use **Base Sepolia testnet**.

### Network Details

```
Network Name: Base Sepolia
Chain ID: 84532
RPC URL: https://sepolia.base.org
Block Explorer: https://sepolia.basescan.org
Currency: ETH (Testnet)
```

### Required Environment Variables

```bash
# .env file
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org
BLOCKCHAIN_PRIVATE_KEY=0x... # Optional, for backend transactions
```

## 🔧 Quick Fixes

### Fix 1: "Failed to fetch blockchain status"

**Cause**: Missing authentication or wrong network

**Solution**:

1. Make sure you're logged in (any role: Doctor, Patient, Pharmacist, Admin)
2. Check `.env` has `BLOCKCHAIN_RPC_ENDPOINT=https://sepolia.base.org`
3. Restart dev server: `npm run dev`

### Fix 2: Add Base Sepolia to MetaMask

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter:
   - Name: `Base Sepolia`
   - RPC: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Symbol: `ETH`
   - Explorer: `https://sepolia.basescan.org`
4. Click "Save"

### Fix 3: Get Testnet ETH

Visit: https://www.alchemy.com/faucets/base-sepolia

- Requires free Alchemy account
- Get 0.1 ETH per day

## 🔍 Verification Checklist

- [ ] `.env` file has correct `BLOCKCHAIN_RPC_ENDPOINT`
- [ ] `.env` file has valid `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- [ ] MetaMask has Base Sepolia network added
- [ ] MetaMask is switched to Base Sepolia
- [ ] Wallet has testnet ETH
- [ ] Logged in to the application (any role)
- [ ] Development server restarted after .env changes

## 📊 Expected Results

### Dashboard Display

When working correctly, you should see:

- ✅ "Connected to Base Sepolia network"
- ✅ Chain ID: 84532
- ✅ Current block number updating
- ✅ Network status: Active

### Prescription Creation

- Success message includes blockchain transaction ID
- Prescription shows "🛡️ Blockchain Verified" badge
- Details modal displays blockchain hash

## 🆘 Still Having Issues?

1. **Check Browser Console**

   - Press F12 → Console tab
   - Look for error messages
   - Red messages indicate problems

2. **Verify RPC Endpoint**

   ```bash
   curl https://sepolia.base.org \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

   Should return: `{"jsonrpc":"2.0","id":1,"result":"0x..."}`

3. **Test Alternative RPC**
   If `sepolia.base.org` is down, try:

   ```bash
   BLOCKCHAIN_RPC_ENDPOINT=https://base-sepolia.blockpi.network/v1/rpc/public
   ```

4. **Check Authentication**
   - You must be logged in (any role)
   - Check localStorage has `auth_token` or `token`
   - Note: Blockchain sync operations (start/stop) require Admin role

## 📚 More Help

- Full Guide: `WALLET_SETUP_GUIDE.md`
- Base Docs: https://docs.base.org
- Discord: https://discord.gg/buildonbase

---

Last Updated: November 4, 2025
