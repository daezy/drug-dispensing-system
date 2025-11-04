/**
 * API Endpoint: Migrate Patient IDs
 *
 * POST /api/admin/migrate-patient-ids
 *
 * Generates Patient IDs for all existing patients without IDs.
 * Should only be accessible to admin users.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connection";
import { PatientModel } from "@/lib/database/models";
import { UserService } from "@/lib/services/UserService";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Initialize UserService
    const userService = new UserService();

    // Verify token and check admin role
    const verificationResult = await userService.verifyToken(token);

    if (
      !verificationResult.valid ||
      !verificationResult.user ||
      verificationResult.user.role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Find patients without Patient IDs
    const patientsWithoutId = await PatientModel.find({
      $or: [
        { medical_record_number: { $exists: false } },
        { medical_record_number: null },
        { medical_record_number: "" },
      ],
    });

    if (patientsWithoutId.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All patients already have Patient IDs",
        statistics: {
          total: 0,
          success: 0,
          failed: 0,
        },
      });
    }
    const results = {
      total: patientsWithoutId.length,
      success: 0,
      failed: 0,
      generatedIds: [] as string[],
      errors: [] as any[],
    };

    // Generate IDs for each patient
    for (const patient of patientsWithoutId) {
      try {
        const patientId = await userService.generatePatientId();
        patient.medical_record_number = patientId;
        await patient.save();

        results.success++;
        results.generatedIds.push(patientId);
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          patientId: patient._id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${results.success} Patient IDs`,
      statistics: {
        total: results.total,
        success: results.success,
        failed: results.failed,
      },
      sampleIds: results.generatedIds.slice(0, 10), // First 10 IDs as sample
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
