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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

interface DashboardStats {
  totalPatients: number;
  activePrescriptions: number;
  pendingApprovals: number;
  todayAppointments: number;
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
    totalPatients: 247,
    activePrescriptions: 89,
    pendingApprovals: 12,
    todayAppointments: 8,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "prescription",
      patient: "Sarah Johnson",
      description: "Prescribed Metformin 500mg",
      time: "2 hours ago",
      status: "completed",
    },
    {
      id: "2",
      type: "appointment",
      patient: "Mike Chen",
      description: "Follow-up consultation",
      time: "4 hours ago",
      status: "completed",
    },
    {
      id: "3",
      type: "approval",
      patient: "Emily Davis",
      description: "Prescription approval required",
      time: "1 day ago",
      status: "pending",
    },
    {
      id: "4",
      type: "prescription",
      patient: "John Smith",
      description: "Prescribed Lisinopril 10mg",
      time: "2 days ago",
      status: "completed",
    },
  ]);

  const [recentPatients, setRecentPatients] = useState<Patient[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      age: 45,
      gender: "Female",
      lastVisit: "2024-01-15",
      condition: "Type 2 Diabetes",
      status: "active",
    },
    {
      id: "2",
      name: "Mike Chen",
      age: 32,
      gender: "Male",
      lastVisit: "2024-01-14",
      condition: "Hypertension",
      status: "active",
    },
    {
      id: "3",
      name: "Emily Davis",
      age: 28,
      gender: "Female",
      lastVisit: "2024-01-10",
      condition: "Migraine",
      status: "active",
    },
    {
      id: "4",
      name: "Robert Wilson",
      age: 56,
      gender: "Male",
      lastVisit: "2024-01-08",
      condition: "Arthritis",
      status: "inactive",
    },
  ]);

  const { user } = useAuth();

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
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, Dr. {user?.firstName}!
                </h2>
                <p className="text-green-100">
                  You have {stats.todayAppointments} appointments scheduled for
                  today
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Activity size={32} />
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
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPatients}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Prescriptions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activePrescriptions}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +8% from last week
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
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingApprovals}
                  </p>
                  <p className="text-xs text-yellow-600 flex items-center mt-1">
                    <AlertCircle size={12} className="mr-1" />
                    Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today's Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.todayAppointments}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Calendar size={12} className="mr-1" />
                    Next at 2:00 PM
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h3>
                  <button className="text-primary hover:text-primary-dark text-sm font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.status);

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.patient}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.time}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {activity.status === "completed" ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : activity.status === "pending" ? (
                            <Clock className="text-yellow-600" size={16} />
                          ) : (
                            <AlertCircle className="text-red-600" size={16} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Patients
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Search size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Filter size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="text-gray-600" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {patient.age} years • {patient.gender}
                          </p>
                          <p className="text-xs text-gray-500">
                            {patient.condition}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                            patient.status
                          )}`}
                        >
                          {patient.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {patient.lastVisit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/doctor/prescriptions")}
                className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500">
                  <Pill
                    size={20}
                    className="text-blue-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Manage Prescriptions
                  </p>
                  <p className="text-xs text-gray-600">
                    Create & manage prescriptions
                  </p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors group">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500">
                  <Plus
                    size={20}
                    className="text-green-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    New Patient
                  </p>
                  <p className="text-xs text-gray-600">Register new patient</p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500">
                  <Calendar
                    size={20}
                    className="text-purple-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Schedule Appointment
                  </p>
                  <p className="text-xs text-gray-600">
                    Book patient appointment
                  </p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors group">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-500">
                  <FileText
                    size={20}
                    className="text-orange-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Medical Records
                  </p>
                  <p className="text-xs text-gray-600">View patient history</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
