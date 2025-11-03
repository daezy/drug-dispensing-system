"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import {
  Pill,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Users,
  Box,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types/auth";
import { Web3Provider } from "@/components/Web3Provider";

function LoginPageContent() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [authMethod, setAuthMethod] = useState<"traditional" | "wallet">(
    "traditional"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Web3Modal hooks with error handling
  let web3ModalOpen: (() => Promise<void>) | null = null;
  let walletAddress: string | undefined = undefined;
  let walletConnected = false;

  try {
    const { open } = useWeb3Modal();
    const { address, isConnected } = useAccount();
    web3ModalOpen = open;
    walletAddress = address;
    walletConnected = isConnected;
  } catch (error) {
    console.warn("Web3Modal not available:", error);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password, selectedRole, rememberMe);
    if (success) {
      router.push(`/dashboard/${selectedRole}`);
    }
  };

  const handleWalletLogin = async () => {
    if (!web3ModalOpen) {
      console.error("Web3Modal not available");
      return;
    }
    try {
      // Open Web3Modal to connect wallet
      await web3ModalOpen();
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  // Effect to handle wallet authentication after connection
  React.useEffect(() => {
    const authenticateWallet = async () => {
      if (walletConnected && walletAddress && authMethod === "wallet") {
        try {
          console.log("Authenticating wallet:", walletAddress);

          const response = await fetch("/api/auth/wallet-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: walletAddress,
              role: selectedRole,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Store token and user data
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("Wallet authentication successful:", data.message);

            // Redirect to dashboard
            router.push(`/dashboard/${selectedRole}`);
          } else {
            console.error("Wallet authentication failed:", data.error);
            alert(data.error || "Failed to authenticate with wallet");
          }
        } catch (error) {
          console.error("Error authenticating wallet:", error);
          alert("Failed to authenticate. Please try again.");
        }
      }
    };

    authenticateWallet();
  }, [walletConnected, walletAddress, authMethod, selectedRole, router]);

  const roles = [
    {
      value: "patient" as UserRole,
      label: "Patient",
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      hoverBg: "hover:bg-blue-100",
      activeBg: "bg-blue-100",
      activeBorder: "border-blue-500",
    },
    {
      value: "doctor" as UserRole,
      label: "Doctor",
      icon: Shield,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      hoverBg: "hover:bg-green-100",
      activeBg: "bg-green-100",
      activeBorder: "border-green-500",
    },
    {
      value: "pharmacist" as UserRole,
      label: "Pharmacist",
      icon: Pill,
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      hoverBg: "hover:bg-purple-100",
      activeBg: "bg-purple-100",
      activeBorder: "border-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-lg mb-4">
            <Pill className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PharmChain</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Auth Method Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setAuthMethod("traditional")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMethod === "traditional"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("wallet")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMethod === "wallet"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Wallet size={16} />
                <span>Web3 Wallet</span>
              </div>
            </button>
          </div>

          {/* Traditional Login Form */}
          {authMethod === "traditional" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${role.activeBg} ${role.activeBorder} ${role.textColor}`
                            : `${role.bgColor} ${role.borderColor} ${role.textColor} ${role.hoverBg}`
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Icon size={20} />
                          <span className="text-xs font-medium">
                            {role.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* Web3 Wallet Login */}
          {authMethod === "wallet" && (
            <div className="space-y-6">
              {/* Role Selection for Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${role.activeBg} ${role.activeBorder} ${role.textColor}`
                            : `${role.bgColor} ${role.borderColor} ${role.textColor} ${role.hoverBg}`
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Icon size={20} />
                          <span className="text-xs font-medium">
                            {role.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Wallet className="text-blue-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">
                      Connect Your Wallet
                    </h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Sign in securely using your Web3 wallet (MetaMask,
                      WalletConnect, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Wallet Button */}
              <button
                type="button"
                onClick={handleWalletLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet size={20} />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>

              {/* Alternative Login */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Don't have a Web3 wallet?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMethod("traditional")}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Use email & password
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Secure blockchain-based prescription management
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Web3Provider>
      <LoginPageContent />
    </Web3Provider>
  );
}
