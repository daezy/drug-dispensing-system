"use client";

/**
 * Drug Traceability Audit Logs
 * Admin interface to view complete drug movement history
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Package,
  FileText,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AuditLog {
  auditId: string;
  action: string;
  performedBy: string;
  role: string;
  blockchainTxHash?: string;
  timestamp: string;
  details?: any;
}

interface Movement {
  movementId: string;
  movementType: string;
  fromAddress: string;
  toAddress: string;
  quantity: number;
  timestamp: string;
  transactionHash?: string;
  notes?: string;
  prescriptionId?: string;
}

interface Dispensing {
  dispensingId: string;
  prescriptionId: string;
  patientAddress: string;
  pharmacistAddress: string;
  quantity: number;
  verificationHash: string;
  isVerified: boolean;
  verifiedAt?: string;
  dispensedAt: string;
}

interface Batch {
  batchId: string;
  drugId?: string;
  drugName: string;
  batchNumber: string;
  manufacturer: string;
  manufacturedDate: string;
  expiryDate: string;
  initialQuantity: number;
  remainingQuantity: number;
  isActive: boolean;
  onchainBatchId?: number;
  onchainTxHash?: string;
}

interface BatchAuditData {
  batch: Batch;
  movements: Movement[];
  dispensings: Dispensing[];
  auditTrail: AuditLog[];
}

export default function TraceabilityAuditLogs() {
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<BatchAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMovements: 0,
    totalDispensings: 0,
    verifiedDispensings: 0,
  });

  useEffect(() => {
    if (auditData) {
      setStats({
        totalMovements: auditData.movements.length,
        totalDispensings: auditData.dispensings.length,
        verifiedDispensings: auditData.dispensings.filter((d) => d.isVerified)
          .length,
      });
    }
  }, [auditData]);

  const handleSearch = async () => {
    if (!batchId.trim()) {
      setError("Please enter a batch ID");
      return;
    }

    setLoading(true);
    setError(null);
    setAuditData(null);

    try {
      const response = await fetch(
        `/api/traceability/audit/batch/${batchId.trim()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch audit data");
      }

      setAuditData(data.data);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      setError(err.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      batch_created: "bg-blue-500",
      movement_recorded: "bg-purple-500",
      dispensing_recorded: "bg-green-500",
      verification_performed: "bg-yellow-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manufactured: "Manufactured",
      received_by_pharmacist: "Received by Pharmacist",
      dispensed_to_patient: "Dispensed to Patient",
      returned: "Returned",
      destroyed: "Destroyed",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Drug Traceability Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Batch ID"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !batchId.trim()}
            >
              {loading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Audit Data */}
      {auditData && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Movements</p>
                    <p className="text-2xl font-bold">{stats.totalMovements}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Dispensings</p>
                    <p className="text-2xl font-bold">
                      {stats.totalDispensings}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-2xl font-bold">
                      {stats.verifiedDispensings}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Batch Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Batch Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Drug Name</p>
                  <p className="font-semibold">{auditData.batch.drugName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Number</p>
                  <p className="font-mono">{auditData.batch.batchNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Manufacturer</p>
                  <p className="font-mono text-xs">
                    {formatAddress(auditData.batch.manufacturer)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Initial Quantity</p>
                  <p className="font-semibold">
                    {auditData.batch.initialQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining Quantity</p>
                  <p className="font-semibold">
                    {auditData.batch.remainingQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge
                    variant={auditData.batch.isActive ? "default" : "secondary"}
                    className={
                      auditData.batch.isActive ? "bg-green-500" : undefined
                    }
                  >
                    {auditData.batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Manufactured Date</p>
                  <p className="text-sm">
                    {formatDate(auditData.batch.manufacturedDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="text-sm">
                    {formatDate(auditData.batch.expiryDate)}
                  </p>
                </div>
                {auditData.batch.onchainBatchId && (
                  <div>
                    <p className="text-sm text-gray-600">On-Chain Batch ID</p>
                    <p className="font-mono text-sm">
                      {auditData.batch.onchainBatchId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Movement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData.movements.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No movements recorded
                  </p>
                ) : (
                  auditData.movements.map((movement) => (
                    <div
                      key={movement.movementId}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {getMovementTypeLabel(movement.movementType)}
                          </Badge>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">From:</span>
                              <span className="font-mono text-xs">
                                {movement.fromAddress
                                  ? formatAddress(movement.fromAddress)
                                  : "Manufacturer"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">To:</span>
                              <span className="font-mono text-xs">
                                {formatAddress(movement.toAddress)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span>{" "}
                              {movement.quantity} units
                            </div>
                            {movement.notes && (
                              <div>
                                <span className="font-medium">Notes:</span>{" "}
                                {movement.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(movement.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dispensing Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Dispensing Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData.dispensings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No dispensings recorded
                  </p>
                ) : (
                  auditData.dispensings.map((dispensing) => (
                    <div
                      key={dispensing.dispensingId}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600">Patient</p>
                            <p className="font-mono text-xs">
                              {formatAddress(dispensing.patientAddress)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Pharmacist</p>
                            <p className="font-mono text-xs">
                              {formatAddress(dispensing.pharmacistAddress)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Quantity</p>
                            <p className="font-semibold">
                              {dispensing.quantity} units
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Status</p>
                            <Badge
                              variant={
                                dispensing.isVerified ? "default" : "secondary"
                              }
                              className={
                                dispensing.isVerified
                                  ? "bg-green-500"
                                  : undefined
                              }
                            >
                              {dispensing.isVerified
                                ? "Verified"
                                : "Not Verified"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(dispensing.dispensedAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditData.auditTrail.map((log) => (
                  <div
                    key={log.auditId}
                    className="flex items-start gap-4 border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        {log.blockchainTxHash && (
                          <span className="font-mono text-xs text-gray-600">
                            {formatAddress(log.blockchainTxHash)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{log.performedBy}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
