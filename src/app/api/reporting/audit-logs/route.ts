/**
 * API Route: Audit Logs
 * GET /api/reporting/audit-logs
 * Fetches audit logs with optional date range
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
    const limit = parseInt(searchParams.get("limit") || "1000");

    const logs = await reportingService.getAuditLogs(startDate, endDate, limit);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch audit logs",
      },
      { status: 500 }
    );
  }
}
