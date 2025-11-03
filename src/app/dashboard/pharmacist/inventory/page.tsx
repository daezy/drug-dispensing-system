"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddDrugModal from "@/components/AddDrugModal";
import UpdateStockModal from "@/components/UpdateStockModal";
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function InventoryPage() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({
    lowStock: [],
    expiring: [],
    expired: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "low-stock" | "expiring" | "expired"
  >("all");

  useEffect(() => {
    fetchDrugs();
    fetchAlerts();
  }, []);

  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/drugs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDrugs(data.data);
      }
    } catch (error) {
      console.error("Error fetching drugs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/drugs/alerts?type=all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleUpdateStock = (drug: any) => {
    setSelectedDrug(drug);
    setShowUpdateModal(true);
  };

  const handleDeleteDrug = async (drugId: string) => {
    if (!confirm("Are you sure you want to delete this drug?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/drugs?id=${drugId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchDrugs();
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error deleting drug:", error);
    }
  };

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/drugs/reports?type=summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // Download as JSON
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-report-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const getDisplayDrugs = () => {
    let displayDrugs = drugs;

    if (activeTab === "low-stock") {
      displayDrugs = alerts.lowStock;
    } else if (activeTab === "expiring") {
      displayDrugs = alerts.expiring;
    } else if (activeTab === "expired") {
      displayDrugs = alerts.expired;
    }

    if (searchTerm) {
      displayDrugs = displayDrugs.filter(
        (drug: any) =>
          drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drug.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drug.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      displayDrugs = displayDrugs.filter(
        (drug: any) => drug.category === filterCategory
      );
    }

    return displayDrugs;
  };

  const categories = Array.from(
    new Set(drugs.map((d) => d.category).filter(Boolean))
  );

  const displayDrugs = getDisplayDrugs();
  const totalValue = drugs.reduce(
    (sum, drug) => sum + (drug.unit_price || 0) * drug.stock_quantity,
    0
  );

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Inventory Management" role="pharmacist">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Drug Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage drugs with blockchain traceability
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportReport}
                className="flex items-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
              >
                <Download className="h-5 w-5" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>Add Drug</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Drugs</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {drugs.length}
                  </p>
                </div>
                <Package className="h-12 w-12 text-purple-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {alerts.lowStock.length}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {alerts.expiring.length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-yellow-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(alerts.expired.length > 0 ||
            alerts.expiring.length > 0 ||
            alerts.lowStock.length > 0) && (
            <div className="space-y-3">
              {alerts.expired.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">
                        {alerts.expired.length} Expired Drugs
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        Remove these drugs from inventory immediately
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {alerts.expiring.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900">
                        {alerts.expiring.length} Drugs Expiring Soon
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        These drugs will expire within 30 days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {alerts.lowStock.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-900">
                        {alerts.lowStock.length} Low Stock Items
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Restock these drugs soon
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: "all", label: "All Drugs", count: drugs.length },
                  {
                    id: "low-stock",
                    label: "Low Stock",
                    count: alerts.lowStock.length,
                  },
                  {
                    id: "expiring",
                    label: "Expiring",
                    count: alerts.expiring.length,
                  },
                  {
                    id: "expired",
                    label: "Expired",
                    count: alerts.expired.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search drugs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : displayDrugs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No drugs found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drug Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayDrugs.map((drug) => {
                      const isLowStock =
                        drug.stock_quantity <= drug.minimum_stock_level;
                      const isExpired = new Date(drug.expiry_date) < new Date();
                      const isExpiring =
                        !isExpired &&
                        new Date(drug.expiry_date) <
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <tr key={drug._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">
                                {drug.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {drug.generic_name || drug.manufacturer}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {drug.category && (
                              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                {drug.category}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className={`text-sm font-semibold ${
                                  isLowStock ? "text-red-600" : "text-gray-900"
                                }`}
                              >
                                {drug.stock_quantity}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                / {drug.minimum_stock_level}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(drug.expiry_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${drug.unit_price?.toFixed(2) || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              {isExpired && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full inline-block">
                                  Expired
                                </span>
                              )}
                              {isExpiring && !isExpired && (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full inline-block">
                                  Expiring Soon
                                </span>
                              )}
                              {isLowStock && (
                                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full inline-block">
                                  Low Stock
                                </span>
                              )}
                              {!isExpired && !isExpiring && !isLowStock && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full inline-block">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleUpdateStock(drug)}
                                className="text-purple-600 hover:text-purple-900 transition"
                                title="Update Stock"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDrug(drug._id)}
                                className="text-red-600 hover:text-red-900 transition"
                                title="Delete Drug"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddDrugModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchDrugs();
            fetchAlerts();
          }}
        />

        <UpdateStockModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedDrug(null);
          }}
          onSuccess={() => {
            fetchDrugs();
            fetchAlerts();
          }}
          drug={selectedDrug}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
