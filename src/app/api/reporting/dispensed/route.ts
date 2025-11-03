/**
 * API Route: Dispensed Drugs Report
 * GET /api/reporting/dispensed
 * Fetches dispensed drugs report with optional date range
 */

import { NextRequest, NextResponse } from "next/server";
import { reportingService } from "@/lib/services/ReportingService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const limit = parseInt(searchParams.get("limit") || "100");

    const report = await reportingService.getDispensedDrugsReport(
      startDate,
      endDate,
      limit
    );

    return NextResponse.json({
      success: true,
      data: report,
      count: report.length,
    });
  } catch (error: any) {
    console.error("Error fetching dispensed drugs report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dispensed drugs report",
      },
      { status: 500 }
    );
  }
}
