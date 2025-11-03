"use client";

/**
 * Fraud Alerts Dashboard
 * Comprehensive fraud detection and alert management interface
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface FraudAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  relatedEntities: {
    prescriptionId?: string;
    patientId?: string;
    doctorId?: string;
    pharmacistId?: string;
    drugId?: string;
  };
  detectedAt: string;
  status: string;
  investigatedBy?: string;
  investigatedAt?: string;
  resolution?: string;
  notes?: string;
}

interface FraudSummary {
  total: number;
  critical: number;
  medium: number;
  low: number;
  pending: number;
  resolved: number;
  falsePositive: number;
  byType: Record<string, number>;
}

export default function FraudAlertsDashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [summary, setSummary] = useState<FraudSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const fetchFraudAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reporting/fraud");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch fraud alerts");
      }

      setAlerts(result.data.alerts);
      setSummary(result.data.summary);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching fraud alerts:", err);
      setError(err.message || "Failed to load fraud alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
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

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-500";
      case "medium":
        return "bg-yellow-50 border-yellow-500";
      case "low":
        return "bg-blue-50 border-blue-500";
      default:
        return "bg-gray-50 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "false_positive":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "investigating":
        return <Eye className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getFraudTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity !== "all" && alert.severity !== selectedSeverity)
      return false;
    if (selectedStatus !== "all" && alert.status !== selectedStatus)
      return false;
    if (selectedType !== "all" && alert.type !== selectedType) return false;
    return true;
  });

  const fraudTypes = summary
    ? Object.keys(summary.byType).map((type) => ({
        value: type,
        label: getFraudTypeLabel(type),
        count: summary.byType[type],
      }))
    : [];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading fraud alerts...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
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
            Fraud Detection & Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and investigate suspicious activities
          </p>
        </div>
        <Button onClick={fetchFraudAlerts} size="sm">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Total Alerts
                    </p>
                    <p className="text-3xl font-bold mt-2">{summary.total}</p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Critical
                    </p>
                    <p className="text-3xl font-bold mt-2 text-red-600">
                      {summary.critical}
                    </p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending</p>
                    <p className="text-3xl font-bold mt-2 text-orange-600">
                      {summary.pending}
                    </p>
                  </div>
                  <Eye className="h-12 w-12 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Resolved
                    </p>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                      {summary.resolved}
                    </p>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fraud Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Fraud Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fraudTypes.map((fraudType) => (
                  <div
                    key={fraudType.value}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {fraudType.label}
                      </span>
                      <Badge variant="outline">{fraudType.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filter Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Severity
                  </label>
                  <Select
                    value={selectedSeverity}
                    onValueChange={setSelectedSeverity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">
                        Investigating
                      </SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false_positive">
                        False Positive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Fraud Type
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {fraudTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} ({type.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Fraud Alerts ({filteredAlerts.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">
                    No fraud alerts found
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedSeverity !== "all" ||
                    selectedStatus !== "all" ||
                    selectedType !== "all"
                      ? "Try adjusting your filters"
                      : "The system is running smoothly"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-l-4 rounded-lg p-4 ${getSeverityBg(
                        alert.severity
                      )}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={getSeverityColor(alert.severity)}
                              >
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-semibold">
                                {getFraudTypeLabel(alert.type)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">
                              {alert.description}
                            </p>

                            {/* Related Entities */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {alert.relatedEntities.prescriptionId && (
                                <Badge variant="outline" className="text-xs">
                                  Rx: {alert.relatedEntities.prescriptionId}
                                </Badge>
                              )}
                              {alert.relatedEntities.patientId && (
                                <Badge variant="outline" className="text-xs">
                                  Patient: {alert.relatedEntities.patientId}
                                </Badge>
                              )}
                              {alert.relatedEntities.doctorId && (
                                <Badge variant="outline" className="text-xs">
                                  Doctor: {alert.relatedEntities.doctorId}
                                </Badge>
                              )}
                              {alert.relatedEntities.pharmacistId && (
                                <Badge variant="outline" className="text-xs">
                                  Pharmacist:{" "}
                                  {alert.relatedEntities.pharmacistId}
                                </Badge>
                              )}
                              {alert.relatedEntities.drugId && (
                                <Badge variant="outline" className="text-xs">
                                  Drug: {alert.relatedEntities.drugId}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                Detected:{" "}
                                {new Date(alert.detectedAt).toLocaleString()}
                              </span>
                              {alert.investigatedBy && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Investigated by: {alert.investigatedBy}
                                  </span>
                                </>
                              )}
                            </div>

                            {alert.resolution && (
                              <div className="mt-3 p-3 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  Resolution:
                                </p>
                                <p className="text-sm text-gray-600">
                                  {alert.resolution}
                                </p>
                              </div>
                            )}

                            {alert.notes && (
                              <div className="mt-2 text-sm text-gray-600 italic">
                                Notes: {alert.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(alert.status)}
                            <Badge variant="outline" className="text-xs">
                              {alert.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          {alert.status === "pending" && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Investigate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
