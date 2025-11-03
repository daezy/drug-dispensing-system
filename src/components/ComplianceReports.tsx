"use client";

/**
 * Compliance Reports Interface
 * Generate and export compliance reports with filters
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Eye,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Package,
  Activity,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface ReportPreviewData {
  type: string;
  recordCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalRecords: number;
    uniquePatients?: number;
    uniqueDrugs?: number;
    totalQuantity?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
  };
  sampleData: any[];
}

export default function ComplianceReports() {
  const [reportType, setReportType] = useState<string>("audit_logs");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    {
      value: "audit_logs",
      label: "Audit Logs",
      description: "Complete audit trail of all system activities",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      value: "dispensed_drugs",
      label: "Dispensed Drugs",
      description: "All dispensed prescriptions and medications",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      value: "stock_levels",
      label: "Stock Levels",
      description: "Current inventory and stock status",
      icon: <Package className="h-5 w-5" />,
    },
  ];

  const selectedReport = reportTypes.find((r) => r.value === reportType);

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      setError(null);

      let endpoint = "";
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      switch (reportType) {
        case "audit_logs":
          endpoint = `/api/reporting/audit-logs?${params.toString()}`;
          break;
        case "dispensed_drugs":
          endpoint = `/api/reporting/dispensed?${params.toString()}`;
          break;
        case "stock_levels":
          endpoint = `/api/reporting/stock?${params.toString()}`;
          break;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch preview");
      }

      // Transform data for preview
      const previewData: ReportPreviewData = {
        type: reportType,
        recordCount: result.data.length,
        dateRange: {
          start: startDate?.toISOString() || "",
          end: endDate?.toISOString() || "",
        },
        summary: calculateSummary(reportType, result.data),
        sampleData: result.data.slice(0, 5), // Show first 5 records
      };

      setPreviewData(previewData);
    } catch (err: any) {
      console.error("Error fetching preview:", err);
      setError(err.message || "Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const calculateSummary = (type: string, data: any[]) => {
    const summary: any = {
      totalRecords: data.length,
    };

    if (type === "dispensed_drugs") {
      summary.uniquePatients = new Set(data.map((d) => d.patient_id)).size;
      summary.uniqueDrugs = new Set(data.map((d) => d.drug_id)).size;
      summary.totalQuantity = data.reduce(
        (sum, d) => sum + (d.quantity_dispensed || 0),
        0
      );
    } else if (type === "stock_levels") {
      summary.lowStockItems = data.filter(
        (d) => d.current_stock <= d.reorder_level
      ).length;
      summary.outOfStockItems = data.filter(
        (d) => d.current_stock === 0
      ).length;
    }

    return summary;
  };

  const handleExport = async (format: string) => {
    try {
      setLoading(true);
      setError(null);

      const body: any = {
        type: reportType,
        format,
      };

      if (startDate) body.startDate = startDate.toISOString();
      if (endDate) body.endDate = endDate.toISOString();

      const response = await fetch("/api/reporting/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err.message || "Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const renderSampleData = () => {
    if (!previewData) return null;

    const { sampleData, type } = previewData;

    if (type === "audit_logs") {
      return (
        <div className="space-y-2">
          {sampleData.map((record, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 text-sm bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge>{record.action}</Badge>
                <span className="text-xs text-gray-500">
                  {new Date(record.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">{record.user_role}:</span>{" "}
                {record.description}
              </div>
              {record.ip_address && (
                <div className="text-xs text-gray-500 mt-1">
                  IP: {record.ip_address}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (type === "dispensed_drugs") {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Drug Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Patient
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Quantity
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleData.map((record, index) => (
                <tr key={index} className="bg-white">
                  <td className="px-4 py-2">{record.drug_name}</td>
                  <td className="px-4 py-2">{record.patient_name}</td>
                  <td className="px-4 py-2">{record.quantity_dispensed}</td>
                  <td className="px-4 py-2">
                    {new Date(record.dispensed_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{record.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (type === "stock_levels") {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Drug Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Current Stock
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Reorder Level
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Expiry Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleData.map((record, index) => (
                <tr key={index} className="bg-white">
                  <td className="px-4 py-2">{record.drug_name}</td>
                  <td className="px-4 py-2">{record.current_stock}</td>
                  <td className="px-4 py-2">{record.reorder_level}</td>
                  <td className="px-4 py-2">
                    {new Date(record.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      className={
                        record.current_stock === 0
                          ? "bg-red-500"
                          : record.current_stock <= record.reorder_level
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }
                    >
                      {record.current_stock === 0
                        ? "Out of Stock"
                        : record.current_stock <= record.reorder_level
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
        <p className="text-gray-600 mt-1">
          Generate and export compliance reports for auditing and analysis
        </p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Select Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <button
                  key={report.value}
                  onClick={() => {
                    setReportType(report.value);
                    setPreviewData(null);
                  }}
                  className={`border rounded-lg p-4 text-left transition-all ${
                    reportType === report.value
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded ${
                        reportType === report.value
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.icon}
                    </div>
                    <span className="font-semibold">{report.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Date Range (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {startDate && endDate && startDate > endDate && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Start date must be before end date
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handlePreview}
              disabled={
                previewLoading || (startDate && endDate && startDate > endDate)
              }
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewLoading ? "Loading..." : "Preview Report"}
            </Button>
            <Button
              onClick={() => handleExport("csv")}
              disabled={
                loading || (startDate && endDate && startDate > endDate)
              }
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              disabled={
                loading || (startDate && endDate && startDate > endDate)
              }
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Report Preview
              </span>
              <Badge variant="outline">{previewData.recordCount} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold">
                  {previewData.summary.totalRecords}
                </p>
              </div>
              {previewData.summary.uniquePatients && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unique Patients</p>
                  <p className="text-2xl font-bold">
                    {previewData.summary.uniquePatients}
                  </p>
                </div>
              )}
              {previewData.summary.uniqueDrugs && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unique Drugs</p>
                  <p className="text-2xl font-bold">
                    {previewData.summary.uniqueDrugs}
                  </p>
                </div>
              )}
              {previewData.summary.totalQuantity && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {previewData.summary.totalQuantity}
                  </p>
                </div>
              )}
              {previewData.summary.lowStockItems !== undefined && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Low Stock Items</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {previewData.summary.lowStockItems}
                  </p>
                </div>
              )}
              {previewData.summary.outOfStockItems !== undefined && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {previewData.summary.outOfStockItems}
                  </p>
                </div>
              )}
            </div>

            {/* Sample Data */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Sample Data (First 5 Records)
              </h3>
              {renderSampleData()}
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This is a preview of the first 5 records. Export the full report
                to download all {previewData.recordCount} records.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
