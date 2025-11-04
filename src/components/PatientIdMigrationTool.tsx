"use client";

import { useState } from "react";
import { Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface MigrationResult {
  success: boolean;
  message: string;
  statistics?: {
    total: number;
    success: number;
    failed: number;
  };
  sampleIds?: string[];
  errors?: any[];
}

export default function PatientIdMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setResult({
          success: false,
          message: "No authentication token found. Please login as admin.",
        });
        setIsRunning(false);
        return;
      }

      const response = await fetch("/api/admin/migrate-patient-ids", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Database className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Patient ID Migration Tool
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate Patient IDs for existing patients
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle
              className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What this tool does:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Finds all patients without Patient IDs</li>
                <li>Generates unique IDs in format PT-YYYY-XXXXXX</li>
                <li>Updates the database with the new IDs</li>
                <li>
                  Safe to run multiple times (skips patients who already have
                  IDs)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runMigration}
          disabled={isRunning}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
            isRunning
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Running Migration...</span>
            </span>
          ) : (
            "Run Migration"
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6">
            {result.success ? (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle
                    className="text-green-600 dark:text-green-400"
                    size={24}
                  />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                    {result.message}
                  </h3>
                </div>

                {result.statistics && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {result.statistics.total}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Success
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.statistics.success}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Failed
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {result.statistics.failed}
                      </p>
                    </div>
                  </div>
                )}

                {result.sampleIds && result.sampleIds.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Sample Generated IDs:
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
                      {result.sampleIds.map((id, index) => (
                        <div
                          key={index}
                          className="text-blue-600 dark:text-blue-400 py-1"
                        >
                          {id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <XCircle
                    className="text-red-600 dark:text-red-400"
                    size={24}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                      Migration Failed
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                      Errors:
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm max-h-60 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-red-600 dark:text-red-400 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <span className="font-semibold">
                            Patient {error.patientId}:
                          </span>{" "}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-semibold mb-2">Note:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This requires admin access</li>
            <li>The operation cannot be undone automatically</li>
            <li>Existing Patient IDs will not be modified</li>
            <li>
              You can verify results in the Doctor&apos;s prescription page
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
