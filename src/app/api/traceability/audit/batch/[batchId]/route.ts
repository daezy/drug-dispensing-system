/**
 * API Route: Get Batch Movement History (Admin Audit)
 * GET /api/traceability/audit/batch/[batchId]
 * Retrieves complete movement history for a drug batch
 */

import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import {
  DrugBatch,
  MovementRecord,
  DispensingRecord,
  TraceabilityAudit,
} from "@/lib/database/traceabilityModels";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    // Await params as per Next.js 14+ requirements
    const { batchId } = await params;

    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch ID is required",
        },
        { status: 400 }
      );
    }

    // Ensure database connection
    await DatabaseManager.getInstance().ensureConnection();

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

    // Get movement history
    const movements = await MovementRecord.find({ batch_id: batchId }).sort({
      timestamp: 1,
    });

    // Get dispensing records
    const dispensings = await DispensingRecord.find({ batch_id: batchId }).sort(
      {
        created_at: 1,
      }
    );

    // Get audit trail (with user lookup if available)
    const audits = await TraceabilityAudit.find({ batch_id: batchId }).sort({
      timestamp: -1,
    });

    return NextResponse.json({
      success: true,
      data: {
        batch: {
          batchId: batch.batch_id,
          drugId: batch.drug_id,
          drugName: batch.drug_name,
          batchNumber: batch.batch_number,
          manufacturer: batch.manufacturer_address,
          manufacturedDate: batch.manufactured_date,
          expiryDate: batch.expiry_date,
          initialQuantity: batch.initial_quantity,
          remainingQuantity: batch.remaining_quantity,
          isActive: batch.is_active,
          onchainBatchId: batch.onchain_batch_id,
          onchainTxHash: batch.onchain_tx_hash,
        },
        movements: movements.map((m) => ({
          movementId: m._id,
          movementType: m.movement_type,
          fromAddress: m.from_address,
          toAddress: m.to_address,
          quantity: m.quantity,
          timestamp: m.timestamp,
          transactionHash: m.transaction_hash,
          notes: m.notes,
          prescriptionId: m.prescription_id,
          onchainMovementId: m.onchain_movement_id,
          onchainTxHash: m.onchain_tx_hash,
        })),
        dispensings: dispensings.map((d) => ({
          dispensingId: d._id,
          prescriptionId: d.prescription_id,
          patientAddress: d.patient_address,
          pharmacistAddress: d.pharmacist_address,
          quantity: d.quantity,
          verificationHash: d.verification_hash,
          isVerified: d.is_verified,
          verifiedAt: d.verified_at,
          dispensedAt: d.created_at,
          onchainDispensingId: d.onchain_dispensing_id,
          onchainTxHash: d.onchain_tx_hash,
        })),
        auditTrail: audits.map((a) => ({
          auditId: a._id,
          action: a.action,
          performedBy: a.performed_by,
          blockchainTxHash: a.blockchain_tx_hash,
          timestamp: a.timestamp,
          details: a.details,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching batch audit history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
