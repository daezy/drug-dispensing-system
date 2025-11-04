"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  FileText,
  Calendar,
  User,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/lib/utils/toast-helper";

interface Prescription {
  id: string;
  prescriptionNumber: string;
  medication: string; // Single medication from API
  dosage: string;
  quantity: number;
  dispensedQuantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  status: "pending" | "verified" | "dispensed" | "rejected" | "expired";
  dateIssued: string;
  dateDispensed?: string;
  doctor?: {
    id: string;
    name: string;
    specialty?: string;
    licenseNumber?: string;
  };
  pharmacist?: {
    id: string;
    name: string;
    licenseNumber?: string;
    pharmacyName?: string;
  };
  notes?: string;
  blockchainHash?: string;
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [filter, setFilter] = useState<
    "all" | "issued" | "dispensed" | "expired"
  >("all");

  useEffect(() => {
    if (!user || user.role !== "patient") {
      router.push("/");
      return;
    }
    loadPrescriptions();
  }, [user, router]);

  const loadPrescriptions = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showError("Please log in again");
        router.push("/login");
        return;
      }

      // Fetch prescriptions from API
      const response = await fetch("/api/prescriptions/patient", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        showError("Failed to load prescriptions");
      }
    } catch (error) {
      showError("Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (filter === "all") return true;
    return prescription.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "dispensed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "dispensed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout title="My Prescriptions" role="patient">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                My Prescriptions
              </h2>
              <p className="text-gray-600 mt-1">
                View and manage your prescription history
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("issued")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "issued"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("dispensed")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "dispensed"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Dispensed
              </button>
              <button
                onClick={() => setFilter("expired")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "expired"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No prescriptions found
              </h3>
              <p className="text-gray-600">
                {filter === "all"
                  ? "You don't have any prescriptions yet"
                  : `No ${filter} prescriptions available`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prescription.prescriptionNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {getStatusIcon(prescription.status)}
                          {prescription.status.charAt(0).toUpperCase() +
                            prescription.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {prescription.doctor?.name || "Unknown Doctor"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(
                              prescription.dateIssued
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>

                  {/* Medication Summary */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Medication Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {prescription.medication}
                          </span>
                          <span className="text-gray-600">
                            {prescription.dosage} - {prescription.frequency}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {prescription.quantity}
                          {prescription.status === "dispensed" &&
                            prescription.dispensedQuantity > 0 && (
                              <span className="ml-2 text-green-600">
                                (Dispensed: {prescription.dispensedQuantity})
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {prescription.dateDispensed && (
                    <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                      Dispensed on{" "}
                      {new Date(
                        prescription.dateDispensed
                      ).toLocaleDateString()}{" "}
                      {prescription.pharmacist && (
                        <>
                          by {prescription.pharmacist.name}
                          {prescription.pharmacist.pharmacyName && (
                            <> at {prescription.pharmacist.pharmacyName}</>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription Details Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Prescription Details
                  </h3>
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Prescription Info */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Prescription #
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPrescription.prescriptionNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Doctor
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPrescription.doctor?.name || "Unknown"}
                      </p>
                      {selectedPrescription.doctor?.specialty && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedPrescription.doctor.specialty}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Date Issued
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          selectedPrescription.dateIssued
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          selectedPrescription.status
                        )}`}
                      >
                        {getStatusIcon(selectedPrescription.status)}
                        {selectedPrescription.status.charAt(0).toUpperCase() +
                          selectedPrescription.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {selectedPrescription.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Notes
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedPrescription.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Medication Details
                    </h4>
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-2 bg-white dark:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-lg text-gray-900 dark:text-white">
                          {selectedPrescription.medication}
                        </h5>
                        {selectedPrescription.status === "dispensed" && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Dispensed
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-600 dark:text-gray-400">
                            Dosage:
                          </span>{" "}
                          {selectedPrescription.dosage}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-600 dark:text-gray-400">
                            Frequency:
                          </span>{" "}
                          {selectedPrescription.frequency}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-600 dark:text-gray-400">
                            Duration:
                          </span>{" "}
                          {selectedPrescription.duration}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-600 dark:text-gray-400">
                            Quantity Prescribed:
                          </span>{" "}
                          {selectedPrescription.quantity}
                        </p>
                        {selectedPrescription.status === "dispensed" &&
                          selectedPrescription.dispensedQuantity > 0 && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="text-gray-600 dark:text-gray-400">
                                Quantity Dispensed:
                              </span>{" "}
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {selectedPrescription.dispensedQuantity}
                              </span>
                            </p>
                          )}
                      </div>
                      <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-600 dark:text-gray-400">
                          Instructions:
                        </span>{" "}
                        {selectedPrescription.instructions}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.dateDispensed &&
                    selectedPrescription.pharmacist && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Dispensing Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          {selectedPrescription.pharmacist.pharmacyName && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="text-gray-600 dark:text-gray-400">
                                Pharmacy:
                              </span>{" "}
                              {selectedPrescription.pharmacist.pharmacyName}
                            </p>
                          )}
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400">
                              Dispensed by:
                            </span>{" "}
                            {selectedPrescription.pharmacist.name}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400">
                              Date:
                            </span>{" "}
                            {new Date(
                              selectedPrescription.dateDispensed
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end border-t border-gray-200 dark:border-gray-600 pt-4">
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
