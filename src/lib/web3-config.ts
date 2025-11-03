import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { mainnet, base } from "wagmi/chains";

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

// Support only Ethereum Mainnet and Base
export const chains = [mainnet, base] as const;

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

export function initializeWeb3Modal() {
  if (typeof window !== "undefined" && !modalInitialized) {
    try {
      createWeb3Modal({
        wagmiConfig,
        projectId,
        enableAnalytics: false,
        enableOnramp: false,
      });
      modalInitialized = true;
    } catch (error) {
      console.error("Error initializing Web3Modal:", error);
    }
  }
}

// Auto-initialize
if (typeof window !== "undefined") {
  initializeWeb3Modal();
}
