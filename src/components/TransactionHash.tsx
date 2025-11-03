"use client";

import React from "react";
import { ExternalLink, Copy, CheckCircle } from "lucide-react";

interface TransactionHashProps {
  txHash?: string;
  blockNumber?: number;
  chainId?: number;
  label?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

/**
 * Transaction Hash Display Component
 * Shows blockchain transaction hash with links to block explorer
 */
export function TransactionHash({
  txHash,
  blockNumber,
  chainId = 84532, // Base Sepolia default
  label = "Transaction",
  showCopy = true,
  showExplorer = true,
  className = "",
}: TransactionHashProps) {
  const [copied, setCopied] = React.useState(false);

  if (!txHash) {
    return null;
  }

  // Determine block explorer URL based on chain ID
  const blockExplorerUrl =
    chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org";

  // Format hash for display
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">{label}:</span>

      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
        {shortHash}
      </code>

      {showCopy && (
        <button
          onClick={copyToClipboard}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Copy full hash"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}

      {showExplorer && (
        <a
          href={`${blockExplorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 transition-colors"
          title="View on block explorer"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {blockNumber && (
        <span className="text-xs text-gray-500">Block #{blockNumber}</span>
      )}
    </div>
  );
}

/**
 * Transaction Status Badge Component
 * Shows transaction confirmation status
 */
interface TransactionStatusProps {
  status: "pending" | "confirmed" | "failed";
  confirmations?: number;
  className?: string;
}

export function TransactionStatus({
  status,
  confirmations,
  className = "",
}: TransactionStatusProps) {
  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: "⏳",
      label: "Pending",
    },
    confirmed: {
      color: "bg-green-100 text-green-800",
      icon: "✓",
      label: "Confirmed",
    },
    failed: {
      color: "bg-red-100 text-red-800",
      icon: "✗",
      label: "Failed",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${config.color} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {confirmations && status === "confirmed" && (
        <span className="text-xs">({confirmations})</span>
      )}
    </div>
  );
}

export default TransactionHash;
