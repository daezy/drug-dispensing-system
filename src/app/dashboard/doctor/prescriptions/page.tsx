"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Calendar,
  User,
  Pill,
  Eye,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError } from "@/lib/utils/toast-helper";
import TransactionHash from "@/components/TransactionHash";

interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientId: string;
  diagnosis: string;
  dateIssued: string;
  status: "issued" | "dispensed" | "expired" | "cancelled";
  medications: Medication[];
  notes?: string;
  blockchainHash?: string;
  transactionId?: string;
}

interface Patient {
  id: string;
  patientId?: string; // e.g., "PT-2024-001234"
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

export default function DoctorPrescriptionsListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "issued" | "dispensed" | "expired"
  >("all");
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);

  // Patient search state
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [autoLookupPatient, setAutoLookupPatient] = useState<Patient | null>(
    null
  );
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (!user) {
      // Still loading auth context
      return;
    }

    if (user.role !== "doctor") {
      router.push("/");
      return;
    }

    loadPrescriptions();
    loadPatients();
  }, [user, router]);

  // Filter patients when search term changes
  useEffect(() => {
    if (patientSearchTerm.trim() === "") {
      setFilteredPatients([]);
      return;
    }

    const searchLower = patientSearchTerm.toLowerCase();
    const filtered = patients.filter((patient) => {
      const fullName = `${patient.firstName || ""} ${
        patient.lastName || ""
      }`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        (patient.email || "").toLowerCase().includes(searchLower) ||
        (patient.phone && patient.phone.includes(patientSearchTerm)) ||
        (patient.patientId &&
          patient.patientId.toLowerCase().includes(searchLower))
      );
    });
    setFilteredPatients(filtered);
  }, [patientSearchTerm, patients]);

  // Auto-lookup patient by ID as user types
  useEffect(() => {
    const trimmedId = patientIdInput.trim();

    // Only lookup if we have at least 3 characters to avoid too many lookups
    if (trimmedId.length < 3) {
      setAutoLookupPatient(null);
      return;
    }

    // Debounce the lookup
    const timeoutId = setTimeout(() => {
      setIsLookingUp(true);
      const found = patients.find(
        (p) =>
          p.patientId && p.patientId.toLowerCase() === trimmedId.toLowerCase()
      );

      if (found) {
        setAutoLookupPatient(found);
      } else {
        setAutoLookupPatient(null);
      }
      setIsLookingUp(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [patientIdInput, patients]);

  const loadPrescriptions = async () => {
    setIsLoading(true);

    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem("auth_token");

      if (!token) {
        showError("Please log in again");
        router.push("/");
        return;
      }

      // Fetch prescriptions from API
      const response = await fetch("/api/prescriptions/doctor", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        if (response.status === 401) {
          showError("Session expired. Please log in again.");
          localStorage.removeItem("auth_token");
          router.push("/");
        } else {
          showError("Failed to load prescriptions");
        }
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
      showError("Failed to load prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem("auth_token");

      if (!token) {
        showError("Please log in again");
        router.push("/");
        return;
      }

      const response = await fetch("/api/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        if (response.status === 401) {
          showError("Session expired. Please log in again.");
          localStorage.removeItem("auth_token");
          router.push("/");
        } else {
          showError("Failed to load patients");
        }
      }
    } catch (error) {
      console.error("Error loading patients:", error);
      showError("Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    // Navigate to create prescription page with patient pre-selected
    const patientName = `${patient.firstName} ${patient.lastName}`;
    router.push(
      `/doctor/prescriptions?patientId=${
        patient.id
      }&patientName=${encodeURIComponent(
        patientName
      )}&patientEmail=${encodeURIComponent(patient.email)}`
    );
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      (prescription.patientName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (prescription.prescriptionNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (prescription.diagnosis || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-blue-100 text-blue-800";
      case "dispensed":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
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
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DashboardLayout title="Prescriptions History" role="doctor">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Prescriptions Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Search for patients and manage prescriptions
              </p>
            </div>
          </div>

          {/* Patient Search Card - Prominent Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Find Patient
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Search for a patient to create a new prescription
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPatientSearch(!showPatientSearch)}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-gray-700 transition-all border border-green-200 dark:border-green-800"
              >
                {showPatientSearch ? "Hide Search" : "Show Search"}
              </button>
            </div>

            {showPatientSearch && (
              <div className="space-y-4">
                {/* Patient ID Quick Lookup */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Quick Lookup by Patient ID
                    </h4>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Patient ID (e.g., PT-2024-001234)"
                      value={patientIdInput}
                      onChange={(e) =>
                        setPatientIdInput(e.target.value.toUpperCase())
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-lg font-mono"
                    />
                    {isLookingUp && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Auto-lookup result */}
                  {autoLookupPatient && (
                    <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {autoLookupPatient.firstName}{" "}
                              {autoLookupPatient.lastName}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                {autoLookupPatient.patientId}
                              </span>
                              <span>•</span>
                              <span>{autoLookupPatient.email}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePatientSelect(autoLookupPatient)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold"
                        >
                          Create Prescription
                        </button>
                      </div>
                    </div>
                  )}

                  {patientIdInput.length >= 3 &&
                    !autoLookupPatient &&
                    !isLookingUp && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                          No patient found with ID:{" "}
                          <span className="font-mono font-semibold">
                            {patientIdInput}
                          </span>
                        </p>
                      </div>
                    )}
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-gray-500 dark:text-gray-400 font-medium">
                      OR SEARCH BY NAME
                    </span>
                  </div>
                </div>

                {/* Name/Email Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name, email, phone, or ID..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-lg"
                  />
                </div>

                {loadingPatients ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : patientSearchTerm && filteredPatients.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full p-4 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                              <User
                                className="text-green-600 dark:text-green-400"
                                size={20}
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {patient.firstName} {patient.lastName}
                                </p>
                                {patient.patientId && (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-mono font-semibold rounded">
                                    {patient.patientId}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                                <span>{patient.email}</span>
                                {patient.phone && (
                                  <span>• {patient.phone}</span>
                                )}
                                {patient.dateOfBirth && (
                                  <span>
                                    • Age{" "}
                                    {new Date().getFullYear() -
                                      new Date(
                                        patient.dateOfBirth
                                      ).getFullYear()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 font-medium">
                            <span className="text-sm">Create Prescription</span>
                            <FileText size={18} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : patientSearchTerm && filteredPatients.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No patients found matching "{patientSearchTerm}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Start typing to search for patients
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {patients.length} patients available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                Recent Prescriptions
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by patient name, prescription number, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("issued")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    statusFilter === "issued"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Issued
                </button>
                <button
                  onClick={() => setStatusFilter("dispensed")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    statusFilter === "dispensed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Dispensed
                </button>
                <button
                  onClick={() => setStatusFilter("expired")}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    statusFilter === "expired"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Expired
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No prescriptions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== "all"
                  ? "No prescriptions match your search criteria"
                  : "You haven't issued any prescriptions yet"}
              </p>
              <button
                onClick={() => setShowPatientSearch(true)}
                className="mt-4 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                Create Your First Prescription
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-300 dark:hover:border-green-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                        {prescription.blockchainHash && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            Blockchain Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{prescription.patientName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(
                              prescription.dateIssued
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{prescription.diagnosis}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>

                  {/* Medications Summary */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Medications ({prescription.medications?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(prescription.medications || []).map((med, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
                        >
                          <Pill className="w-3 h-3" />
                          {med.drugName} {med.dosage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription Details Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Prescription Details
                  </h3>
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Prescription Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Prescription Number
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPrescription.prescriptionNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Patient
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPrescription.patientName}
                      </p>
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

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Diagnosis
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPrescription.diagnosis}
                    </p>
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

                  {/* Blockchain Verification */}
                  {selectedPrescription.blockchainHash && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Blockchain Verified
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        This prescription has been recorded on the blockchain
                        for security and traceability.
                      </p>
                      <TransactionHash
                        txHash={selectedPrescription.blockchainHash}
                        label="Prescription Hash"
                        showCopy={true}
                        showExplorer={false}
                      />
                      {selectedPrescription.transactionId && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Transaction ID:</span>{" "}
                          <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                            {selectedPrescription.transactionId}
                          </code>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Medications
                    </h4>
                    <div className="space-y-3">
                      {(selectedPrescription.medications || []).map(
                        (med, index) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2 bg-gray-50 dark:bg-gray-700"
                          >
                            <h5 className="font-medium text-lg text-gray-900 dark:text-white">
                              {med.drugName}
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Dosage:
                                </span>{" "}
                                {med.dosage}
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Frequency:
                                </span>{" "}
                                {med.frequency}
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Duration:
                                </span>{" "}
                                {med.duration}
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Quantity:
                                </span>{" "}
                                {med.quantity}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="px-6 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
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
