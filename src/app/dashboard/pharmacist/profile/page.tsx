"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Award,
  Calendar,
  Save,
  Edit2,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/lib/utils/toast-helper";

interface PharmacistProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  specialization?: string;
  experience?: number;
  dateJoined?: string;
}

export default function PharmacistProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with user data from auth context
  const getInitialProfile = (): PharmacistProfile => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    licenseNumber: user?.licenseNumber || "",
    pharmacyName: user?.pharmacyName || "",
    pharmacyAddress: user?.pharmacyAddress || "",
    pharmacyPhone: "",
    specialization: "",
    experience: 0,
    dateJoined: user?.createdAt || "",
  });

  const [profile, setProfile] = useState<PharmacistProfile>(
    getInitialProfile()
  );
  const [originalProfile, setOriginalProfile] = useState<PharmacistProfile>(
    getInitialProfile()
  );

  useEffect(() => {
    if (!user || user.role !== "pharmacist") {
      router.push("/");
      return;
    }
    // Update profile when user data is available
    const initialProfile = getInitialProfile();
    setProfile(initialProfile);
    setOriginalProfile(initialProfile);
    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/pharmacists/profile");
      if (response.ok) {
        const data = await response.json();
        // Merge API data with existing profile data
        const mergedProfile = { ...profile, ...data.profile };
        setProfile(mergedProfile);
        setOriginalProfile(mergedProfile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      // If API fails, keep the profile data from auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/pharmacists/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        showSuccess("Profile updated successfully");
        setOriginalProfile(profile);
        setIsEditing(false);
      } else {
        showError("Failed to update profile");
      }
    } catch (error) {
      showError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["pharmacist"]}>
        <DashboardLayout title="Profile" role="pharmacist">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Profile" role="pharmacist">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <p className="text-gray-600 mt-1">
                Manage your personal and pharmacy information
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {profile.firstName?.[0]}
                    {profile.lastName?.[0]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Pharmacist</p>
                  {profile.specialization && (
                    <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {profile.specialization}
                    </div>
                  )}
                  <div className="w-full mt-6 pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>License: {profile.licenseNumber || "N/A"}</span>
                    </div>
                    {profile.experience !== undefined &&
                      profile.experience > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{profile.experience} years experience</span>
                        </div>
                      )}
                    {profile.dateJoined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined{" "}
                          {new Date(profile.dateJoined).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.firstName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile({ ...profile, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.lastName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{profile.email || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {profile.phone || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">
                        {profile.licenseNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.specialization}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            specialization: e.target.value,
                          })
                        }
                        placeholder="e.g., Clinical Pharmacy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.specialization || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profile.experience}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            experience: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.experience || 0} years
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pharmacy Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pharmacy Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.pharmacyName}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            pharmacyName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.pharmacyName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Address
                    </label>
                    {isEditing ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-2" />
                        <textarea
                          value={profile.pharmacyAddress}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              pharmacyAddress: e.target.value,
                            })
                          }
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-gray-900">
                          {profile.pharmacyAddress || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Phone
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profile.pharmacyPhone}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              pharmacyPhone: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {profile.pharmacyPhone || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
