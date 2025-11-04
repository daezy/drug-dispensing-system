import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { baseSepolia, sepolia } from "wagmi/chains";

// Get projectId from https://cloud.walletconnect.com
export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const metadata = {
  name: "PharmChain",
  description: "Blockchain-based prescription management system",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3002",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Support Base Sepolia (testnet) and Sepolia (Ethereum testnet)
// Base Sepolia is the primary network for this application
export const chains = [baseSepolia, sepolia] as const;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableCoinbase: false, // Disable Coinbase to avoid CORS errors
  enableInjected: true,
  enableWalletConnect: true,
  enableEIP6963: true,
});

// Create modal - initialize once
let modalInitialized = false;
let modal: any = null;

export function initializeWeb3Modal() {
  if (typeof window !== "undefined" && !modalInitialized) {
    try {
      modal = createWeb3Modal({
        wagmiConfig,
        projectId,
        enableAnalytics: false,
        enableOnramp: false,
      });
      modalInitialized = true;
      console.log("✅ Web3Modal initialized successfully");
      console.log(
        "🌐 Supported networks: Base Sepolia (84532), Sepolia (11155111)"
      );
      console.log("📡 RPC Endpoint: https://sepolia.base.org");
    } catch (error) {
      console.error("❌ Error initializing Web3Modal:", error);
      console.error("💡 Check NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env");
    }
  }
  return modal;
}

export function getWeb3Modal() {
  return modal;
}
