/**
 * API Route: Dashboard Metrics
 * GET /api/reporting/dashboard
 * Fetches comprehensive dashboard metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { reportingService } from "@/lib/services/ReportingService";

export async function GET(req: NextRequest) {
  try {
    const metrics = await reportingService.getDashboardMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dashboard metrics",
      },
      { status: 500 }
    );
  }
}
