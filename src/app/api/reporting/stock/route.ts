/**
 * API Route: Stock Levels Report
 * GET /api/reporting/stock
 * Fetches current stock levels report
 */

import { NextRequest, NextResponse } from "next/server";
import { reportingService } from "@/lib/services/ReportingService";

export async function GET(req: NextRequest) {
  try {
    const report = await reportingService.getStockLevelsReport();

    return NextResponse.json({
      success: true,
      data: report,
      count: report.length,
    });
  } catch (error: any) {
    console.error("Error fetching stock levels report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch stock levels report",
      },
      { status: 500 }
    );
  }
}
