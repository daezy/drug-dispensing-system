"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  Package,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Plus,
  Truck,
  Users,
  ShoppingCart,
  FileText,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

interface DashboardStats {
  pendingPrescriptions: number;
  lowStockItems: number;
  ordersToday: number;
  totalInventory: number;
  dispensedPrescriptions: number;
}

interface PendingPrescription {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  quantity: number;
  prescribedBy: string;
  date: string;
  urgency: "normal" | "urgent" | "critical";
  status: "pending" | "preparing" | "ready";
}

interface InventoryItem {
  id: string;
  medication: string;
  brand: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  expiryDate: string;
  supplier: string;
  status: "in-stock" | "low-stock" | "out-of-stock" | "expired";
}

export default function PharmacistDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    pendingPrescriptions: 0,
    lowStockItems: 0,
    ordersToday: 0,
    totalInventory: 0,
    dispensedPrescriptions: 0,
  });

  const [pendingPrescriptions, setPendingPrescriptions] = useState<
    PendingPrescription[]
  >([]);

  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  const { user } = useAuth();

  // Fetch dispensed prescriptions count
  useEffect(() => {
    const fetchDispensedCount = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetch("/api/prescriptions/pharmacist?status=dispensed", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats((prev) => ({
            ...prev,
            dispensedPrescriptions: data.prescriptions?.length || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dispensed prescriptions:", error);
      }
    };

    if (user?.role === "pharmacist") {
      fetchDispensedCount();
    }
  }, [user]);

  const getUrgencyColor = (urgency: PendingPrescription["urgency"]) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-yellow-100 text-yellow-800";
      case "normal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockIcon = (status: InventoryItem["status"]) => {
    switch (status) {
      case "out-of-stock":
      case "expired":
        return AlertCircle;
      case "low-stock":
        return Clock;
      default:
        return CheckCircle;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Pharmacist Dashboard" role="pharmacist">
        <div className="space-y-6">
          {/* Welcome Section with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-3">
                    <div className="w-2 h-2 bg-purple-300 rounded-full mr-2 animate-pulse"></div>
                    On Duty
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, {user?.firstName || "Pharmacist"}!
                  </h1>
                  <p className="text-purple-100 text-lg mb-6">
                    {stats.pendingPrescriptions} prescriptions waiting to be
                    processed
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() =>
                        router.push("/dashboard/pharmacist/prescriptions")
                      }
                      className="px-6 py-2.5 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      <Pill className="inline-block mr-2" size={18} />
                      Process Prescriptions
                    </button>
                    <button
                      onClick={() =>
                        router.push("/dashboard/pharmacist/dispense")
                      }
                      className="px-6 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-opacity-30 transition-all"
                    >
                      <Package className="inline-block mr-2" size={18} />
                      Dispense Drugs
                    </button>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center w-32 h-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl">
                  <Pill size={64} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Compact & Modern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blockchain Security Card */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={20} className="text-white" />
                    <span className="text-sm font-medium">Secure</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">Blockchain Verified</p>
                  <p className="text-5xl font-bold mb-2">{stats.dispensedPrescriptions}</p>
                  <p className="text-sm text-blue-100">Prescriptions secured</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Pending Prescriptions
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.pendingPrescriptions}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                    <Clock size={12} className="mr-1" />3 urgent
                  </span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Pill className="text-white" size={28} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Low Stock Items
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.lowStockItems}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                    <AlertCircle size={12} className="mr-1" />
                    Attention needed
                  </span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="text-white" size={28} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Orders Today
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.ordersToday}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    <TrendingUp size={12} className="mr-1" />
                    +15% yesterday
                  </span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="text-white" size={28} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Inventory
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.totalInventory.toLocaleString()}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    <Activity size={12} className="mr-1" />
                    Items in stock
                  </span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="text-white" size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid - 3 columns on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Prescriptions - 2 columns */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Pill className="mr-2 text-purple-600" size={24} />
                    Pending Prescriptions
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Search size={18} />
                    </button>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {pendingPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {prescription.patientName}
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1">
                            {prescription.medication} {prescription.dosage}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Qty: {prescription.quantity} • Dr.{" "}
                            {prescription.prescribedBy}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(
                              prescription.urgency
                            )}`}
                          >
                            {prescription.urgency}
                          </span>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              prescription.status
                            )}`}
                          >
                            {prescription.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {prescription.date}
                        </span>
                        <div className="flex items-center space-x-2">
                          {prescription.status === "pending" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all"
                            >
                              Start Processing
                            </button>
                          )}
                          {prescription.status === "preparing" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-sm transition-all"
                            >
                              Mark Ready
                            </button>
                          )}
                          {prescription.status === "ready" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 shadow-sm transition-all"
                            >
                              Dispense
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Low Stock & Quick Actions */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="mr-2 text-purple-600" size={20} />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      router.push("/dashboard/pharmacist/dispense")
                    }
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    <Pill className="mr-2" size={18} />
                    Dispense Drugs
                  </button>
                  <button
                    onClick={() =>
                      router.push("/dashboard/pharmacist/inventory")
                    }
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                  >
                    <Package className="mr-2" size={16} />
                    Manage Inventory
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/pharmacist/reports")}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                  >
                    <FileText className="mr-2" size={16} />
                    View Reports
                  </button>
                  <button
                    onClick={() =>
                      router.push("/dashboard/pharmacist/patients")
                    }
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                  >
                    <Users className="mr-2" size={16} />
                    Patient Lookup
                  </button>
                </div>
              </div>

              {/* Low Stock Alert Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <AlertCircle className="mr-2 text-red-600" size={20} />
                      Low Stock Alert
                    </h3>
                    <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium transition-colors">
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {lowStockItems.map((item) => {
                      const StockIcon = getStockIcon(item.status);

                      return (
                        <div
                          key={item.id}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {item.medication}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                                {item.brand}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Supplier: {item.supplier}
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                item.status
                              )}`}
                            >
                              <StockIcon size={12} className="mr-1" />
                              {item.status.replace("-", " ")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Current Stock
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {item.currentStock}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Min. Stock
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {item.minimumStock}
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-500 dark:text-gray-400">
                                Expiry: {item.expiryDate}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.currentStock === 0
                                      ? "bg-red-500"
                                      : item.currentStock < item.minimumStock
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (item.currentStock / item.minimumStock) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <button className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all whitespace-nowrap">
                                <Plus size={12} className="inline mr-1" />
                                Reorder
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Pill size={24} className="opacity-80" />
                <span className="text-2xl font-bold">{stats.ordersToday}</span>
              </div>
              <h4 className="font-semibold text-purple-100">Orders Today</h4>
              <p className="text-sm text-purple-200 mt-1">
                +15% from yesterday
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Package size={24} className="opacity-80" />
                <span className="text-2xl font-bold">
                  {stats.totalInventory}
                </span>
              </div>
              <h4 className="font-semibold text-blue-100">Total Inventory</h4>
              <p className="text-sm text-blue-200 mt-1">Items in stock</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle size={24} className="opacity-80" />
                <span className="text-2xl font-bold">
                  {stats.lowStockItems}
                </span>
              </div>
              <h4 className="font-semibold text-pink-100">Low Stock</h4>
              <p className="text-sm text-pink-200 mt-1">Requires attention</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={24} className="opacity-80" />
                <span className="text-2xl font-bold">98%</span>
              </div>
              <h4 className="font-semibold text-green-100">Success Rate</h4>
              <p className="text-sm text-green-200 mt-1">This month</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
