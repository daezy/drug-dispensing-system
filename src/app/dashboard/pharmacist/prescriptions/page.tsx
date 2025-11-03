"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pill,
  Eye,
  Package,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError } from "@/lib/utils/toast-helper";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  date: string;
  status: "pending" | "dispensed" | "rejected" | "expired";
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  dispensedDate?: string;
  dispensedBy?: string;
}

export default function PharmacistPrescriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<
    Prescription[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "pharmacist") {
      router.push("/");
      return;
    }
    loadPrescriptions();
  }, [user, router]);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, statusFilter, prescriptions]);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prescriptions/pharmacist");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.prescriptionNumber.toLowerCase().includes(term) ||
          p.patientName.toLowerCase().includes(term) ||
          p.doctorName.toLowerCase().includes(term) ||
          p.medications.some((m) => m.name.toLowerCase().includes(term))
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: Clock,
        label: "Pending",
      },
      dispensed: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
        label: "Dispensed",
      },
      rejected: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
        label: "Rejected",
      },
      expired: {
        color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
        icon: AlertCircle,
        label: "Expired",
      },
    };

    const statusConfig =
      config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const openDetailsModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return prescriptions.length;
    return prescriptions.filter((p) => p.status === status).length;
  };

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Prescriptions" role="pharmacist">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: getStatusCount("all"), color: "blue" },
              {
                label: "Pending",
                value: getStatusCount("pending"),
                color: "yellow",
              },
              {
                label: "Dispensed",
                value: getStatusCount("dispensed"),
                color: "green",
              },
              {
                label: "Rejected",
                value: getStatusCount("rejected"),
                color: "red",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-${stat.color}-500`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by prescription number, patient, doctor, or medication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="dispensed">Dispensed</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prescriptions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Prescriptions Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No prescriptions available at the moment"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {prescription.prescriptionNumber}
                        </h3>
                        {getStatusBadge(prescription.status)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            Patient:{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {prescription.patientName}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            Doctor:{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {prescription.doctorName}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(prescription.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openDetailsModal(prescription)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>

                  {/* Medications Preview */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Medications ({prescription.medications.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prescription.medications
                        .slice(0, 3)
                        .map((med, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs"
                          >
                            {med.name}
                          </span>
                        ))}
                      {prescription.medications.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          +{prescription.medications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {prescription.status === "dispensed" &&
                    prescription.dispensedDate && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                          <Package className="w-4 h-4" />
                          <span>
                            Dispensed on{" "}
                            {new Date(
                              prescription.dispensedDate
                            ).toLocaleDateString()}
                            {prescription.dispensedBy &&
                              ` by ${prescription.dispensedBy}`}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedPrescription.prescriptionNumber}
                    </h2>
                    {getStatusBadge(selectedPrescription.status)}
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Patient
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPrescription.patientName}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Doctor
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPrescription.doctorName}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Prescription Date
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedPrescription.date).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedPrescription.diagnosis && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Diagnosis
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {selectedPrescription.diagnosis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Medications
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map((med, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {med.name}
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Dosage:</span>{" "}
                            {med.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Frequency:</span>{" "}
                            {med.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>{" "}
                            {med.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedPrescription.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Notes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                )}

                {/* Dispensed Info */}
                {selectedPrescription.status === "dispensed" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                      Dispensed Information
                    </h3>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                      {selectedPrescription.dispensedDate && (
                        <p>
                          Date:{" "}
                          {new Date(
                            selectedPrescription.dispensedDate
                          ).toLocaleString()}
                        </p>
                      )}
                      {selectedPrescription.dispensedBy && (
                        <p>By: {selectedPrescription.dispensedBy}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {selectedPrescription.status === "pending" && (
                  <button
                    onClick={() => {
                      router.push(
                        `/dashboard/pharmacist/dispense?prescription=${selectedPrescription.id}`
                      );
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dispense Prescription
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
