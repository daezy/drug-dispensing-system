"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
} from "lucide-react";

interface BlockchainStatusProps {
  className?: string;
}

interface SyncStatus {
  isSyncing: boolean;
  isListenerRunning: boolean;
  lastProcessedBlock: string;
}

interface NetworkInfo {
  chainId: number;
  name: string;
  network: string;
  rpcEndpoint: string;
  hasWallet: boolean;
  accountAddress?: string;
}

interface BlockchainData {
  sync: SyncStatus;
  network: NetworkInfo;
  currentBlock: string;
}

/**
 * Blockchain Status Component
 * Displays blockchain sync status, network info, and current block
 */
export function BlockchainStatus({ className = "" }: BlockchainStatusProps) {
  const [data, setData] = useState<BlockchainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blockchain status
  const fetchStatus = async () => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await fetch("/api/blockchain?action=status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch blockchain status (${response.status}). Check network configuration.`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response from blockchain API");
      }

      setData(result.data);
      setError(null);
      console.log("✅ Blockchain status updated:", result.data.network.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Blockchain status error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading blockchain status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Blockchain Connection Error</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300 mb-2 font-semibold">
              Expected Configuration:
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Network: Base Sepolia (Chain ID: 84532)</li>
              <li>• RPC: https://sepolia.base.org</li>
              <li>• Auth: Login required (all roles supported)</li>
            </ul>
          </div>
          <button
            onClick={fetchStatus}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const blockExplorerUrl =
    data.network.chainId === 84532
      ? "https://sepolia.basescan.org"
      : "https://basescan.org";

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Blockchain
          </h3>
        </div>
        <button
          onClick={fetchStatus}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Network
          </span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {data.network.name}
          </span>
        </div>

        {/* Chain ID */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Chain ID
          </span>
          <span className="text-xs font-mono text-gray-900 dark:text-white">
            {data.network.chainId}
          </span>
        </div>

        {/* Current Block */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Block
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-900 dark:text-white">
              {data.currentBlock}
            </span>
            <a
              href={`${blockExplorerUrl}/block/${data.currentBlock}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Sync Status - Only show if syncing */}
        {data.sync.isSyncing && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Status
            </span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Syncing...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockchainStatus;
