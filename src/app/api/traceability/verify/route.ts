/**
 * API Route: Verify Drug Authenticity
 * POST /api/traceability/verify
 * Allows patients to verify drug authenticity using verification hash
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
    const { verificationHash, privateKey } = body;

    // Validate required fields
    if (!verificationHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification hash is required",
        },
        { status: 400 }
      );
    }

    // Set up signer for blockchain transaction (optional for verification)
    if (privateKey) {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
      );
      const signer = new ethers.Wallet(privateKey, provider);
      traceabilityService.setSigner(signer);
    }

    // Check database first for faster response
    const dispensing = await DispensingRecord.findOne({
      verification_hash: verificationHash,
    });

    if (!dispensing) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification hash",
        },
        { status: 404 }
      );
    }

    // Get batch details
    const batch = await DrugBatch.findOne({ batch_id: dispensing.batch_id });

    // Verify on blockchain (optional - can be used to update verification status)
    try {
      const blockchainResult = await traceabilityService.verifyDrugAuthenticity(
        verificationHash
      );

      if (blockchainResult.success && !dispensing.is_verified) {
        // Update verification status in database
        dispensing.is_verified = true;
        dispensing.verified_at = new Date();
        await dispensing.save();

        // Create audit trail
        const auditRecord = new TraceabilityAudit({
          batch_id: dispensing.batch_id,
          action: "verification_performed",
          performed_by: 1, // system user
          blockchain_tx_hash: blockchainResult.txHash || null,
          details: {
            verification_hash: verificationHash,
            patient_address: dispensing.patient_address,
          },
        });

        await auditRecord.save();
      }
    } catch (blockchainError) {
      console.error("Blockchain verification error:", blockchainError);
      // Continue with database info even if blockchain verification fails
    }

    // Get movement history
    const movements = await MovementRecord.find({
      batch_id: dispensing.batch_id,
    }).sort({ timestamp: 1 });

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        dispensing: {
          dispensingId: dispensing._id,
          batchId: dispensing.batch_id,
          prescriptionId: dispensing.prescription_id,
          patientAddress: dispensing.patient_address,
          pharmacistAddress: dispensing.pharmacist_address,
          quantity: dispensing.quantity,
          dispensedAt: dispensing.created_at,
          isVerified: dispensing.is_verified,
          verifiedAt: dispensing.verified_at,
        },
        batch: batch
          ? {
              drugName: batch.drug_name,
              batchNumber: batch.batch_number,
              manufacturer: batch.manufacturer_address,
              manufacturedDate: batch.manufactured_date,
              expiryDate: batch.expiry_date,
            }
          : null,
        movementHistory: movements.map((m) => ({
          movementId: m._id,
          movementType: m.movement_type,
          fromAddress: m.from_address,
          toAddress: m.to_address,
          quantity: m.quantity,
          timestamp: m.timestamp,
          notes: m.notes,
        })),
      },
      message: "Drug verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying drug authenticity:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
