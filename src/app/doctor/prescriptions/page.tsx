"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  Pill,
  User,
  Calendar,
  Clock,
  FileText,
  Search,
  Plus,
  Save,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { showSuccess, showError, API_MESSAGES } from "@/lib/utils/toast-helper";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  medications: Medication[];
  diagnosis: string;
  notes: string;
  dateIssued: string;
  status: "draft" | "issued" | "dispensed";
}

interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

interface Patient {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  phone?: string;
  email: string;
  patientId?: string;
}

export default function DoctorPrescriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  // Helper function to get patient full name
  const getPatientName = (patient: Patient): string => {
    if (patient.name) return patient.name;
    return (
      `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
      "Unknown Patient"
    );
  };
  const [recentPrescriptions, setRecentPrescriptions] = useState<
    Prescription[]
  >([]);

  // New prescription form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    {
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 0,
    },
  ]);

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      router.push("/");
      return;
    }
    loadData();
  }, [user, router]);

  // Check for pre-selected patient from URL params
  useEffect(() => {
    if (!searchParams) return;
    
    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName");
    const patientEmail = searchParams.get("patientEmail");

    if (patientId && patientName && patients.length > 0) {
      // Find the patient in the loaded patients list
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setShowNewPrescription(true);
      } else {
        // Create a temporary patient object if not found in list
        const nameParts = patientName.split(" ");
        setSelectedPatient({
          id: patientId,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: patientEmail || "",
        });
        setShowNewPrescription(true);
      }
    }
  }, [searchParams, patients]);

  const loadData = async () => {
    try {
      // Fetch patients from API
      const patientsResponse = await fetch("/api/patients");
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData.patients || []);
      }

      // Fetch recent prescriptions from API
      const prescriptionsResponse = await fetch("/api/prescriptions/recent");
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        setRecentPrescriptions(prescriptionsData.prescriptions || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        drugName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        quantity: 0,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string | number
  ) => {
    const updatedMedications = medications.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updatedMedications);
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      showError("Please select a patient");
      return;
    }

    if (!diagnosis.trim()) {
      showError("Please enter a diagnosis");
      return;
    }

    if (
      medications.some((med) => !med.drugName || !med.dosage || !med.frequency)
    ) {
      showError("Please fill in all medication details");
      return;
    }

    setIsLoading(true);

    try {
      // Here you would make an API call to save the prescription
      const prescriptionData = {
        patientId: selectedPatient.id,
        patientName: getPatientName(selectedPatient),
        medications,
        diagnosis,
        notes,
        dateIssued: new Date().toISOString().split("T")[0],
        status: "issued",
      };

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showSuccess("Prescription created successfully!");

      // Reset form
      setSelectedPatient(null);
      setDiagnosis("");
      setNotes("");
      setMedications([
        {
          drugName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: 0,
        },
      ]);
      setShowNewPrescription(false);

      // Reload data
      loadData();
    } catch (error) {
      showError("Failed to create prescription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const fullName = getPatientName(patient);
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <DashboardLayout title="Prescriptions" role="doctor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Prescription Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage patient prescriptions
            </p>
          </div>
          <button
            onClick={() => setShowNewPrescription(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Prescription</span>
          </button>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Prescriptions
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPrescriptions.map((prescription) => (
              <div key={prescription.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {prescription.patientName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {prescription.diagnosis}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {prescription.dateIssued}
                      </span>
                      <span className="flex items-center">
                        <Pill className="w-3 h-3 mr-1" />
                        {prescription.medications.length} medication(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        prescription.status === "issued"
                          ? "bg-green-100 text-green-800"
                          : prescription.status === "dispensed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {prescription.status.charAt(0).toUpperCase() +
                        prescription.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Prescription Modal */}
        {showNewPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Prescription
                </h2>
                <button
                  onClick={() => setShowNewPrescription(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleSubmitPrescription}
                className="p-6 space-y-6"
              >
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setSearchTerm("");
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getPatientName(patient)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {patient.email} • Age: {patient.age || "N/A"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedPatient && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            {getPatientName(selectedPatient)}
                          </div>
                          <div className="text-xs text-blue-700">
                            Age: {selectedPatient.age || "N/A"} •{" "}
                            {selectedPatient.email}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="form-input"
                    placeholder="Enter diagnosis"
                    required
                  />
                </div>

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Medications *
                    </label>
                    <button
                      type="button"
                      onClick={addMedication}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Medication</span>
                    </button>
                  </div>

                  {medications.map((medication, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Medication {index + 1}
                        </h4>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Drug Name *
                          </label>
                          <input
                            type="text"
                            value={medication.drugName}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "drugName",
                                e.target.value
                              )
                            }
                            className="form-input"
                            placeholder="e.g., Amoxicillin"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosage *
                          </label>
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(e) =>
                              updateMedication(index, "dosage", e.target.value)
                            }
                            className="form-input"
                            placeholder="e.g., 500mg"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency *
                          </label>
                          <select
                            value={medication.frequency}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "frequency",
                                e.target.value
                              )
                            }
                            className="form-input"
                            required
                          >
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="3 times daily">3 times daily</option>
                            <option value="4 times daily">4 times daily</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "duration",
                                e.target.value
                              )
                            }
                            className="form-input"
                            placeholder="e.g., 7 days"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={medication.quantity}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="form-input"
                            placeholder="Number of units"
                            min="0"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={medication.instructions}
                            onChange={(e) =>
                              updateMedication(
                                index,
                                "instructions",
                                e.target.value
                              )
                            }
                            className="form-input"
                            placeholder="e.g., Take with food"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Any additional instructions or notes..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowNewPrescription(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create Prescription</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
