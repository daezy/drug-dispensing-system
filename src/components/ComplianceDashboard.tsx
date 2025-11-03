"use client";

/**
 * Compliance Dashboard
 * Real-time dashboard showing dispensed drugs, pending prescriptions, stock levels, and fraud alerts
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Activity,
} from "lucide-react";

interface DashboardData {
  dispensedDrugs: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  pendingPrescriptions: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    expired: number;
  };
  stockLevels: {
    totalDrugs: number;
    lowStock: number;
    outOfStock: number;
    expired: number;
    expiringThisMonth: number;
  };
  fraudAlerts: {
    total: number;
    critical: number;
    medium: number;
    low: number;
    recentAlerts: Array<{
      id: string;
      type: string;
      severity: string;
      description: string;
      detectedAt: string;
      status: string;
    }>;
  };
}

export default function ComplianceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reporting/dashboard");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }

      setData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleExport = async (type: string, format: string) => {
    try {
      const response = await fetch("/api/reporting/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFraudTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Compliance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and reporting • Last updated:{" "}
            {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button onClick={fetchDashboardData} size="sm" variant="outline">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dispensed Drugs */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Dispensed Drugs
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {data.dispensedDrugs.thisMonth}
                    </p>
                    <div className="flex items-center mt-2 text-sm">
                      {data.dispensedDrugs.trend >= 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">
                            +{data.dispensedDrugs.trend}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600 font-medium">
                            {data.dispensedDrugs.trend}%
                          </span>
                        </>
                      )}
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <Package className="h-12 w-12 text-blue-500" />
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Today</p>
                    <p className="text-lg font-bold">
                      {data.dispensedDrugs.today}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Week</p>
                    <p className="text-lg font-bold">
                      {data.dispensedDrugs.thisWeek}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-lg font-bold">
                      {data.dispensedDrugs.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Prescriptions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Prescriptions
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {data.pendingPrescriptions.total}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Total active</p>
                  </div>
                  <FileText className="h-12 w-12 text-purple-500" />
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      {data.pendingPrescriptions.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Verified</span>
                    <Badge variant="outline" className="bg-green-50">
                      {data.pendingPrescriptions.verified}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <Badge variant="outline" className="bg-red-50">
                      {data.pendingPrescriptions.rejected}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Levels */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Stock Status
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {data.stockLevels.totalDrugs}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Total drugs</p>
                  </div>
                  <Package className="h-12 w-12 text-orange-500" />
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      Low Stock
                    </span>
                    <Badge className="bg-yellow-500">
                      {data.stockLevels.lowStock}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      Out of Stock
                    </span>
                    <Badge className="bg-red-500">
                      {data.stockLevels.outOfStock}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                      Expired
                    </span>
                    <Badge className="bg-red-600">
                      {data.stockLevels.expired}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Alerts */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Fraud Alerts
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {data.fraudAlerts.total}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Detected issues
                    </p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Critical</span>
                    <Badge className="bg-red-500">
                      {data.fraudAlerts.critical}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Medium</span>
                    <Badge className="bg-yellow-500">
                      {data.fraudAlerts.medium}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Low</span>
                    <Badge className="bg-blue-500">
                      {data.fraudAlerts.low}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Fraud Alerts */}
          {data.fraudAlerts.recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Recent Fraud Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.fraudAlerts.recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r"
                    >
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {getFraudTypeLabel(alert.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {alert.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Detected:{" "}
                          {new Date(alert.detectedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Audit Logs</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete audit trail of all system activities
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("audit_logs", "csv")}
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("audit_logs", "pdf")}
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dispensed Drugs</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    All dispensed prescriptions and medications
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("dispensed_drugs", "csv")}
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("dispensed_drugs", "pdf")}
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Stock Levels</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Current inventory and stock status
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("stock_levels", "csv")}
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("stock_levels", "pdf")}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
