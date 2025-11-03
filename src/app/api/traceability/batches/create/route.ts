/**
 * API Route: Create Drug Batch
 * POST /api/traceability/batches/create
 * Creates a new drug batch on blockchain and in database
 */

import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import { getTraceabilityModels } from "@/lib/database/traceabilityModels";
import { traceabilityService } from "@/lib/services/TraceabilityService";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();
    const { DrugBatch, TraceabilityAudit } = getTraceabilityModels();

    const body = await req.json();
    const {
      drugId,
      drugName,
      batchNumber,
      quantity,
      manufacturedDate,
      expiryDate,
      metadataHash,
      walletAddress,
      privateKey,
    } = body;

    // Validate required fields
    if (
      !drugName ||
      !batchNumber ||
      !quantity ||
      !manufacturedDate ||
      !expiryDate
    ) {
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

    // Create batch on blockchain
    const blockchainResult = await traceabilityService.createDrugBatch(
      drugName,
      batchNumber,
      quantity,
      new Date(manufacturedDate),
      new Date(expiryDate),
      metadataHash
    );

    if (!blockchainResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            blockchainResult.error || "Failed to create batch on blockchain",
        },
        { status: 500 }
      );
    }

    // Store in database
    const newBatch = await DrugBatch.create({
      drug_id: drugId || undefined,
      drug_name: drugName,
      batch_number: batchNumber,
      manufacturer_address: walletAddress || "",
      manufactured_date: new Date(manufacturedDate),
      expiry_date: new Date(expiryDate),
      initial_quantity: quantity,
      remaining_quantity: quantity,
      metadata_hash: metadataHash || undefined,
      onchain_batch_id: blockchainResult.batchId || undefined,
      onchain_tx_hash: blockchainResult.txHash || undefined,
    });

    // Create audit trail
    await TraceabilityAudit.create({
      batch_id: newBatch._id,
      action: "batch_created",
      performed_by: "000000000000000000000001", // system user placeholder
      blockchain_tx_hash: blockchainResult.txHash || undefined,
      details: {
        onchain_batch_id: blockchainResult.batchId,
        drug_name: drugName,
        quantity,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId: newBatch._id,
        onchainBatchId: blockchainResult.batchId,
        txHash: blockchainResult.txHash,
      },
      message: "Drug batch created successfully",
    });
  } catch (error: any) {
    console.error("Error creating drug batch:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
