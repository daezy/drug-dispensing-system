"use client";

import DashboardLayout from "@/components/DashboardLayout";
import PatientIdMigrationTool from "@/components/PatientIdMigrationTool";
import { Settings } from "lucide-react";

export default function AdminToolsPage() {
  return (
    <DashboardLayout title="Admin Tools" role="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl flex items-center justify-center">
              <Settings className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Tools
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            System administration and maintenance tools
          </p>
        </div>

        {/* Migration Tool */}
        <PatientIdMigrationTool />
      </div>
    </DashboardLayout>
  );
}
