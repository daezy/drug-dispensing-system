/**
 * API Route: Record Patient Dispensing
 * POST /api/traceability/dispensing/record
 * Records drug dispensing to patient with verification hash
 */

import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import {
  DrugBatch,
  MovementRecord,
  DispensingRecord,
  TraceabilityAudit,
} from "@/lib/database/traceabilityModels";
import { traceabilityService } from "@/lib/services/TraceabilityService";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    // Ensure database connection
    await DatabaseManager.getInstance().ensureConnection();

    const body = await req.json();
    const {
      batchId,
      prescriptionId,
      patientAddress,
      pharmacistAddress,
      quantity,
      privateKey,
    } = body;

    // Validate required fields
    if (
      !batchId ||
      !prescriptionId ||
      !patientAddress ||
      !pharmacistAddress ||
      !quantity
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

    // Get batch details
    const batch = await DrugBatch.findOne({ batch_id: batchId });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch not found",
        },
        { status: 404 }
      );
    }

    // Check if batch has enough quantity
    if (batch.remaining_quantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient quantity in batch",
        },
        { status: 400 }
      );
    }

    // Record dispensing on blockchain
    const blockchainResult = await traceabilityService.recordPatientDispensing(
      batch.onchain_batch_id || batchId,
      prescriptionId,
      patientAddress,
      quantity
    );

    if (!blockchainResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            blockchainResult.error ||
            "Failed to record dispensing on blockchain",
        },
        { status: 500 }
      );
    }

    // Update batch quantity
    batch.remaining_quantity -= quantity;
    await batch.save();

    // Store dispensing record in database
    const dispensingRecord = new DispensingRecord({
      batch_id: batchId,
      prescription_id: prescriptionId,
      patient_address: patientAddress,
      pharmacist_address: pharmacistAddress,
      quantity,
      verification_hash: blockchainResult.verificationHash || "",
      onchain_dispensing_id: blockchainResult.dispensingId || null,
      onchain_tx_hash: blockchainResult.txHash || null,
      is_verified: false,
    });

    await dispensingRecord.save();

    // Store movement record
    const movementRecord = new MovementRecord({
      batch_id: batchId,
      movement_type: "dispensed_to_patient",
      from_address: pharmacistAddress,
      to_address: patientAddress,
      quantity,
      transaction_hash: blockchainResult.verificationHash || null,
      prescription_id: prescriptionId,
      onchain_movement_id: null,
      onchain_tx_hash: blockchainResult.txHash || null,
    });

    await movementRecord.save();

    // Create audit trail
    const auditRecord = new TraceabilityAudit({
      batch_id: batchId,
      action: "dispensing_recorded",
      performed_by: 1, // system user for now
      blockchain_tx_hash: blockchainResult.txHash || null,
      details: {
        onchain_dispensing_id: blockchainResult.dispensingId,
        prescription_id: prescriptionId,
        patient_address: patientAddress,
        quantity,
      },
    });

    await auditRecord.save();

    return NextResponse.json({
      success: true,
      data: {
        dispensingId: dispensingRecord._id,
        onchainDispensingId: blockchainResult.dispensingId,
        verificationHash: blockchainResult.verificationHash,
        txHash: blockchainResult.txHash,
      },
      message: "Drug dispensing recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording patient dispensing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
