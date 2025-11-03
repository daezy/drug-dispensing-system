"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  UserCircle,
  Pill,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { showSuccess, showError } from "@/lib/utils/toast-helper";

type UserRole = "doctor" | "patient" | "pharmacist";

interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
  rememberMe: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
    role: "patient",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  const roleConfig = {
    doctor: {
      icon: Stethoscope,
      title: "Doctor Login",
      description: "Access your medical practice dashboard",
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      focusColor: "focus:ring-blue-500 focus:border-blue-500",
    },
    patient: {
      icon: UserCircle,
      title: "Patient Login",
      description: "View your prescriptions and medical records",
      color: "green",
      bgGradient: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      focusColor: "focus:ring-green-500 focus:border-green-500",
    },
    pharmacist: {
      icon: Pill,
      title: "Pharmacist Login",
      description: "Manage prescriptions and dispensing",
      color: "purple",
      bgGradient: "from-purple-500 to-purple-600",
      borderColor: "border-purple-200",
      focusColor: "focus:ring-purple-500 focus:border-purple-500",
    },
  };

  const currentConfig = roleConfig[formData.role];
  const IconComponent = currentConfig.icon;

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call actual authentication
      const success = await login(
        formData.email,
        formData.password,
        formData.role,
        formData.rememberMe
      );

      if (success) {
        // Role-based routing
        const dashboardRoutes = {
          doctor: "/doctor/dashboard",
          patient: "/patient/dashboard",
          pharmacist: "/pharmacist/dashboard",
        };

        router.push(dashboardRoutes[formData.role]);
      }
    } catch (error) {
      showError("Invalid credentials. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof LoginForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Header */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={`p-3 rounded-full bg-gradient-to-r ${currentConfig.bgGradient} shadow-lg`}
          >
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Drug Dispensing System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure medical prescription management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                const config = roleConfig[role];
                const RoleIcon = config.icon;
                const isSelected = formData.role === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleInputChange("role", role)}
                    className={`p-3 text-center border rounded-lg transition-all duration-200 ${
                      isSelected
                        ? `${config.borderColor} bg-${config.color}-50 border-2`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <RoleIcon
                      className={`w-6 h-6 mx-auto mb-1 ${
                        isSelected
                          ? `text-${config.color}-600`
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected
                          ? `text-${config.color}-700`
                          : "text-gray-600"
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Role Info */}
          <div
            className={`mb-6 p-3 rounded-lg border ${currentConfig.borderColor} bg-${currentConfig.color}-50`}
          >
            <div className="flex items-center">
              <IconComponent
                className={`w-5 h-5 text-${currentConfig.color}-600 mr-2`}
              />
              <div>
                <h3
                  className={`text-sm font-medium text-${currentConfig.color}-800`}
                >
                  {currentConfig.title}
                </h3>
                <p className={`text-sm text-${currentConfig.color}-600`}>
                  {currentConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 block w-full border rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : `border-gray-300 dark:border-gray-600 ${currentConfig.focusColor}`
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`pl-10 pr-10 block w-full border rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : `border-gray-300 dark:border-gray-600 ${currentConfig.focusColor}`
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    handleInputChange("rememberMe", e.target.checked)
                  }
                  className={`h-4 w-4 rounded border-gray-300 text-${currentConfig.color}-600 focus:ring-${currentConfig.color}-500`}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r ${currentConfig.bgGradient} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${currentConfig.color}-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Sign in as{" "}
                    {formData.role.charAt(0).toUpperCase() +
                      formData.role.slice(1)}
                  </div>
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Demo Credentials:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Any email</span> •{" "}
                  <span className="font-medium">Any password (6+ chars)</span>
                </p>
                <p className="text-gray-500">
                  System will authenticate based on selected role
                </p>
              </div>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to the system?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className={`font-medium text-${currentConfig.color}-600 hover:text-${currentConfig.color}-500`}
              >
                Create your account
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Secure Authentication</p>
                <p>
                  Your login is protected with enterprise-grade security
                  including rate limiting and encrypted data transmission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
