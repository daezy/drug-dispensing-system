/**
 * API Route: Fraud Detection
 * GET /api/reporting/fraud
 * Detects and returns fraud alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { reportingService } from "@/lib/services/ReportingService";

export async function GET(req: NextRequest) {
  try {
    const alerts = await reportingService.detectFraud();

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        medium: alerts.filter((a) => a.severity === "medium").length,
        low: alerts.filter((a) => a.severity === "low").length,
      },
    });
  } catch (error: any) {
    console.error("Error detecting fraud:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to detect fraud",
      },
      { status: 500 }
    );
  }
}
