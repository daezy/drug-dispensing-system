"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Pill,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  FileText,
  Stethoscope,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import BlockchainStatus from "@/components/BlockchainStatus";

interface DashboardStats {
  totalPatients: number;
  activePrescriptions: number;
  pendingApprovals: number;
  todayAppointments: number;
  blockchainVerified: number;
}

interface RecentActivity {
  id: string;
  type: "prescription" | "appointment" | "approval";
  patient: string;
  description: string;
  time: string;
  status: "pending" | "completed" | "urgent";
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
  status: "active" | "inactive";
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePrescriptions: 0,
    pendingApprovals: 0,
    todayAppointments: 0,
    blockchainVerified: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === "doctor") {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return;
      }

      // Fetch patients count
      const patientsResponse = await fetch("/api/doctors/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        const patientsList = patientsData.patients || [];

        setStats((prev) => ({
          ...prev,
          totalPatients: patientsList.length,
        }));

        // Set recent patients (first 5)
        setRecentPatients(
          patientsList.slice(0, 5).map((p: any) => ({
            id: p.id,
            name: p.name,
            age: p.age || 0,
            gender: "N/A",
            lastVisit: "N/A",
            condition: "N/A",
            status: "active",
          }))
        );
      }

      // Fetch prescriptions count
      const prescriptionsResponse = await fetch("/api/prescriptions/doctor", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        const prescriptionsList = prescriptionsData.prescriptions || [];

        // Count active (non-dispensed) prescriptions
        const activePrescriptions = prescriptionsList.filter(
          (p: any) => p.status !== "dispensed" && p.status !== "expired"
        ).length;

        // Count blockchain verified prescriptions
        const blockchainVerified = prescriptionsList.filter(
          (p: any) => p.blockchainHash || p.transactionId
        ).length;

        setStats((prev) => ({
          ...prev,
          activePrescriptions,
          blockchainVerified,
        }));
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "prescription":
        return Pill;
      case "appointment":
        return Calendar;
      case "approval":
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (status: RecentActivity["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "urgent":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusBadge = (status: Patient["status"]) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DashboardLayout title="Doctor Dashboard" role="doctor">
        <div className="space-y-6">
          {/* Welcome Section with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 rounded-3xl p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-3">
                    <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
                    On Duty
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, Dr. {user?.firstName || "Doctor"}!
                  </h1>
                  <p className="text-green-100 text-lg mb-6">
                    You have {stats.todayAppointments} appointments scheduled
                    today
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() =>
                        router.push("/dashboard/doctor/prescriptions")
                      }
                      className="px-6 py-2.5 bg-white text-green-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      <Pill className="inline-block mr-2" size={18} />
                      Manage Prescriptions
                    </button>
                    <button
                      onClick={() => router.push("/dashboard/doctor/patients")}
                      className="px-6 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-opacity-30 transition-all"
                    >
                      <Users className="inline-block mr-2" size={18} />
                      View Patients
                    </button>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center w-32 h-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl">
                  <Stethoscope size={64} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Compact & Modern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  +12%
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Patients
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalPatients}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                From last month
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Pill className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  +8%
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active Prescriptions
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.activePrescriptions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                From last week
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full">
                  Urgent
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Pending Approvals
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.pendingApprovals}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Requires attention
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  Today
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Appointments
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.todayAppointments}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Clock size={12} className="mr-1" />
                Next at 2:00 PM
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 shadow-sm border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  ✓ Secure
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Blockchain Verified
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.blockchainVerified}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <CheckCircle size={12} className="mr-1" />
                Prescriptions secured
              </p>
            </div>
          </div>

          {/* Blockchain Status Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <BlockchainStatus />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Latest updates and notifications
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Recent Activity
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your recent activities will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      const colorClass = getActivityColor(activity.status);

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                              {activity.patient}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {activity.time}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {activity.status === "completed" ? (
                              <CheckCircle
                                className="text-green-600"
                                size={20}
                              />
                            ) : activity.status === "pending" ? (
                              <Clock className="text-yellow-600" size={20} />
                            ) : (
                              <AlertCircle className="text-red-600" size={20} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar with Quick Actions and Recent Patients */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      router.push("/dashboard/doctor/prescriptions")
                    }
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Pill size={20} />
                    </div>
                    <span className="font-semibold">New Prescription</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/doctor/patients")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Users
                        className="text-blue-600 dark:text-blue-400"
                        size={20}
                      />
                    </div>
                    <span className="font-semibold">View Patients</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/doctor/history")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <FileText
                        className="text-purple-600 dark:text-purple-400"
                        size={20}
                      />
                    </div>
                    <span className="font-semibold">History</span>
                  </button>
                </div>
              </div>

              {/* Recent Patients Mini Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Total Patients
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Under your care
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stats.totalPatients}
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/doctor/patients")}
                    className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    View All Patients →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl border border-green-100 dark:border-green-800">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Pill className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Prescriptions
                </h4>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {stats.activePrescriptions}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This month
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Patients Seen
                </h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stats.totalPatients}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total active
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Appointments
                </h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {stats.todayAppointments}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scheduled today
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Activity className="text-white" size={28} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Success Rate
                </h4>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  98%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Treatment success
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
