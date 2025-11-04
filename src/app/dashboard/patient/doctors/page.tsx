"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  FileText,
  Search,
  Star,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError } from "@/lib/utils/toast-helper";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  address?: string;
  city?: string;
  state?: string;
  experience?: number;
  rating?: number;
  totalPrescriptions?: number;
  lastAppointment?: string;
  nextAppointment?: string;
}

export default function PatientDoctorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (!user || user.role !== "patient") {
      router.push("/");
      return;
    }
    loadDoctors();
  }, [user, router]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showError("Please log in again");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/patients/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        showError("Failed to load doctors");
      }
    } catch (error) {
      showError("Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout title="My Doctors" role="patient">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Doctors</h2>
              <p className="text-gray-600 mt-1">
                View doctors you've consulted with
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No doctors found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "No doctors match your search"
                  : "You haven't consulted with any doctors yet"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {doctor.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                    {doctor.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {doctor.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{doctor.phone}</span>
                    </div>
                    {doctor.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {doctor.city}, {doctor.state}
                        </span>
                      </div>
                    )}
                    {doctor.totalPrescriptions !== undefined && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{doctor.totalPrescriptions} Prescriptions</span>
                      </div>
                    )}
                    {doctor.lastAppointment && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Last visit:{" "}
                          {new Date(
                            doctor.lastAppointment
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Details Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Doctor Details
                  </h3>
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Doctor Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedDoctor.name}
                      </h4>
                      <p className="text-gray-600">
                        {selectedDoctor.specialization}
                      </p>
                      {selectedDoctor.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-medium">
                            {selectedDoctor.rating.toFixed(1)} Rating
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">License Number</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">
                          {selectedDoctor.licenseNumber}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{selectedDoctor.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{selectedDoctor.phone}</p>
                      </div>
                    </div>
                    {selectedDoctor.experience && (
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-medium mt-1">
                          {selectedDoctor.experience} years
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {selectedDoctor.address && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Location
                      </h4>
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p>{selectedDoctor.address}</p>
                          <p>
                            {selectedDoctor.city}, {selectedDoctor.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDoctor.totalPrescriptions !== undefined && (
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedDoctor.totalPrescriptions}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Prescriptions
                        </p>
                      </div>
                    )}
                    {selectedDoctor.lastAppointment && (
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-sm font-bold text-green-600">
                          {new Date(
                            selectedDoctor.lastAppointment
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Last Visit</p>
                      </div>
                    )}
                    {selectedDoctor.nextAppointment && (
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-sm font-bold text-purple-600">
                          {new Date(
                            selectedDoctor.nextAppointment
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Next Visit</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      router.push("/dashboard/patient/prescriptions");
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Prescriptions
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
