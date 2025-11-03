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
      const token = localStorage.getItem("token");
      const response = await fetch("/api/blockchain?action=status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blockchain status");
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {error}</span>
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
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" />
          Blockchain Status
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Sync Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Synchronization
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <div className="flex items-center space-x-2">
                {data.sync.isSyncing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-blue-600">
                      Syncing
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Idle
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Event Listener</span>
              <div className="flex items-center space-x-2">
                {data.sync.isListenerRunning ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-600">
                      Running
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm font-medium text-gray-600">
                      Stopped
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Last Processed Block
              </span>
              <span className="text-sm font-mono text-gray-900">
                {data.sync.lastProcessedBlock}
              </span>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Network</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Name</span>
              <span className="text-sm font-medium text-gray-900">
                {data.network.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Chain ID</span>
              <span className="text-sm font-mono text-gray-900">
                {data.network.chainId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Block</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">
                  {data.currentBlock}
                </span>
                <a
                  href={`${blockExplorerUrl}/block/${data.currentBlock}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {data.network.accountAddress && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900">
                    {data.network.accountAddress.slice(0, 6)}...
                    {data.network.accountAddress.slice(-4)}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(data.network.accountAddress!)
                    }
                    className="text-gray-500 hover:text-gray-700"
                    title="Copy address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={`${blockExplorerUrl}/address/${data.network.accountAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchStatus}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export default BlockchainStatus;
