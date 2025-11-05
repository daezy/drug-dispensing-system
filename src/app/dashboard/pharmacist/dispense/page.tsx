"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Pill,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  Scan,
  FileText,
  Stethoscope,
  Filter,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { showSuccess, showError, showWarning } from "@/lib/utils/toast-helper";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

interface PendingPrescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientPhone: string;
  doctorName: string;
  doctorLicense: string;
  diagnosis: string;
  dateIssued: string;
  medications: Medication[];
  notes: string;
  status: "pending" | "dispensing" | "dispensed" | "rejected";
  priority: "normal" | "urgent";
}

interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantityPrescribed: number;
  quantityAvailable: number;
  quantityToDispense: number;
  substitution?: {
    drugName: string;
    reason: string;
    approved: boolean;
  };
  verified: boolean;
}

export default function PharmacistDispensePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<PendingPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<PendingPrescription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "urgent" | "dispensing"
  >("all");
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispensingNotes, setDispensingNotes] = useState("");

  useEffect(() => {
    if (!user || user.role !== "pharmacist") {
      router.push("/");
      return;
    }
    loadPendingPrescriptions();
  }, [user, router]);

  // Handle prescription query parameter
  useEffect(() => {
    if (!searchParams) return;

    const prescriptionId = searchParams.get("prescription");
    if (prescriptionId && prescriptions.length > 0) {
      // Find and auto-open the prescription
      const prescription = prescriptions.find((p) => p.id === prescriptionId);
      if (prescription) {
        setSelectedPrescription(prescription);
        setShowDispenseModal(true);
        // Update status to dispensing
        setPrescriptions((prev) =>
          prev.map((p) =>
            p.id === prescriptionId ? { ...p, status: "dispensing" } : p
          )
        );
      } else {
        showWarning(`Prescription ${prescriptionId} not found`);
      }
    }
  }, [searchParams, prescriptions]);

  const loadPendingPrescriptions = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showError("Please log in again");
        router.push("/login");
        return;
      }

      // Fetch pending prescriptions from API
      const response = await fetch(
        "/api/prescriptions/pharmacist?status=verified",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Map the prescriptions to the expected format
        const formattedPrescriptions = (data.prescriptions || []).map(
          (p: any) => ({
            id: p.id,
            prescriptionNumber: p.prescriptionNumber,
            patientName: p.patient?.name || "Unknown",
            patientId: p.patient?.id || "N/A",
            patientAge: p.patient?.dateOfBirth
              ? new Date().getFullYear() -
                new Date(p.patient.dateOfBirth).getFullYear()
              : 0,
            patientPhone: p.patient?.phone || "N/A",
            doctorName: p.doctor?.name || "Unknown",
            doctorLicense: p.doctor?.licenseNumber || "N/A",
            diagnosis: p.instructions || "No diagnosis provided",
            dateIssued: p.dateIssued,
            medications: [
              {
                id: p.id + "-med-1",
                drugName: p.medication,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration,
                instructions: p.instructions || "",
                quantityPrescribed: p.quantity,
                quantityAvailable: p.quantity, // Assume available for now
                quantityToDispense: p.quantity,
                verified: false,
              },
            ],
            notes: p.notes || "",
            status: p.status === "verified" ? "pending" : p.status,
            priority: "normal" as const,
          })
        );
        setPrescriptions(formattedPrescriptions);
      } else {
        showError("Failed to load pending prescriptions");
      }
    } catch (error) {
      console.error("Failed to load pending prescriptions:", error);
      showError("Failed to load pending prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      prescription.status === filter ||
      (filter === "urgent" && prescription.priority === "urgent");

    return matchesSearch && matchesFilter;
  });

  const handleVerifyMedication = (
    prescriptionId: string,
    medicationId: string
  ) => {
    setPrescriptions((prev) =>
      prev.map((prescription) =>
        prescription.id === prescriptionId
          ? {
              ...prescription,
              medications: prescription.medications.map((med) =>
                med.id === medicationId ? { ...med, verified: true } : med
              ),
            }
          : prescription
      )
    );

    // Update selected prescription if it's open
    if (selectedPrescription?.id === prescriptionId) {
      setSelectedPrescription((prev) =>
        prev
          ? {
              ...prev,
              medications: prev.medications.map((med) =>
                med.id === medicationId ? { ...med, verified: true } : med
              ),
            }
          : null
      );
    }

    showSuccess("Medication verified successfully");
  };

  const handleUpdateQuantity = (
    prescriptionId: string,
    medicationId: string,
    quantity: number
  ) => {
    setPrescriptions((prev) =>
      prev.map((prescription) =>
        prescription.id === prescriptionId
          ? {
              ...prescription,
              medications: prescription.medications.map((med) =>
                med.id === medicationId
                  ? {
                      ...med,
                      quantityToDispense: Math.min(
                        quantity,
                        med.quantityAvailable
                      ),
                    }
                  : med
              ),
            }
          : prescription
      )
    );
  };

  const handleStartDispensing = (prescription: PendingPrescription) => {
    setSelectedPrescription(prescription);
    setShowDispenseModal(true);

    // Update status to dispensing
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescription.id ? { ...p, status: "dispensing" } : p
      )
    );
  };

  const handleCompleteDispensing = async () => {
    if (!selectedPrescription) return;

    try {
      // Validate all medications are verified
      const unverifiedMeds = selectedPrescription.medications.filter(
        (med) => !med.verified
      );
      if (unverifiedMeds.length > 0) {
        showError("Please verify all medications before dispensing");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        showError("Please log in again");
        router.push("/login");
        return;
      }

      // Calculate total quantity to dispense
      const totalQuantity = selectedPrescription.medications.reduce(
        (sum, med) => sum + med.quantityToDispense,
        0
      );

      // Call the dispense API
      const response = await fetch("/api/prescriptions/dispense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prescriptionId: selectedPrescription.id,
          quantityDispensed: totalQuantity,
          notes:
            dispensingNotes ||
            `Dispensed ${selectedPrescription.prescriptionNumber}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showError(error.error || "Failed to dispense prescription");
        return;
      }

      const data = await response.json();

      // Update prescription status locally
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.id === selectedPrescription.id ? { ...p, status: "dispensed" } : p
        )
      );

      showSuccess(
        `Prescription ${selectedPrescription.prescriptionNumber} dispensed successfully`
      );

      // Show low stock alert if present
      if (data.data?.lowStockAlert) {
        showWarning(
          `Low stock alert: ${data.data.lowStockAlert.drug} - ${data.data.lowStockAlert.currentStock} units remaining`
        );
      }

      setShowDispenseModal(false);
      setSelectedPrescription(null);
      setDispensingNotes("");

      // Reload prescriptions to get updated list
      await loadPendingPrescriptions();

      // If opened via query param, go back to prescriptions list
      if (searchParams?.get("prescription")) {
        router.push("/dashboard/pharmacist/dispense");
      }
    } catch (error) {
      console.error("Failed to complete dispensing:", error);
      showError("Failed to complete dispensing");
    }
  };

  const handleRejectPrescription = (
    prescription: PendingPrescription,
    reason: string
  ) => {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id === prescription.id ? { ...p, status: "rejected" } : p
      )
    );
    showWarning(
      `Prescription ${prescription.prescriptionNumber} rejected: ${reason}`
    );
  };

  const getPriorityColor = (priority: string) => {
    return priority === "urgent"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "dispensing":
        return "bg-blue-100 text-blue-800";
      case "dispensed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Prescription Dispensing" role="pharmacist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Prescription Dispensing" role="pharmacist">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Prescription Dispensing
            </h1>
            <p className="text-gray-600 mt-1">
              Review and dispense pending prescriptions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {
                filteredPrescriptions.filter((p) => p.status === "pending")
                  .length
              }{" "}
              pending prescriptions
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, prescription number, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="urgent">Urgent</option>
              <option value="dispensing">Dispensing</option>
            </select>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No prescriptions found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === "all"
                  ? "No prescriptions available for dispensing."
                  : `No ${filter} prescriptions found.`}
              </p>
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                  prescription.priority === "urgent"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {prescription.prescriptionNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {prescription.status.charAt(0).toUpperCase() +
                            prescription.status.slice(1)}
                        </span>
                        {prescription.priority === "urgent" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span className="font-medium">Patient:</span>
                            <span className="ml-1">
                              {prescription.patientName} (
                              {prescription.patientAge}y)
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span>{" "}
                            {prescription.patientPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Stethoscope className="w-4 h-4 mr-1" />
                            <span className="font-medium">Doctor:</span>
                            <span className="ml-1">
                              {prescription.doctorName}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">License:</span>{" "}
                            {prescription.doctorLicense}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span className="font-medium">Issued:</span>
                            <span className="ml-1">
                              {new Date(
                                prescription.dateIssued
                              ).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span>{" "}
                            {prescription.diagnosis}
                          </p>
                        </div>
                      </div>

                      {/* Medications */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Medications:
                        </h4>
                        <div className="space-y-2">
                          {prescription.medications.map((medication) => (
                            <div
                              key={medication.id}
                              className={`p-3 rounded-md border ${
                                medication.verified
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
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
                                    {medication.duration}
                                  </p>
                                  <div className="flex items-center space-x-4 ml-6 mt-1">
                                    <span className="text-sm text-gray-600">
                                      Prescribed:{" "}
                                      {medication.quantityPrescribed}
                                    </span>
                                    <span
                                      className={`text-sm ${
                                        medication.quantityAvailable >=
                                        medication.quantityPrescribed
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      Available: {medication.quantityAvailable}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        Dispense:
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        max={medication.quantityAvailable}
                                        value={medication.quantityToDispense}
                                        onChange={(e) =>
                                          handleUpdateQuantity(
                                            prescription.id,
                                            medication.id,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                      />
                                    </div>
                                  </div>
                                  {medication.instructions && (
                                    <p className="text-sm text-blue-600 ml-6 italic">
                                      {medication.instructions}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {medication.verified ? (
                                    <span className="flex items-center text-green-600 text-sm">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Verified
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleVerifyMedication(
                                          prescription.id,
                                          medication.id
                                        )
                                      }
                                      className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                    >
                                      <Scan className="w-4 h-4" />
                                      <span>Verify</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {prescription.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <h4 className="text-sm font-medium text-yellow-900 mb-1">
                            Notes:
                          </h4>
                          <p className="text-sm text-yellow-800">
                            {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {prescription.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStartDispensing(prescription)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            <span>Start Dispensing</span>
                          </button>
                          <button
                            onClick={() =>
                              handleRejectPrescription(
                                prescription,
                                "Unable to fulfill"
                              )
                            }
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {prescription.status === "dispensing" && (
                        <button
                          onClick={() => handleStartDispensing(prescription)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dispensing Modal */}
        {showDispenseModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Complete Dispensing -{" "}
                  {selectedPrescription.prescriptionNumber}
                </h2>
                <button
                  onClick={() => {
                    setShowDispenseModal(false);
                    setSelectedPrescription(null);
                    // Reset status if it was set to dispensing
                    if (selectedPrescription.status === "dispensing") {
                      setPrescriptions((prev) =>
                        prev.map((p) =>
                          p.id === selectedPrescription.id
                            ? { ...p, status: "pending" }
                            : p
                        )
                      );
                    }
                  }}
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
                {/* Patient Info */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedPrescription.patientName}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span>{" "}
                      {selectedPrescription.patientAge}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedPrescription.patientPhone}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span>{" "}
                      {selectedPrescription.patientId}
                    </p>
                  </div>
                </div>

                {/* Medication Verification */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Medication Verification
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map((medication) => (
                      <div
                        key={medication.id}
                        className="border border-gray-200 rounded-md p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {medication.drugName} {medication.dosage}
                          </h4>
                          <span
                            className={`flex items-center text-sm ${
                              medication.verified
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {medication.verified ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Not Verified
                              </>
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <p>Prescribed: {medication.quantityPrescribed}</p>
                          <p>Available: {medication.quantityAvailable}</p>
                          <p>Dispensing: {medication.quantityToDispense}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {medication.instructions}
                        </p>
                        {!medication.verified && (
                          <button
                            onClick={() =>
                              handleVerifyMedication(
                                selectedPrescription.id,
                                medication.id
                              )
                            }
                            className="mt-2 flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                          >
                            <Scan className="w-4 h-4" />
                            <span>Verify Medication</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispensing Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispensing Notes (Optional)
                  </label>
                  <textarea
                    value={dispensingNotes}
                    onChange={(e) => setDispensingNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about the dispensing process..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDispenseModal(false);
                    setSelectedPrescription(null);
                    // Reset status if it was set to dispensing
                    if (selectedPrescription.status === "dispensing") {
                      setPrescriptions((prev) =>
                        prev.map((p) =>
                          p.id === selectedPrescription.id
                            ? { ...p, status: "pending" }
                            : p
                        )
                      );
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteDispensing}
                  className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Dispensing</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
