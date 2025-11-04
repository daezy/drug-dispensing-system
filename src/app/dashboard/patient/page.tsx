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
  Copy,
  Check,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showSuccess } from "@/lib/utils/toast-helper";

interface DashboardStats {
  activePrescriptions: number;
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

export default function PatientDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    activePrescriptions: 0,
    completedOrders: 0,
    healthScore: 0,
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [copiedPatientId, setCopiedPatientId] = useState(false);

  const { user } = useAuth();

  const copyPatientId = async () => {
    if (user?.patientId) {
      try {
        await navigator.clipboard.writeText(user.patientId);
        setCopiedPatientId(true);
        showSuccess("Patient ID copied to clipboard!");
        setTimeout(() => setCopiedPatientId(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

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
          {/* Welcome Section with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Active Patient
                    </div>
                    {user?.patientId && (
                      <button
                        onClick={copyPatientId}
                        className="inline-flex items-center px-3 py-1 bg-white bg-opacity-30 backdrop-blur-sm rounded-full text-sm font-mono font-semibold hover:bg-opacity-40 transition-all group cursor-pointer"
                        title="Click to copy Patient ID"
                      >
                        <FileText className="mr-2" size={14} />
                        {user.patientId}
                        {copiedPatientId ? (
                          <Check className="ml-2 text-green-300" size={14} />
                        ) : (
                          <Copy className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                        )}
                      </button>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, {user?.firstName || "Patient"}!
                  </h1>
                  <p className="text-blue-100 text-lg mb-6">
                    Your health journey at a glance
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() =>
                        router.push("/dashboard/patient/prescriptions")
                      }
                      className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      <Pill className="inline-block mr-2" size={18} />
                      My Prescriptions
                    </button>
                    <button
                      onClick={() => router.push("/dashboard/patient/doctors")}
                      className="px-6 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-opacity-30 transition-all"
                    >
                      <FileText className="inline-block mr-2" size={18} />
                      View Doctors
                    </button>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center w-32 h-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl">
                  <Heart size={64} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Compact & Modern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Pill className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active Prescriptions
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.activePrescriptions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <CheckCircle size={12} className="mr-1" />
                All medications current
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  This Month
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Completed Orders
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.completedOrders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Activity size={12} className="mr-1" />
                +2 from last month
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="text-white" size={24} />
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    stats.healthScore >= 80
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : stats.healthScore >= 60
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                      : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}
                >
                  {getHealthScoreText(stats.healthScore)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Health Score
              </h3>
              <p
                className={`text-3xl font-bold mb-1 ${getHealthScoreColor(
                  stats.healthScore
                )}`}
              >
                {stats.healthScore}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Star size={12} className="mr-1" />
                Based on adherence & checkups
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Prescriptions - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Active Prescriptions
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Manage your current medications
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push("/dashboard/patient/prescriptions")
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pill className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Active Prescriptions
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      You don't have any active prescriptions at the moment
                    </p>
                    <button
                      onClick={() => router.push("/dashboard/patient/doctors")}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Find a Doctor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.slice(0, 3).map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                {prescription.medication}
                              </h4>
                              <span
                                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                                  prescription.status
                                )}`}
                              >
                                {prescription.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {prescription.dosage} • {prescription.frequency}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Prescribed by {prescription.prescribedBy}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                            Instructions:
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-300">
                            {prescription.instructions}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {prescription.refillsLeft}
                              </span>{" "}
                              refills left
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {prescription.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      router.push("/dashboard/patient/prescriptions")
                    }
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Pill size={20} />
                    </div>
                    <span className="font-semibold">
                      View All Prescriptions
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/patient/doctors")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText
                        className="text-blue-600 dark:text-blue-400"
                        size={20}
                      />
                    </div>
                    <span className="font-semibold">My Doctors</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/patient/history")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Activity
                        className="text-green-600 dark:text-green-400"
                        size={20}
                      />
                    </div>
                    <span className="font-semibold">Medical History</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/patient/profile")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <Heart
                        className="text-red-600 dark:text-red-400"
                        size={20}
                      />
                    </div>
                    <span className="font-semibold">My Profile</span>
                  </button>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Medication Adherence
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Last 30 days
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    95%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Excellent! Keep up the great work
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Health Insights Bottom */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Health Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Activity className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Health Tracking
                </h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  12 Days
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current streak
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Doctor Rating
                </h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  4.8
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average satisfaction
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertCircle className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Upcoming Refills
                </h4>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  2
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
