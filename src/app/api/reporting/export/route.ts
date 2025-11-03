/**
 * API Route: Export Reports
 * POST /api/reporting/export
 * Exports reports in CSV or PDF format
 */

import { NextRequest, NextResponse } from "next/server";
import { reportingService } from "@/lib/services/ReportingService";
import { ExportService } from "@/lib/services/ExportService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, format, startDate, endDate } = body;

    if (!type || !format) {
      return NextResponse.json(
        {
          success: false,
          error: "Type and format are required",
        },
        { status: 400 }
      );
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    switch (type) {
      case "audit_logs": {
        const logs = await reportingService.getAuditLogs(start, end);
        if (format === "csv") {
          content = ExportService.exportAuditLogsCSV(logs);
          filename = `audit_logs_${Date.now()}.csv`;
          mimeType = "text/csv";
        } else {
          content = ExportService.generateAuditLogPDFHTML(logs);
          filename = `audit_logs_${Date.now()}.html`;
          mimeType = "text/html";
        }
        break;
      }

      case "dispensed_drugs": {
        const drugs = await reportingService.getDispensedDrugsReport(
          start,
          end
        );
        if (format === "csv") {
          content = ExportService.exportDispensedDrugsCSV(drugs);
          filename = `dispensed_drugs_${Date.now()}.csv`;
          mimeType = "text/csv";
        } else {
          content = ExportService.generateDispensedDrugsPDFHTML(drugs);
          filename = `dispensed_drugs_${Date.now()}.html`;
          mimeType = "text/html";
        }
        break;
      }

      case "stock_levels": {
        const stock = await reportingService.getStockLevelsReport();
        if (format === "csv") {
          content = ExportService.exportStockLevelsCSV(stock);
          filename = `stock_levels_${Date.now()}.csv`;
          mimeType = "text/csv";
        } else {
          content = ExportService.generateStockLevelsPDFHTML(stock);
          filename = `stock_levels_${Date.now()}.html`;
          mimeType = "text/html";
        }
        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid report type",
          },
          { status: 400 }
        );
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to export report",
      },
      { status: 500 }
    );
  }
}
