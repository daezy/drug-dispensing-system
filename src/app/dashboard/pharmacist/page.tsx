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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

interface DashboardStats {
  pendingPrescriptions: number;
  lowStockItems: number;
  ordersToday: number;
  totalInventory: number;
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
  });

  const [pendingPrescriptions, setPendingPrescriptions] = useState<
    PendingPrescription[]
  >([]);

  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  const { user } = useAuth();

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
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.firstName}!
                </h2>
                <p className="text-purple-100">
                  You have {stats.pendingPrescriptions} prescriptions to process
                  today
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Pill size={32} />
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
                    Pending Prescriptions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingPrescriptions}
                  </p>
                  <p className="text-xs text-yellow-600 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />3 urgent orders
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Pill className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Low Stock Items
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.lowStockItems}
                  </p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <AlertCircle size={12} className="mr-1" />
                    Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Orders Today
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.ordersToday}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +15% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Inventory
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalInventory.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Activity size={12} className="mr-1" />
                    Items in stock
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Prescriptions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pending Prescriptions
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
                  {pendingPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {prescription.patientName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {prescription.medication} {prescription.dosage}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {prescription.quantity} • Dr.{" "}
                            {prescription.prescribedBy}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(
                              prescription.urgency
                            )}`}
                          >
                            {prescription.urgency}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              prescription.status
                            )}`}
                          >
                            {prescription.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {prescription.date}
                        </span>
                        <div className="flex items-center space-x-2">
                          {prescription.status === "pending" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                            >
                              Start Processing
                            </button>
                          )}
                          {prescription.status === "preparing" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-3 py-1 text-xs bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                            >
                              Mark Ready
                            </button>
                          )}
                          {prescription.status === "ready" && (
                            <button
                              onClick={() =>
                                router.push("/pharmacist/dispense")
                              }
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200"
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

            {/* Low Stock Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Low Stock Alert
                  </h3>
                  <button className="text-primary hover:text-primary-dark text-sm font-medium">
                    View All Inventory
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {lowStockItems.map((item) => {
                    const StockIcon = getStockIcon(item.status);

                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.medication}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.brand}
                            </p>
                            <p className="text-xs text-gray-500">
                              Supplier: {item.supplier}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                item.status
                              )}`}
                            >
                              <StockIcon size={10} className="inline mr-1" />
                              {item.status.replace("-", " ")}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">
                              Current Stock
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {item.currentStock}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Minimum Stock
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {item.minimumStock}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unit Price</p>
                            <p className="text-sm font-medium text-gray-900">
                              ${item.unitPrice}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expiry</p>
                            <p className="text-sm font-medium text-gray-900">
                              {item.expiryDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
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
                                  (item.currentStock / item.minimumStock) * 100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 whitespace-nowrap">
                            <Plus size={10} className="inline mr-1" />
                            Reorder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                onClick={() => router.push("/pharmacist/dispense")}
                className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500">
                  <Pill
                    className="text-green-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Dispense Prescriptions
                  </p>
                  <p className="text-xs text-gray-600">
                    Process pending orders
                  </p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Package
                    className="text-blue-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Manage Inventory
                  </p>
                  <p className="text-xs text-gray-600">Update stock levels</p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Truck
                    className="text-purple-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Track Delivery
                  </p>
                  <p className="text-xs text-gray-600">Monitor shipments</p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Users
                    className="text-yellow-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Patient Consultation
                  </p>
                  <p className="text-xs text-gray-600">Provide guidance</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
