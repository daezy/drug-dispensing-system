"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface UpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drug: any;
}

export default function UpdateStockModal({
  isOpen,
  onClose,
  onSuccess,
  drug,
}: UpdateStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState(0);
  const [transactionType, setTransactionType] = useState("stock_in");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const currentStock = drug.stock_quantity;
      const newStock =
        actionType === "add"
          ? currentStock + quantity
          : currentStock - quantity;

      if (newStock < 0) {
        throw new Error("Cannot reduce stock below zero");
      }

      const token = localStorage.getItem("token");
      const response = await fetch("/api/drugs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          drugId: drug._id,
          updates: {
            stock_quantity: newStock,
          },
          transactionType:
            actionType === "remove" ? transactionType : "stock_in",
          notes:
            notes ||
            `Stock ${
              actionType === "add" ? "increased" : "decreased"
            } by ${quantity}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update stock");
      }

      console.log("✅ Stock updated successfully:", data);
      onSuccess();
      onClose();

      // Reset form
      setQuantity(0);
      setNotes("");
      setActionType("add");
    } catch (err: any) {
      console.error("Error updating stock:", err);
      setError(err.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !drug) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
            <p className="text-sm text-gray-600 mt-1">{drug.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Current Stock */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-900">
                Current Stock:
              </span>
              <span className="text-2xl font-bold text-purple-600">
                {drug.stock_quantity}
              </span>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType("add")}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                  actionType === "add"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setActionType("remove")}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                  actionType === "remove"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                Remove Stock
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Transaction Type (for removal) */}
          {actionType === "remove" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Removal
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="returned">Returned</option>
                <option value="dispensed">Dispensed</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* New Stock Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                New Stock:
              </span>
              <span
                className={`text-2xl font-bold ${
                  actionType === "add" ? "text-green-600" : "text-red-600"
                }`}
              >
                {actionType === "add"
                  ? drug.stock_quantity + quantity
                  : drug.stock_quantity - quantity}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || quantity === 0}
              className={`px-6 py-2 rounded-md text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "Updating..." : "Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
