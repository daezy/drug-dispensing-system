"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState, UserRole } from "@/types/auth";
import {
  handleApiResponse,
  handleNetworkError,
  API_MESSAGES,
} from "@/lib/utils/toast-helper";

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    role: UserRole,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  connectWallet: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "CONNECT_WALLET"; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "CONNECT_WALLET":
      return {
        ...state,
        user: state.user
          ? { ...state.user, walletAddress: action.payload }
          : null,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthState = () => {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user_data");

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          dispatch({ type: "AUTH_SUCCESS", payload: user });
        } catch (error) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
        }
      }
    };

    checkAuthState();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
    rememberMe?: boolean
  ): Promise<boolean> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role, rememberMe }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Store auth data
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        // Update state with mapped user data
        dispatch({ type: "AUTH_SUCCESS", payload: data.user });
        handleApiResponse(data, API_MESSAGES.LOGIN_SUCCESS);

        console.log("Login successful:", {
          user: data.user.firstName + " " + data.user.lastName,
          role: data.user.role,
          email: data.user.email,
        });

        return true;
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Login failed",
        });
        handleApiResponse(data);
        console.error("Login failed:", data.message);
        return false;
      }
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: API_MESSAGES.NETWORK_ERROR,
      });
      handleNetworkError(error);
      console.error("Login network error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    dispatch({ type: "LOGOUT" });
  };

  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: "AUTH_START" });

    try {
      // Create FormData for file upload support
      const formData = new FormData();

      // Map the form data fields to what the API expects
      formData.append("email", userData.email || "");
      formData.append("password", userData.password || "");
      formData.append(
        "username",
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.username || ""
      );
      formData.append("address", userData.address || "");
      formData.append("role", userData.role || "");

      // Add role-specific fields
      if (userData.role === "doctor") {
        formData.append("license_number", userData.licenseNumber || "");
        formData.append("specialization", userData.specialty || "");
        if (userData.contactInfo) {
          formData.append(
            "contact_info",
            JSON.stringify({
              phone: userData.phone || "",
              hospitalAffiliation: userData.hospitalAffiliation || "",
            })
          );
        } else {
          formData.append(
            "contact_info",
            JSON.stringify({
              phone: userData.phone || "",
            })
          );
        }
      } else if (userData.role === "pharmacist") {
        formData.append("license_number", userData.licenseNumber || "");
        formData.append("pharmacy_name", userData.pharmacyName || "");
        formData.append(
          "contact_info",
          JSON.stringify({
            phone: userData.phone || "",
            pharmacyAddress: userData.pharmacyAddress || "",
          })
        );
      } else if (userData.role === "patient") {
        if (userData.dateOfBirth) {
          formData.append("date_of_birth", userData.dateOfBirth);
        }
        formData.append(
          "contact_info",
          JSON.stringify({
            phone: userData.phone || "",
            insuranceNumber: userData.insuranceNumber || "",
          })
        );
        if (userData.emergencyContact) {
          formData.append(
            "emergency_contact",
            JSON.stringify({
              name: userData.emergencyContact.split(" - ")[0] || "",
              phone: userData.emergencyContact.split(" - ")[1] || "",
            })
          );
        }
      } else if (userData.role === "admin") {
        formData.append(
          "contact_info",
          JSON.stringify({
            phone: userData.phone || "",
            employeeId: userData.employeeId || "",
            department: userData.department || "",
            accessLevel: userData.accessLevel || "",
          })
        );
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData, // Send FormData instead of JSON
      });

      const data = await response.json();

      if (data.success) {
        handleApiResponse(data, API_MESSAGES.REGISTRATION_SUCCESS);
        console.log("Registration successful:", {
          email: userData.email,
          role: userData.role,
          name: userData.firstName + " " + userData.lastName,
        });
        return true;
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Registration failed",
        });
        handleApiResponse(data);
        console.error("Registration failed:", data.message);
        return false;
      }
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: API_MESSAGES.NETWORK_ERROR,
      });
      handleNetworkError(error);
      return false;
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    try {
      if (typeof (window as any).ethereum !== "undefined") {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          const walletAddress = accounts[0];
          dispatch({ type: "CONNECT_WALLET", payload: walletAddress });
          localStorage.setItem("wallet_address", walletAddress);
          handleApiResponse({
            success: true,
            message: "Wallet connected successfully!",
          });
          return true;
        }
      } else {
        const errorMsg = "Please install MetaMask or another Web3 wallet";
        dispatch({
          type: "AUTH_FAILURE",
          payload: errorMsg,
        });
        handleApiResponse({ success: false, message: errorMsg });
      }
      return false;
    } catch (error) {
      const errorMsg = "Failed to connect wallet";
      dispatch({ type: "AUTH_FAILURE", payload: errorMsg });
      handleApiResponse({ success: false, message: errorMsg });
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: userData });

    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    connectWallet,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
