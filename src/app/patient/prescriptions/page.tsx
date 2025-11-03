"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  Calendar,
  Clock,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  User,
  Stethoscope,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { showSuccess, showError } from "@/lib/utils/toast-helper";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  doctorName: string;
  doctorLicense: string;
  medications: Medication[];
  diagnosis: string;
  notes: string;
  dateIssued: string;
  status: "issued" | "dispensed" | "expired";
  pharmacyName?: string;
  dispensedDate?: string;
  dispensedBy?: string;
}

interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  dispensed?: boolean;
  dispensedQuantity?: number;
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "dispensed" | "expired"
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
      // Mock data - replace with actual API call
      const mockPrescriptions: Prescription[] = [
        {
          id: "1",
          doctorName: "Dr. Sarah Johnson",
          doctorLicense: "MD-2024-001",
          diagnosis: "Bacterial Infection",
          notes:
            "Complete the full course even if symptoms improve. Follow up in 1 week.",
          dateIssued: "2024-10-25",
          status: "dispensed",
          pharmacyName: "City Health Pharmacy",
          dispensedDate: "2024-10-25",
          dispensedBy: "John Smith, PharmD",
          medications: [
            {
              drugName: "Amoxicillin",
              dosage: "500mg",
              frequency: "3 times daily",
              duration: "7 days",
              instructions: "Take with food to reduce stomach upset",
              quantity: 21,
              dispensed: true,
              dispensedQuantity: 21,
            },
          ],
        },
        {
          id: "2",
          doctorName: "Dr. Michael Chen",
          doctorLicense: "MD-2024-002",
          diagnosis: "Hypertension",
          notes:
            "Monitor blood pressure daily. Return for follow-up in 1 month.",
          dateIssued: "2024-10-26",
          status: "issued",
          medications: [
            {
              drugName: "Lisinopril",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "30 days",
              instructions:
                "Take at the same time each day, preferably in the morning",
              quantity: 30,
              dispensed: false,
            },
            {
              drugName: "Hydrochlorothiazide",
              dosage: "25mg",
              frequency: "Once daily",
              duration: "30 days",
              instructions: "Take with food or milk",
              quantity: 30,
              dispensed: false,
            },
          ],
        },
        {
          id: "3",
          doctorName: "Dr. Emily Rodriguez",
          doctorLicense: "MD-2024-003",
          diagnosis: "Seasonal Allergies",
          notes:
            "Use as needed for allergy symptoms. Avoid alcohol while taking.",
          dateIssued: "2024-10-20",
          status: "expired",
          medications: [
            {
              drugName: "Cetirizine",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "5 days",
              instructions: "Take in the evening to minimize drowsiness",
              quantity: 5,
              dispensed: true,
              dispensedQuantity: 5,
            },
          ],
        },
      ];

      setPrescriptions(mockPrescriptions);
    } catch (error) {
      showError("Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (filter === "all") return true;
    return (
      prescription.status === filter ||
      (filter === "active" && prescription.status === "issued")
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-blue-100 text-blue-800";
      case "dispensed":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "issued":
        return <Clock className="w-4 h-4" />;
      case "dispensed":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const downloadPrescription = (prescription: Prescription) => {
    // Mock download functionality
    showSuccess(`Downloading prescription from ${prescription.doctorName}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Prescriptions
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your medical prescriptions
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                key: "all",
                label: "All Prescriptions",
                count: prescriptions.length,
              },
              {
                key: "active",
                label: "Active",
                count: prescriptions.filter((p) => p.status === "issued")
                  .length,
              },
              {
                key: "dispensed",
                label: "Dispensed",
                count: prescriptions.filter((p) => p.status === "dispensed")
                  .length,
              },
              {
                key: "expired",
                label: "Expired",
                count: prescriptions.filter((p) => p.status === "expired")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Pill className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No prescriptions found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === "all"
                  ? "You don't have any prescriptions yet."
                  : `No ${filter} prescriptions found.`}
              </p>
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {prescription.doctorName}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {getStatusIcon(prescription.status)}
                          <span className="ml-1">
                            {prescription.status.charAt(0).toUpperCase() +
                              prescription.status.slice(1)}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span>{" "}
                            {prescription.diagnosis}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date Issued:</span>{" "}
                            {new Date(
                              prescription.dateIssued
                            ).toLocaleDateString()}
                          </p>
                          {prescription.dispensedDate && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Dispensed:</span>{" "}
                              {new Date(
                                prescription.dispensedDate
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">License:</span>{" "}
                            {prescription.doctorLicense}
                          </p>
                          {prescription.pharmacyName && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Pharmacy:</span>{" "}
                              {prescription.pharmacyName}
                            </p>
                          )}
                          {prescription.dispensedBy && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Dispensed by:</span>{" "}
                              {prescription.dispensedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Medications */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Medications:
                        </h4>
                        <div className="space-y-2">
                          {prescription.medications.map((medication, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Pill className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">
                                    {medication.drugName}
                                  </span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-gray-600">
                                    {medication.dosage}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 ml-6">
                                  {medication.frequency} for{" "}
                                  {medication.duration} • Qty:{" "}
                                  {medication.quantity}
                                </p>
                                {medication.instructions && (
                                  <p className="text-sm text-blue-600 ml-6 italic">
                                    {medication.instructions}
                                  </p>
                                )}
                              </div>
                              {medication.dispensed && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="ml-1 text-xs">
                                    Dispensed
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {prescription.notes && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">
                            Doctor's Notes:
                          </h4>
                          <p className="text-sm text-blue-800">
                            {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => setSelectedPrescription(prescription)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => downloadPrescription(prescription)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Prescription Detail Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Prescription Details
                </h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Doctor Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Doctor Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedPrescription.doctorName}
                    </p>
                    <p>
                      <span className="font-medium">License:</span>{" "}
                      {selectedPrescription.doctorLicense}
                    </p>
                  </div>
                </div>

                {/* Prescription Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Prescription Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <p>
                      <span className="font-medium">Diagnosis:</span>{" "}
                      {selectedPrescription.diagnosis}
                    </p>
                    <p>
                      <span className="font-medium">Date Issued:</span>{" "}
                      {new Date(
                        selectedPrescription.dateIssued
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedPrescription.status
                        )}`}
                      >
                        {selectedPrescription.status.charAt(0).toUpperCase() +
                          selectedPrescription.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Medications
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map(
                      (medication, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-md p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {medication.drugName}
                            </h4>
                            {medication.dispensed && (
                              <span className="text-green-600 text-sm flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Dispensed
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Dosage:</span>{" "}
                              {medication.dosage}
                            </p>
                            <p>
                              <span className="font-medium">Frequency:</span>{" "}
                              {medication.frequency}
                            </p>
                            <p>
                              <span className="font-medium">Duration:</span>{" "}
                              {medication.duration}
                            </p>
                            <p>
                              <span className="font-medium">Quantity:</span>{" "}
                              {medication.quantity}
                            </p>
                          </div>
                          {medication.instructions && (
                            <p className="mt-2 text-sm text-blue-600 italic">
                              <span className="font-medium">Instructions:</span>{" "}
                              {medication.instructions}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Doctor's Notes */}
                {selectedPrescription.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Doctor's Notes
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                      <p className="text-blue-800">
                        {selectedPrescription.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dispensing Information */}
                {selectedPrescription.status === "dispensed" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Dispensing Information
                    </h3>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md space-y-2">
                      <p>
                        <span className="font-medium">Pharmacy:</span>{" "}
                        {selectedPrescription.pharmacyName}
                      </p>
                      <p>
                        <span className="font-medium">Dispensed by:</span>{" "}
                        {selectedPrescription.dispensedBy}
                      </p>
                      <p>
                        <span className="font-medium">Date Dispensed:</span>{" "}
                        {selectedPrescription.dispensedDate &&
                          new Date(
                            selectedPrescription.dispensedDate
                          ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => downloadPrescription(selectedPrescription)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Prescription</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
