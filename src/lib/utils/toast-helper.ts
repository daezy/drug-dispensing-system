// Toast notification helper utilities
// Provides standardized toast messages for API responses

import toast from "react-hot-toast";

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Handle API response with appropriate toast notification
 * @param response - API response object
 * @param successMessage - Optional custom success message
 * @param errorMessage - Optional custom error message
 */
export const handleApiResponse = (
  response: ApiResponse,
  successMessage?: string,
  errorMessage?: string
) => {
  if (response.success) {
    const message =
      successMessage || response.message || "Operation successful!";
    toast.success(message);
    return true;
  } else {
    const message =
      errorMessage || response.message || response.error || "Operation failed";
    toast.error(message);
    return false;
  }
};

/**
 * Handle network errors with toast notification
 * @param error - Error object
 * @param customMessage - Optional custom error message
 */
export const handleNetworkError = (error: any, customMessage?: string) => {
  console.error("Network error:", error);
  const message = customMessage || "Network error. Please try again.";
  toast.error(message);
};

/**
 * Show success toast with standardized styling
 * @param message - Success message
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: "#10b981",
      color: "#ffffff",
    },
  });
};

/**
 * Show error toast with standardized styling
 * @param message - Error message
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    style: {
      background: "#ef4444",
      color: "#ffffff",
    },
  });
};

/**
 * Show warning toast with standardized styling
 * @param message - Warning message
 */
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "#f59e0b",
      color: "#ffffff",
    },
  });
};

/**
 * Show loading toast for long operations
 * @param message - Loading message
 * @returns toast id for dismissal
 */
export const showLoading = (message: string = "Loading...") => {
  return toast.loading(message, {
    style: {
      background: "#3b82f6",
      color: "#ffffff",
    },
  });
};

/**
 * Dismiss a specific toast
 * @param toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Common API error messages
 */
export const API_MESSAGES = {
  NETWORK_ERROR: "Network error. Please try again.",
  UNAUTHORIZED: "Please login to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "Requested resource not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again later.",

  // Auth specific
  LOGIN_SUCCESS: "Login successful!",
  LOGIN_FAILED: "Invalid credentials. Please try again.",
  REGISTRATION_SUCCESS:
    "Registration successful! Please check your email for verification.",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  PASSWORD_RESET_SUCCESS: "Password reset link sent to your email.",
  PASSWORD_RESET_FAILED: "Failed to send password reset link.",

  // Form validation
  REQUIRED_FIELDS: "Please fill in all required fields.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  WEAK_PASSWORD: "Password must be at least 8 characters long.",

  // File upload
  FILE_TOO_LARGE: "File size too large. Please choose a smaller file.",
  INVALID_FILE_TYPE: "Invalid file type. Please choose a valid file.",
  UPLOAD_SUCCESS: "File uploaded successfully!",
  UPLOAD_FAILED: "File upload failed. Please try again.",
} as const;
