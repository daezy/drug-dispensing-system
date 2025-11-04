"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileText,
  Calendar,
  User,
  Activity,
  CheckCircle,
  Pill,
  TrendingUp,
  Filter,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError } from "@/lib/utils/toast-helper";

interface HistoryItem {
  id: string;
  type: "prescription" | "appointment" | "consultation" | "diagnosis";
  title: string;
  description: string;
  date: string;
  patientName: string;
  patientId: string;
  medications?: string[];
  diagnosis?: string;
  notes?: string;
}

export default function DoctorHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<
    "all" | "prescription" | "appointment" | "consultation"
  >("all");
  const [timeRange, setTimeRange] = useState<
    "today" | "week" | "month" | "year" | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      // Still loading auth context
      return;
    }

    if (user.role !== "doctor") {
      router.push("/");
      return;
    }

    loadHistory();
  }, [user, router]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem("auth_token");

      if (!token) {
        showError("Please log in again");
        router.push("/");
        return;
      }

      const response = await fetch("/api/doctors/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        if (response.status === 401) {
          showError("Session expired. Please log in again.");
          localStorage.removeItem("auth_token");
          router.push("/");
        } else {
          showError("Failed to load history");
        }
      }
    } catch (error) {
      console.error("Error loading history:", error);
      showError("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    // Filter by type
    if (filter !== "all" && item.type !== filter) return false;

    // Filter by search term
    if (
      searchTerm &&
      !item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filter by time range
    if (timeRange !== "all") {
      const itemDate = new Date(item.date);
      const now = new Date();
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (timeRange === "today" && diffDays > 1) return false;
      if (timeRange === "week" && diffDays > 7) return false;
      if (timeRange === "month" && diffDays > 30) return false;
      if (timeRange === "year" && diffDays > 365) return false;
    }

    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "prescription":
        return <FileText className="w-5 h-5" />;
      case "appointment":
        return <Calendar className="w-5 h-5" />;
      case "consultation":
        return <Users className="w-5 h-5" />;
      case "diagnosis":
        return <Activity className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "prescription":
        return "bg-blue-100 text-blue-600";
      case "appointment":
        return "bg-purple-100 text-purple-600";
      case "consultation":
        return "bg-green-100 text-green-600";
      case "diagnosis":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DashboardLayout title="Activity History" role="doctor">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Activity History
              </h2>
              <p className="text-gray-600 mt-1">
                Track your consultations and prescriptions
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-5 h-5" />
              <span>{filteredHistory.length} records</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search by patient name or activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter by Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("prescription")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === "prescription"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Prescriptions
                  </button>
                  <button
                    onClick={() => setFilter("appointment")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === "appointment"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Appointments
                  </button>
                  <button
                    onClick={() => setFilter("consultation")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === "consultation"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Consultations
                  </button>
                </div>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Time Range
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTimeRange("today")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === "today"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeRange("week")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === "week"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setTimeRange("month")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === "month"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setTimeRange("year")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === "year"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    This Year
                  </button>
                  <button
                    onClick={() => setTimeRange("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No history found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== "all" || timeRange !== "all"
                  ? "No records match your selected filters"
                  : "Your activity history will appear here"}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-4">
                {filteredHistory.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Timeline Line */}
                    {index !== filteredHistory.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    )}

                    {/* History Item */}
                    <div className="bg-white rounded-lg shadow-md p-6 ml-0 relative hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getTypeColor(
                            item.type
                          )}`}
                        >
                          {getTypeIcon(item.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{item.patientName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(item.date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Diagnosis */}
                          {item.diagnosis && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium text-gray-700">
                                Diagnosis: {item.diagnosis}
                              </p>
                            </div>
                          )}

                          {/* Medications */}
                          {item.medications && item.medications.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Medications:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.medications.map((med, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                                  >
                                    <Pill className="w-3 h-3" />
                                    {med}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600 italic">
                                Notes: {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
