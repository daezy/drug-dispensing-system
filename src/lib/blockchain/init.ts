// Blockchain Integration Bootstrap
// Initializes blockchain sync when server starts

import { blockchainSyncService } from "./BlockchainSyncService";
import { baseClient } from "./BaseClient";

let isInitialized = false;

/**
 * Initialize blockchain integration
 * Starts event listeners and syncs with Base network
 */
export async function initializeBlockchain() {
  if (isInitialized) {
    console.log("⚠️ Blockchain already initialized");
    return;
  }

  try {
    console.log("🚀 Initializing blockchain integration...");

    // Check if contracts are configured
    const networkInfo = baseClient.getNetworkInfo();
    console.log("🔗 Network Info:", {
      chainId: networkInfo.chainId,
      name: networkInfo.name,
      hasWallet: networkInfo.hasWallet,
    });

    // Get current block number
    const currentBlock = await baseClient.getBlockNumber();
    console.log(`📦 Current block: ${currentBlock}`);

    // Start blockchain synchronization
    // Note: In production, you might want to sync from a specific block
    // stored in your database from the last successful sync
    if (process.env.BLOCKCHAIN_AUTO_SYNC === "true") {
      const startBlock = process.env.BLOCKCHAIN_SYNC_FROM_BLOCK
        ? BigInt(process.env.BLOCKCHAIN_SYNC_FROM_BLOCK)
        : currentBlock - BigInt(1000); // Default: last 1000 blocks

      await blockchainSyncService.startSync(startBlock);

      console.log("✅ Blockchain synchronization started");
      console.log(`   Syncing from block: ${startBlock}`);
    } else {
      console.log(
        "⚠️ Auto-sync disabled. Set BLOCKCHAIN_AUTO_SYNC=true to enable"
      );
    }

    isInitialized = true;
    console.log("✅ Blockchain integration initialized successfully");

    return {
      success: true,
      currentBlock: currentBlock.toString(),
      networkInfo,
    };
  } catch (error) {
    console.error("❌ Error initializing blockchain:", error);

    // Don't throw error - allow app to run without blockchain sync
    console.log("⚠️ App will continue without blockchain synchronization");

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Shutdown blockchain integration gracefully
 */
export function shutdownBlockchain() {
  if (!isInitialized) {
    return;
  }

  try {
    blockchainSyncService.stopSync();
    isInitialized = false;
    console.log("👋 Blockchain integration shut down");
  } catch (error) {
    console.error("Error shutting down blockchain:", error);
  }
}

/**
 * Get blockchain initialization status
 */
export function getBlockchainStatus() {
  return {
    isInitialized,
    syncStatus: isInitialized ? blockchainSyncService.getSyncStatus() : null,
    networkInfo: baseClient.getNetworkInfo(),
  };
}

// Auto-initialize if enabled (for Next.js API routes)
if (
  typeof window === "undefined" &&
  process.env.BLOCKCHAIN_AUTO_INIT === "true"
) {
  // Run initialization in background
  initializeBlockchain().catch(console.error);
}
