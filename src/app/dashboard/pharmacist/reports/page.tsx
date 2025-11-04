"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  Activity,
  Shield,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>("summary");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      // Fetch summary
      const summaryResponse = await fetch("/api/drugs/reports?type=summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryJson = await summaryResponse.json();
      if (summaryJson.success) {
        setSummaryData(summaryJson.data);
      }

      // Fetch blockchain data
      const blockchainResponse = await fetch(
        "/api/drugs/reports?type=blockchain",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const blockchainJson = await blockchainResponse.json();
      if (blockchainJson.success) {
        setBlockchainData(blockchainJson.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string, filename: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/drugs/reports?type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Export as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["pharmacist"]}>
        <DashboardLayout title="Reports & Analytics" role="pharmacist">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Reports & Analytics" role="pharmacist">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inventory Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive reports with blockchain verification
            </p>
          </div>

          {/* Report Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                id: "summary",
                label: "Summary Report",
                icon: FileText,
                color: "purple",
              },
              {
                id: "transactions",
                label: "Transaction History",
                icon: Activity,
                color: "blue",
              },
              {
                id: "blockchain",
                label: "Blockchain Audit",
                icon: Shield,
                color: "green",
              },
              {
                id: "valuation",
                label: "Inventory Valuation",
                icon: DollarSign,
                color: "yellow",
              },
            ].map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-6 rounded-lg border-2 transition ${
                    selectedReport === report.id
                      ? `border-${report.color}-600 bg-${report.color}-50`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 mb-3 ${
                      selectedReport === report.id
                        ? `text-${report.color}-600`
                        : "text-gray-400"
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {report.label}
                  </h3>
                </button>
              );
            })}
          </div>

          {/* Summary Report */}
          {selectedReport === "summary" && summaryData && (
            <div className="bg-white rounded-lg shadow">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Inventory Summary
                </h2>
                <button
                  onClick={() => exportReport("summary", "inventory-summary")}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">
                          Total Drugs
                        </p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {summaryData.summary.totalDrugs}
                        </p>
                      </div>
                      <Package className="h-12 w-12 text-purple-300" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">
                          Total Quantity
                        </p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                          {summaryData.summary.totalQuantity}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-green-300" />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">
                          Total Value
                        </p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                          ${summaryData.summary.totalValue}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-blue-300" />
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {summaryData.summary.lowStockDrugs}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {summaryData.summary.expiringDrugs}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Expired Drugs</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {summaryData.summary.expiredDrugs}
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                {summaryData.categoryBreakdown &&
                  summaryData.categoryBreakdown.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Category Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Category
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Drug Count
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Total Quantity
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Total Value
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summaryData.categoryBreakdown.map(
                              (category: any) => (
                                <tr key={category._id}>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {category._id || "Uncategorized"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                    {category.count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                    {category.totalQuantity}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                    ${category.totalValue.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Blockchain Report */}
          {selectedReport === "blockchain" && blockchainData && (
            <div className="bg-white rounded-lg shadow">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Blockchain Audit Trail
                </h2>
                <button
                  onClick={() => exportReport("blockchain", "blockchain-audit")}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Blockchain Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-2">
                      {blockchainData.statistics.totalTransactions}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">
                      Stock In
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {blockchainData.statistics.stockInCount}
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">
                      Dispensed
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-2">
                      {blockchainData.statistics.dispensedCount}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">
                      Drugs Tracked
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {blockchainData.statistics.totalDrugsTracked}
                    </p>
                  </div>
                </div>

                {/* Chain Integrity */}
                <div
                  className={`border-2 rounded-lg p-6 ${
                    blockchainData.statistics.chainIntegrity.isValid
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield
                      className={`h-8 w-8 ${
                        blockchainData.statistics.chainIntegrity.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                    <div>
                      <h3
                        className={`font-bold text-lg ${
                          blockchainData.statistics.chainIntegrity.isValid
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                        {blockchainData.statistics.chainIntegrity.message}
                      </h3>
                      <p
                        className={`text-sm ${
                          blockchainData.statistics.chainIntegrity.isValid
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {blockchainData.statistics.chainIntegrity.isValid
                          ? "All transactions are verified and tamper-proof"
                          : "Integrity issues detected"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Blockchain Transactions
                  </h3>
                  <div className="space-y-3">
                    {blockchainData.recentTransactions.map((tx: any) => (
                      <div
                        key={tx.transactionId}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  tx.transactionType === "stock_in"
                                    ? "bg-green-100 text-green-800"
                                    : tx.transactionType === "dispensed"
                                    ? "bg-blue-100 text-blue-800"
                                    : tx.transactionType === "expired"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {tx.transactionType}
                              </span>
                              <span className="font-medium text-gray-900">
                                {tx.drugName}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Quantity: {tx.quantity} | {tx.previousQuantity} →{" "}
                              {tx.newQuantity}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 font-mono">
                              Hash: {tx.hash.substring(0, 32)}...
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other report types */}
          {selectedReport === "transactions" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Transaction History
                </h2>
                <button
                  onClick={() =>
                    exportReport("transactions", "transaction-history")
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <p className="text-gray-600">
                Detailed transaction history available via API export
              </p>
            </div>
          )}

          {selectedReport === "valuation" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Inventory Valuation
                </h2>
                <button
                  onClick={() =>
                    exportReport("valuation", "inventory-valuation")
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <p className="text-gray-600">
                Complete inventory valuation report available via export
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
