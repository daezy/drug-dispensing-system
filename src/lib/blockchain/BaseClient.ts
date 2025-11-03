// Base Network Client for blockchain integration
// Connects to Base network and manages contract interactions

import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
  Address,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Base network configuration
const NETWORK = process.env.NODE_ENV === "production" ? base : baseSepolia;
const RPC_ENDPOINT =
  process.env.BLOCKCHAIN_RPC_ENDPOINT || "https://sepolia.base.org";

// Private key for backend transactions (should be stored securely in production)
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY as `0x${string}`;

interface BlockchainClientConfig {
  rpcEndpoint?: string;
  privateKey?: `0x${string}`;
  network?: typeof base | typeof baseSepolia;
}

/**
 * Base Network Client
 * Manages connections to Base blockchain for reading and writing data
 */
export class BaseClient {
  private static instance: BaseClient;
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;

  private constructor(config?: BlockchainClientConfig) {
    const network = config?.network || NETWORK;
    const rpcEndpoint = config?.rpcEndpoint || RPC_ENDPOINT;

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: network,
      transport: http(rpcEndpoint),
    });

    // Create wallet client for writing transactions (if private key provided)
    if (config?.privateKey || PRIVATE_KEY) {
      try {
        this.account = privateKeyToAccount(config?.privateKey || PRIVATE_KEY);
        this.walletClient = createWalletClient({
          account: this.account,
          chain: network,
          transport: http(rpcEndpoint),
        });
        console.log("✅ Blockchain wallet client initialized");
      } catch (error) {
        console.warn(
          "⚠️ Wallet client not initialized (no private key):",
          error
        );
      }
    }

    console.log(`🔗 Connected to ${network.name} network`);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: BlockchainClientConfig): BaseClient {
    if (!BaseClient.instance) {
      BaseClient.instance = new BaseClient(config);
    }
    return BaseClient.instance;
  }

  /**
   * Get public client for reading blockchain data
   */
  public getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Get wallet client for writing transactions
   */
  public getWalletClient(): WalletClient | null {
    return this.walletClient;
  }

  /**
   * Get account address
   */
  public getAccount(): Address | null {
    return this.account?.address || null;
  }

  /**
   * Get current block number
   */
  public async getBlockNumber(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }

  /**
   * Get block by number
   */
  public async getBlock(blockNumber: bigint) {
    return await this.publicClient.getBlock({ blockNumber });
  }

  /**
   * Get transaction receipt
   */
  public async getTransactionReceipt(hash: `0x${string}`) {
    return await this.publicClient.getTransactionReceipt({ hash });
  }

  /**
   * Get transaction by hash
   */
  public async getTransaction(hash: `0x${string}`) {
    return await this.publicClient.getTransaction({ hash });
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForTransaction(hash: `0x${string}`, confirmations = 1) {
    return await this.publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
    });
  }

  /**
   * Get network information
   */
  public getNetworkInfo() {
    return {
      chainId: NETWORK.id,
      name: NETWORK.name,
      network: NETWORK.network,
      rpcEndpoint: RPC_ENDPOINT,
      hasWallet: !!this.walletClient,
      accountAddress: this.account?.address,
    };
  }

  /**
   * Check if wallet is ready for transactions
   */
  public isWalletReady(): boolean {
    return !!(this.walletClient && this.account);
  }
}

// Export singleton instance
export const baseClient = BaseClient.getInstance();
export default BaseClient;
