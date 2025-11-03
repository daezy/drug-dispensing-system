"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import {
  Pill,
  Menu,
  X,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Shield,
  Users,
  Box,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: ReactNode;
  title: String;
  role: "doctor" | "patient" | "pharmacist" | "admin";
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  active?: boolean;
}

export default function DashboardLayout({
  children,
  title,
  role,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const { user, logout } = useAuth();
  const router = useRouter();

  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
      toast.success("Wallet disconnected");
    } else {
      open();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getRoleIcon = () => {
    switch (role) {
      case "doctor":
        return Shield;
      case "patient":
        return Users;
      case "pharmacist":
        return Pill;
      case "admin":
        return Box;
      default:
        return User;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case "doctor":
        return "text-green-600 bg-green-100";
      case "patient":
        return "text-blue-600 bg-blue-100";
      case "pharmacist":
        return "text-purple-600 bg-purple-100";
      case "admin":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        name: "Dashboard",
        href: `/dashboard/${role}`,
        icon: Box,
        active: true,
      },
    ];

    switch (role) {
      case "doctor":
        return [
          ...baseItems,
          {
            name: "Patients",
            href: `/dashboard/${role}/patients`,
            icon: Users,
          },
          {
            name: "Prescriptions",
            href: `/dashboard/${role}/prescriptions`,
            icon: Pill,
          },
          {
            name: "Medical History",
            href: `/dashboard/${role}/history`,
            icon: Shield,
          },
        ];

      case "patient":
        return [
          ...baseItems,
          {
            name: "My Prescriptions",
            href: `/dashboard/${role}/prescriptions`,
            icon: Pill,
          },
          {
            name: "Medical History",
            href: `/dashboard/${role}/history`,
            icon: Shield,
          },
          { name: "Doctors", href: `/dashboard/${role}/doctors`, icon: Users },
        ];

      case "pharmacist":
        return [
          ...baseItems,
          {
            name: "Prescriptions",
            href: `/dashboard/${role}/prescriptions`,
            icon: Pill,
          },
          {
            name: "Inventory",
            href: `/dashboard/${role}/inventory`,
            icon: Box,
          },
          {
            name: "Patients",
            href: `/dashboard/${role}/patients`,
            icon: Users,
          },
        ];

      case "admin":
        return [
          ...baseItems,
          { name: "Users", href: `/dashboard/${role}/users`, icon: Users },
          { name: "System", href: `/dashboard/${role}/system`, icon: Settings },
          { name: "Reports", href: `/dashboard/${role}/reports`, icon: Shield },
        ];

      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();
  const RoleIcon = getRoleIcon();
  const roleColorClass = getRoleColor();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Pill className="text-white" size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900">PharmChain</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${roleColorClass}`}
            >
              <RoleIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="mt-4">
            <button
              onClick={handleWalletAction}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnected
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Wallet size={16} />
              <span className="flex-1 text-left truncate">
                {isConnected && address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings */}
        <div className="p-6 border-t border-gray-200">
          <Link
            href={`/dashboard/${role}/settings`}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${roleColorClass}`}
                  >
                    <RoleIcon size={16} />
                  </div>
                  <ChevronDown size={16} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href={`/dashboard/${role}/profile`}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href={`/dashboard/${role}/settings`}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
