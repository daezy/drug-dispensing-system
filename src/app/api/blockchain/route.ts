// API endpoint for blockchain operations
// Handles blockchain sync, status, and manual operations

import { NextRequest, NextResponse } from "next/server";
import { blockchainSyncService } from "@/lib/blockchain/BlockchainSyncService";
import { baseClient } from "@/lib/blockchain/BaseClient";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Verify JWT token
function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET: Get blockchain sync status and network info
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (admin only for blockchain operations)
    const user = verifyToken(request);
    if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Pharmacist access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Get sync status
    if (action === "status" || !action) {
      const syncStatus = blockchainSyncService.getSyncStatus();
      const networkInfo = baseClient.getNetworkInfo();
      const currentBlock = await baseClient.getBlockNumber();

      return NextResponse.json({
        success: true,
        data: {
          sync: syncStatus,
          network: networkInfo,
          currentBlock: currentBlock.toString(),
        },
      });
    }

    // Get transaction by hash
    if (action === "transaction") {
      const txHash = searchParams.get("hash");
      if (!txHash) {
        return NextResponse.json(
          { error: "Transaction hash is required" },
          { status: 400 }
        );
      }

      const tx = await baseClient.getTransaction(txHash as `0x${string}`);
      const receipt = await baseClient.getTransactionReceipt(
        txHash as `0x${string}`
      );

      return NextResponse.json({
        success: true,
        data: {
          transaction: tx,
          receipt: receipt,
        },
      });
    }

    // Get block by number
    if (action === "block") {
      const blockNumber = searchParams.get("number");
      if (!blockNumber) {
        return NextResponse.json(
          { error: "Block number is required" },
          { status: 400 }
        );
      }

      const block = await baseClient.getBlock(BigInt(blockNumber));

      return NextResponse.json({
        success: true,
        data: { block },
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in blockchain GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch blockchain data", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Manage blockchain sync (start, stop, sync historical)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only)
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, fromBlock, toBlock } = body;

    // Start blockchain sync
    if (action === "start") {
      const startBlock = fromBlock ? BigInt(fromBlock) : undefined;
      await blockchainSyncService.startSync(startBlock);

      return NextResponse.json({
        success: true,
        message: "Blockchain synchronization started",
        data: blockchainSyncService.getSyncStatus(),
      });
    }

    // Stop blockchain sync
    if (action === "stop") {
      blockchainSyncService.stopSync();

      return NextResponse.json({
        success: true,
        message: "Blockchain synchronization stopped",
        data: blockchainSyncService.getSyncStatus(),
      });
    }

    // Sync historical events
    if (action === "sync-historical") {
      if (!fromBlock || !toBlock) {
        return NextResponse.json(
          { error: "fromBlock and toBlock are required for historical sync" },
          { status: 400 }
        );
      }

      await blockchainSyncService.syncHistoricalEvents(
        BigInt(fromBlock),
        BigInt(toBlock)
      );

      return NextResponse.json({
        success: true,
        message: "Historical events synchronized",
        data: {
          fromBlock,
          toBlock,
          syncedRange: `${fromBlock} - ${toBlock}`,
        },
      });
    }

    // Handle blockchain reorganization
    if (action === "handle-reorg") {
      if (!fromBlock) {
        return NextResponse.json(
          { error: "fromBlock is required for reorg handling" },
          { status: 400 }
        );
      }

      await blockchainSyncService.handleReorg(BigInt(fromBlock));

      return NextResponse.json({
        success: true,
        message: "Blockchain reorganization handled",
        data: { reorgFromBlock: fromBlock },
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in blockchain POST:", error);
    return NextResponse.json(
      {
        error: "Failed to perform blockchain operation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
