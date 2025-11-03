# Web3Modal / WalletConnect Setup

## Getting Your Project ID

1. **Go to WalletConnect Cloud**: https://cloud.walletconnect.com
2. **Sign up or log in** with your GitHub account
3. **Create a new project**:
   - Click "Create" or "New Project"
   - Enter project name: "PharmChain"
   - Select project type: "App"
4. **Copy your Project ID** from the dashboard
5. **Add it to your `.env.local` file**:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   ```

## Features Implemented

### ✅ Web3Modal Integration

- Professional wallet connect modal
- Supports multiple EVM wallets:
  - MetaMask
  - WalletConnect
  - Coinbase Wallet
  - Trust Wallet
  - Rainbow
  - And many more...

### ✅ Multi-Chain Support

The app is configured to support:

- Ethereum Mainnet
- Polygon
- Binance Smart Chain (BSC)
- Arbitrum
- Optimism
- Base

### ✅ Components Updated

1. **Login Page (`src/app/page.tsx`)**:

   - Dual authentication tabs (Traditional + Web3)
   - "Connect Wallet" button opens Web3Modal
   - Automatic wallet detection

2. **Dashboard Layout (`src/components/DashboardLayout.tsx`)**:

   - Wallet status in sidebar
   - Shows connected wallet address (truncated)
   - Click to connect/disconnect wallet

3. **Web3 Provider (`src/components/Web3Provider.tsx`)**:
   - Wraps entire app with Wagmi and React Query
   - Enables Web3 hooks throughout the app

## Usage

### In Login Page:

1. User selects "Web3 Wallet" tab
2. Chooses their role (Patient, Doctor, etc.)
3. Clicks "Connect Wallet"
4. Web3Modal opens with all available wallets
5. User selects their wallet and approves connection
6. Automatic redirect to dashboard

### In Dashboard:

1. Sidebar shows "Connect Wallet" button
2. Once connected, displays wallet address: `0x1234...5678`
3. Click to disconnect or switch wallet
4. Green indicator when connected

## Next Steps

1. **Get WalletConnect Project ID** (see above)
2. **Implement wallet authentication API**:
   - Create `/api/auth/wallet-login` endpoint
   - Verify wallet signature
   - Create/login user by wallet address
3. **Add wallet to registration flow**
4. **Store wallet address in database**
5. **Implement signature verification** for enhanced security

## Testing

After adding your Project ID, test with:

- MetaMask browser extension
- WalletConnect mobile wallets (scan QR code)
- Coinbase Wallet
- Any EVM-compatible wallet

The modal will show all available options automatically!
