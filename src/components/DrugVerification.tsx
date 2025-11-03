"use client";

/**
 * Drug Verification Component
 * Allows patients to verify drug authenticity using verification hash
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Search,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  Shield,
} from "lucide-react";

interface DrugVerificationProps {
  patientAddress?: string;
}

interface VerificationResult {
  isValid: boolean;
  dispensing?: {
    dispensingId: string;
    batchId: string;
    prescriptionId: string;
    patientAddress: string;
    pharmacistAddress: string;
    quantity: number;
    dispensedAt: string;
    isVerified: boolean;
    verifiedAt?: string;
  };
  batch?: {
    drugName: string;
    batchNumber: string;
    manufacturer: string;
    manufacturedDate: string;
    expiryDate: string;
  };
  movementHistory?: Array<{
    movementId: string;
    movementType: string;
    fromAddress: string;
    toAddress: string;
    quantity: number;
    timestamp: string;
    notes?: string;
  }>;
}

export default function DrugVerification({
  patientAddress,
}: DrugVerificationProps) {
  const [verificationHash, setVerificationHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!verificationHash.trim()) {
      setError("Please enter a verification hash");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/traceability/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationHash: verificationHash.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setResult(data.data);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify drug");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
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
      {/* Verification Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Verify Drug Authenticity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Verification Hash
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter verification hash (e.g., 0x123...)"
                value={verificationHash}
                onChange={(e) => setVerificationHash(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleVerify}
                disabled={loading || !verificationHash.trim()}
              >
                {loading ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter the verification hash provided when you received the
              medication
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && result.isValid && (
        <div className="space-y-4">
          {/* Success Message */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Authentic Drug Verified!</strong>
              <br />
              This medication has been verified as genuine and properly
              dispensed through our blockchain system.
            </AlertDescription>
          </Alert>

          {/* Batch Information */}
          {result.batch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Drug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Drug Name</p>
                    <p className="font-semibold">{result.batch.drugName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Batch Number</p>
                    <p className="font-mono text-sm">
                      {result.batch.batchNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manufacturer</p>
                    <p className="font-mono text-xs">
                      {formatAddress(result.batch.manufacturer)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity Dispensed</p>
                    <p className="font-semibold">
                      {result.dispensing?.quantity} units
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Manufactured Date
                    </p>
                    <p className="text-sm">
                      {formatDate(result.batch.manufacturedDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expiry Date
                    </p>
                    <p className="text-sm">
                      {formatDate(result.batch.expiryDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dispensing Information */}
          {result.dispensing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Dispensing Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Pharmacist Address</p>
                    <p className="font-mono text-xs">
                      {formatAddress(result.dispensing.pharmacistAddress)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dispensed Date</p>
                    <p className="text-sm">
                      {formatDate(result.dispensing.dispensedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verification Status</p>
                    <Badge
                      variant={
                        result.dispensing.isVerified ? "default" : "secondary"
                      }
                      className={
                        result.dispensing.isVerified
                          ? "bg-green-500"
                          : undefined
                      }
                    >
                      {result.dispensing.isVerified
                        ? "Verified"
                        : "Not Yet Verified"}
                    </Badge>
                  </div>
                  {result.dispensing.verifiedAt && (
                    <div>
                      <p className="text-sm text-gray-600">
                        First Verified Date
                      </p>
                      <p className="text-sm">
                        {formatDate(result.dispensing.verifiedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movement History */}
          {result.movementHistory && result.movementHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Drug Journey (Traceability)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.movementHistory.map((movement, index) => (
                    <div
                      key={movement.movementId}
                      className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0"
                    >
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {getMovementTypeLabel(movement.movementType)}
                          </Badge>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="font-medium">From:</span>
                              <span className="font-mono text-xs">
                                {movement.fromAddress
                                  ? formatAddress(movement.fromAddress)
                                  : "Manufacturer"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-medium">To:</span>
                              <span className="font-mono text-xs">
                                {formatAddress(movement.toAddress)}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Quantity:</span>{" "}
                              {movement.quantity} units
                            </div>
                            {movement.notes && (
                              <div className="text-gray-600">
                                <span className="font-medium">Notes:</span>{" "}
                                {movement.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(movement.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
