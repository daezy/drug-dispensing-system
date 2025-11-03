"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Bell, Shield, Eye, EyeOff, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/lib/utils/toast-helper";

interface Settings {
  notifications: {
    email: boolean;
    sms: boolean;
    lowStockAlerts: boolean;
    prescriptionAlerts: boolean;
    expiryAlerts: boolean;
  };
  privacy: {
    showProfile: boolean;
    allowDataSharing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
  };
}

export default function PharmacistSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "security">(
    "settings"
  );

  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      sms: false,
      lowStockAlerts: true,
      prescriptionAlerts: true,
      expiryAlerts: true,
    },
    privacy: {
      showProfile: true,
      allowDataSharing: false,
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!user || user.role !== "pharmacist") {
      router.push("/");
      return;
    }
    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/pharmacists/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings && Object.keys(data.settings).length > 0) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/pharmacists/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showSuccess("Settings saved successfully");
      } else {
        showError("Failed to save settings");
      }
    } catch (error) {
      showError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        showSuccess("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();
        showError(data.message || "Failed to change password");
      }
    } catch (error) {
      showError("Failed to change password");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Settings" role="pharmacist">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-1">
              Manage your preferences and security
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "settings"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "security"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Settings Tab */}
                  {activeTab === "settings" && (
                    <div className="space-y-6">
                      {/* Notifications */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Bell className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Notifications
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {Object.entries({
                            email: "Email Notifications",
                            sms: "SMS Notifications",
                            lowStockAlerts: "Low Stock Alerts",
                            prescriptionAlerts: "Prescription Alerts",
                            expiryAlerts: "Expiry Date Alerts",
                          }).map(([key, label]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900">
                                {label}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    settings.notifications[
                                      key as keyof typeof settings.notifications
                                    ]
                                  }
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      notifications: {
                                        ...settings.notifications,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Privacy */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Privacy
                        </h3>
                        <div className="space-y-4">
                          {Object.entries({
                            showProfile: "Show Profile Publicly",
                            allowDataSharing:
                              "Allow Data Sharing for Analytics",
                          }).map(([key, label]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900">
                                {label}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    settings.privacy[
                                      key as keyof typeof settings.privacy
                                    ]
                                  }
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      privacy: {
                                        ...settings.privacy,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveSettings}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Save Settings"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      {/* Security Settings */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Security Options
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {Object.entries({
                            twoFactorEnabled: "Two-Factor Authentication",
                            loginAlerts: "Login Alerts",
                          }).map(([key, label]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900">
                                {label}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    settings.security[
                                      key as keyof typeof settings.security
                                    ]
                                  }
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      security: {
                                        ...settings.security,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Change Password */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Lock className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Change Password
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={
                                  showPasswords.current ? "text" : "password"
                                }
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                  setPasswordForm({
                                    ...passwordForm,
                                    currentPassword: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    current: !showPasswords.current,
                                  })
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              >
                                {showPasswords.current ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                  setPasswordForm({
                                    ...passwordForm,
                                    newPassword: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    new: !showPasswords.new,
                                  })
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={
                                  showPasswords.confirm ? "text" : "password"
                                }
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                  setPasswordForm({
                                    ...passwordForm,
                                    confirmPassword: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords({
                                    ...showPasswords,
                                    confirm: !showPasswords.confirm,
                                  })
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handlePasswordChange}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
