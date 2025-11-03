"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  Calendar,
  Activity,
  Heart,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Star,
  MapPin,
  FileText,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

interface DashboardStats {
  activePrescriptions: number;
  upcomingAppointments: number;
  completedOrders: number;
  healthScore: number;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  date: string;
  status: "active" | "completed" | "pending";
  refillsLeft: number;
  instructions: string;
}

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "check-up";
  status: "upcoming" | "completed" | "cancelled";
  location: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    activePrescriptions: 0,
    upcomingAppointments: 0,
    completedOrders: 0,
    healthScore: 0,
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "upcoming":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout title="Patient Dashboard" role="patient">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Hello, {user?.firstName}!
                </h2>
                <p className="text-blue-100">
                  Here's your health overview for today
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Heart size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Prescriptions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activePrescriptions}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Pill size={12} className="mr-1" />
                    All up to date
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Pill className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Upcoming Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.upcomingAppointments}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <Calendar size={12} className="mr-1" />
                    Next: Jan 18
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completed Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedOrders}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <CheckCircle size={12} className="mr-1" />
                    This month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Health Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getHealthScoreColor(
                      stats.healthScore
                    )}`}
                  >
                    {stats.healthScore}%
                  </p>
                  <p
                    className={`text-xs flex items-center mt-1 ${getHealthScoreColor(
                      stats.healthScore
                    )}`}
                  >
                    <Activity size={12} className="mr-1" />
                    {getHealthScoreText(stats.healthScore)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Prescriptions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Prescriptions
                  </h3>
                  <button
                    onClick={() => router.push("/patient/prescriptions")}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {prescription.medication}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {prescription.dosage} • {prescription.frequency}
                          </p>
                          <p className="text-xs text-gray-500">
                            Prescribed by {prescription.prescribedBy}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {prescription.status}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Instructions:
                        </p>
                        <p className="text-xs text-gray-700">
                          {prescription.instructions}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500">
                            Refills left:{" "}
                            <span className="font-medium">
                              {prescription.refillsLeft}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            Date: {prescription.date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <Eye size={14} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upcoming Appointments
                  </h3>
                  <button className="text-primary hover:text-primary-dark text-sm font-medium">
                    Schedule New
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.doctor}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {appointment.specialty}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={12} className="mr-1" />
                              {appointment.date}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock size={12} className="mr-1" />
                              {appointment.time}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <MapPin size={12} className="mr-1" />
                        {appointment.location}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 capitalize">
                          Type: {appointment.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                            Reschedule
                          </button>
                          <button className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Health Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Health Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Medication Adherence
                </h4>
                <p className="text-2xl font-bold text-green-600 mb-1">95%</p>
                <p className="text-xs text-gray-600">Great job! Keep it up</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="text-blue-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Health Tracking
                </h4>
                <p className="text-2xl font-bold text-blue-600 mb-1">12</p>
                <p className="text-xs text-gray-600">Days streak</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="text-purple-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Doctor Rating
                </h4>
                <p className="text-2xl font-bold text-purple-600 mb-1">4.8</p>
                <p className="text-xs text-gray-600">Average rating</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/patient/prescriptions")}
                className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-500">
                  <Pill
                    className="text-green-600 group-hover:text-white"
                    size={24}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  View Prescriptions
                </p>
              </button>

              <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white">
                  <Calendar
                    className="text-blue-600 group-hover:text-white"
                    size={24}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Book Appointment
                </p>
              </button>

              <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white">
                  <Activity
                    className="text-purple-600 group-hover:text-white"
                    size={24}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Health Records
                </p>
              </button>

              <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white">
                  <Heart
                    className="text-red-600 group-hover:text-white"
                    size={24}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Emergency Contact
                </p>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
