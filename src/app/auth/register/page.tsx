"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pill, Users, Shield, Box } from "lucide-react";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess, API_MESSAGES } from "@/lib/utils/toast-helper";

interface FormData {
  role: UserRole | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;

  // Role-specific fields
  licenseNumber?: string;
  specialty?: string;
  hospitalAffiliation?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
  emergencyContact?: string;
  employeeId?: string;
  department?: string;
  accessLevel?: string;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const roles = [
    {
      id: "patient" as UserRole,
      name: "Patient",
      icon: Users,
      description: "Access your prescriptions and medical records",
      tags: ["View Prescriptions", "Medical History"],
      color: "blue",
    },
    {
      id: "doctor" as UserRole,
      name: "Doctor",
      icon: Shield,
      description: "Prescribe medications and manage patients",
      tags: ["Write Prescriptions", "Patient Management"],
      color: "green",
    },
    {
      id: "pharmacist" as UserRole,
      name: "Pharmacist",
      icon: Pill,
      description: "Dispense medications and manage inventory",
      tags: ["Dispense Drugs", "Inventory Control"],
      color: "purple",
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
    setCurrentStep(2);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const success = await register(formData);

      if (success) {
        showSuccess("Registration successful! You can now log in.");
        // Redirect to login page after 1.5 seconds
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      showError(API_MESSAGES.PASSWORD_MISMATCH);
      return false;
    }

    if (formData.password.length < 8) {
      showError(API_MESSAGES.WEAK_PASSWORD);
      return false;
    }

    if (!formData.terms) {
      showError("Please accept the terms and conditions");
      return false;
    }

    return true;
  };

  const getStepProgress = () => {
    return ((currentStep - 1) / 1) * 100;
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case "doctor":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber || ""}
                  onChange={(e) =>
                    handleInputChange("licenseNumber", e.target.value)
                  }
                  className="form-input"
                  placeholder="MD-YYYY-XXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select
                  value={formData.specialty || ""}
                  onChange={(e) =>
                    handleInputChange("specialty", e.target.value)
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select Specialty</option>
                  <option value="general">General Practice</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="neurology">Neurology</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital/Clinic Affiliation
              </label>
              <input
                type="text"
                value={formData.hospitalAffiliation || ""}
                onChange={(e) =>
                  handleInputChange("hospitalAffiliation", e.target.value)
                }
                className="form-input"
                placeholder="Hospital or clinic name"
                required
              />
            </div>
          </>
        );

      case "pharmacist":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacy License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber || ""}
                  onChange={(e) =>
                    handleInputChange("licenseNumber", e.target.value)
                  }
                  className="form-input"
                  placeholder="PH-YYYY-XXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacy Name
                </label>
                <input
                  type="text"
                  value={formData.pharmacyName || ""}
                  onChange={(e) =>
                    handleInputChange("pharmacyName", e.target.value)
                  }
                  className="form-input"
                  placeholder="Pharmacy name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pharmacy Address
              </label>
              <textarea
                value={formData.pharmacyAddress || ""}
                onChange={(e) =>
                  handleInputChange("pharmacyAddress", e.target.value)
                }
                className="form-input"
                rows={3}
                placeholder="Full pharmacy address"
                required
              />
            </div>
          </>
        );

      case "patient":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.insuranceNumber || ""}
                  onChange={(e) =>
                    handleInputChange("insuranceNumber", e.target.value)
                  }
                  className="form-input"
                  placeholder="Insurance ID"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact || ""}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value)
                }
                className="form-input"
                placeholder="Emergency contact name and phone"
                required
              />
            </div>
          </>
        );

      case "admin":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={formData.employeeId || ""}
                  onChange={(e) =>
                    handleInputChange("employeeId", e.target.value)
                  }
                  className="form-input"
                  placeholder="EMP-YYYY-XXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={formData.department || ""}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="it">IT Administration</option>
                  <option value="medical">Medical Administration</option>
                  <option value="pharmacy">Pharmacy Administration</option>
                  <option value="compliance">Compliance</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                value={formData.accessLevel || ""}
                onChange={(e) =>
                  handleInputChange("accessLevel", e.target.value)
                }
                className="form-input"
                required
              >
                <option value="">Select Access Level</option>
                <option value="level1">Level 1 - Basic Admin</option>
                <option value="level2">Level 2 - Advanced Admin</option>
                <option value="level3">Level 3 - Super Admin</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Pill className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PharmChain</h1>
                <p className="text-sm text-gray-600">Create Your Account</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Progress Steps */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= 1 ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  Select Role
                </span>
              </div>
              <div
                className={`w-16 h-0.5 ${
                  currentStep >= 2 ? "bg-primary" : "bg-gray-300"
                }`}
              ></div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= 2 ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  Personal Info
                </span>
              </div>
              <div
                className={`w-16 h-0.5 ${
                  currentStep >= 3 ? "bg-primary" : "bg-gray-300"
                }`}
              ></div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 3
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= 3 ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  Verification
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Choose Your Role
                  </h2>
                  <p className="text-gray-600">
                    Select the role that best describes your position in the
                    healthcare system
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {roles.map((role) => {
                    const Icon = role.icon;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleSelect(role.id)}
                        className="role-card group p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div
                            className={`w-16 h-16 bg-${role.color}-100 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors`}
                          >
                            <Icon
                              className={`text-2xl text-${role.color}-600 group-hover:text-white`}
                              size={32}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {role.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {role.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {role.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Registration Form */}
            {currentStep === 2 && (
              <div className="fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Create Your Account
                  </h2>
                  <p className="text-gray-600">
                    Fill in your details to register as a{" "}
                    <span className="font-medium text-primary">
                      {formData.role?.charAt(0).toUpperCase() +
                        formData.role?.slice(1)}
                    </span>
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="max-w-2xl mx-auto space-y-6"
                >
                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Role-specific fields */}
                  {renderRoleSpecificFields()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) =>
                        handleInputChange("terms", e.target.checked)
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                      required
                    />
                    <label className="text-sm text-gray-600">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:text-primary-dark"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:text-primary-dark"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn-ghost flex-1"
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {isLoading ? "Creating Account..." : "Continue"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
