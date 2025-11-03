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
  Moon,
  Sun,
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
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();

  // Sample notifications - replace with real data
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: "New Prescription",
      message: "A new prescription has been assigned to you",
      time: "5 minutes ago",
      read: false,
      type: "info",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Paracetamol stock is running low",
      time: "1 hour ago",
      read: false,
      type: "warning",
    },
    {
      id: 3,
      title: "Order Completed",
      message: "Patient order #1234 has been completed",
      time: "2 hours ago",
      read: false,
      type: "success",
    },
  ]);

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileMenuOpen && !target.closest(".profile-menu-container")) {
        setProfileMenuOpen(false);
      }
      if (
        notificationMenuOpen &&
        !target.closest(".notification-menu-container")
      ) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen, notificationMenuOpen]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      toast.success("Dark mode enabled");
    } else {
      document.documentElement.classList.remove("dark");
      toast.success("Light mode enabled");
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 backdrop-blur-xl transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex flex-col border-r border-gray-200 dark:border-gray-700`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-105 transition-transform">
              <Pill className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PharmChain
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Medical System
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10 flex items-center space-x-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${roleColorClass}`}
              >
                <RoleIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize font-medium">
                  {role}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="mt-4">
            <button
              onClick={handleWalletAction}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isConnected
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Wallet size={18} />
              <span className="flex-1 text-left truncate">
                {isConnected && address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      item.active
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div
                      className={`${
                        item.active
                          ? ""
                          : "group-hover:scale-110 transition-transform"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Link
            href={`/dashboard/${role}/settings`}
            className="group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <div className="group-hover:scale-110 transition-transform">
              <Settings size={20} />
            </div>
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-900/20 transition-all"
          >
            <div className="group-hover:scale-110 transition-transform">
              <LogOut size={20} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {user?.firstName}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search patients, drugs..."
                  className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                />
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notifications */}
              <div className="relative notification-menu-container">
                <button
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className="relative p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationMenuOpen && (
                  <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 z-50 backdrop-blur-xl max-h-[500px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            setNotificationsList(
                              notificationsList.map((n) => ({
                                ...n,
                                read: true,
                              }))
                            );
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-[400px]">
                      {notificationsList.length > 0 ? (
                        notificationsList.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                              !notification.read
                                ? "bg-blue-50/50 dark:bg-blue-900/10"
                                : ""
                            }`}
                            onClick={() => {
                              setNotificationsList(
                                notificationsList.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, read: true }
                                    : n
                                )
                              );
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.type === "success"
                                    ? "bg-green-500"
                                    : notification.type === "warning"
                                    ? "bg-yellow-500"
                                    : notification.type === "error"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }`}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <Bell
                            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                            size={48}
                          />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No notifications yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium w-full text-center">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-3 pl-3 pr-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColorClass}`}
                  >
                    <RoleIcon size={18} />
                  </div>
                  <ChevronDown
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 backdrop-blur-xl">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                        {role} Account
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/${role}/profile`}
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User size={18} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href={`/dashboard/${role}/settings`}
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-all"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1920px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
