/**
 * API Route: Record Pharmacist Receipt
 * POST /api/traceability/movements/pharmacist-receipt
 * Records drug receipt by pharmacist on blockchain and in database
 */

import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import { getTraceabilityModels } from "@/lib/database/traceabilityModels";
import { traceabilityService } from "@/lib/services/TraceabilityService";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();
    const { DrugBatch, MovementRecord, TraceabilityAudit } =
      getTraceabilityModels();

    const body = await req.json();
    const { batchId, quantity, notes, walletAddress, privateKey } = body;

    // Validate required fields
    if (!batchId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Set up signer for blockchain transaction
    if (privateKey) {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
      );
      const signer = new ethers.Wallet(privateKey, provider);
      traceabilityService.setSigner(signer);
    }

    // Get batch details to find manufacturer address
    const batch = await DrugBatch.findById(batchId);

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch not found",
        },
        { status: 404 }
      );
    }

    // Record receipt on blockchain
    const blockchainResult = await traceabilityService.recordPharmacistReceipt(
      batch.onchain_batch_id || batchId,
      quantity,
      notes || ""
    );

    if (!blockchainResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            blockchainResult.error || "Failed to record receipt on blockchain",
        },
        { status: 500 }
      );
    }

    // Store in database
    const newMovement = await MovementRecord.create({
      batch_id: batchId,
      movement_type: "received_by_pharmacist",
      from_address: batch.manufacturer_address,
      to_address: walletAddress || "",
      quantity,
      transaction_hash: blockchainResult.txHash || undefined,
      notes: notes || undefined,
      onchain_movement_id: blockchainResult.movementId || undefined,
      onchain_tx_hash: blockchainResult.txHash || undefined,
    });

    // Create audit trail
    await TraceabilityAudit.create({
      batch_id: batchId,
      action: "movement_recorded",
      performed_by: "000000000000000000000001", // system user placeholder
      blockchain_tx_hash: blockchainResult.txHash || undefined,
      details: {
        onchain_movement_id: blockchainResult.movementId,
        movement_type: "received_by_pharmacist",
        quantity,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        movementId: newMovement._id,
        onchainMovementId: blockchainResult.movementId,
        txHash: blockchainResult.txHash,
      },
      message: "Pharmacist receipt recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording pharmacist receipt:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
