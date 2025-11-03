"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Activity,
  TrendingUp,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Database,
  Globe,
  Zap,
  Eye,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  systemUptime: string;
  pendingApprovals: number;
}

interface SystemMetric {
  name: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  status: "healthy" | "warning" | "critical";
}

interface RecentActivity {
  id: string;
  type: "user" | "system" | "security" | "transaction";
  description: string;
  user: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface UserOverview {
  role: string;
  count: number;
  percentage: number;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1247,
    activeUsers: 892,
    systemUptime: "99.9%",
    pendingApprovals: 7,
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      name: "API Response Time",
      value: "145ms",
      change: "-12%",
      trend: "down",
      status: "healthy",
    },
    {
      name: "Database Performance",
      value: "94%",
      change: "+2%",
      trend: "up",
      status: "healthy",
    },
    {
      name: "Transaction Volume",
      value: "2,847",
      change: "+18%",
      trend: "up",
      status: "healthy",
    },
    {
      name: "Error Rate",
      value: "0.02%",
      change: "+0.01%",
      trend: "up",
      status: "warning",
    },
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "user",
      description: "New doctor registration approved",
      user: "Dr. Sarah Johnson",
      timestamp: "2 minutes ago",
      severity: "low",
    },
    {
      id: "2",
      type: "security",
      description: "Multiple failed login attempts detected",
      user: "Security System",
      timestamp: "15 minutes ago",
      severity: "medium",
    },
    {
      id: "3",
      type: "system",
      description: "Database backup completed successfully",
      user: "System",
      timestamp: "1 hour ago",
      severity: "low",
    },
    {
      id: "4",
      type: "transaction",
      description: "High transaction volume detected",
      user: "Payment Gateway",
      timestamp: "2 hours ago",
      severity: "medium",
    },
    {
      id: "5",
      type: "user",
      description: "Pharmacist account suspended",
      user: "Admin",
      timestamp: "3 hours ago",
      severity: "high",
    },
  ]);

  const [userOverview, setUserOverview] = useState<UserOverview[]>([
    { role: "Patients", count: 847, percentage: 68, color: "bg-blue-500" },
    { role: "Doctors", count: 186, percentage: 15, color: "bg-green-500" },
    { role: "Pharmacists", count: 142, percentage: 11, color: "bg-purple-500" },
    { role: "Admins", count: 72, percentage: 6, color: "bg-red-500" },
  ]);

  const { user } = useAuth();

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "user":
        return Users;
      case "system":
        return Server;
      case "security":
        return Shield;
      case "transaction":
        return Activity;
      default:
        return Activity;
    }
  };

  const getActivityColor = (severity: RecentActivity["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getMetricStatus = (status: SystemMetric["status"]) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (trend: SystemMetric["trend"]) => {
    switch (trend) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingUp; // Will be rotated via CSS
      default:
        return Activity;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Admin Dashboard" role="admin">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">System Overview</h2>
                <p className="text-red-100">
                  Monitoring {stats.totalUsers.toLocaleString()} users across
                  the platform
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Shield size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +8.2% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <Activity size={12} className="mr-1" />
                    {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                    online
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    System Uptime
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.systemUptime}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <CheckCircle size={12} className="mr-1" />
                    Last 30 days
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Server className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingApprovals}
                  </p>
                  <p className="text-xs text-yellow-600 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemMetrics.map((metric) => {
                const TrendIcon = getTrendIcon(metric.trend);
                const statusColor = getMetricStatus(metric.status);

                return (
                  <div key={metric.name} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        {metric.name}
                      </p>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          metric.status === "healthy"
                            ? "bg-green-500"
                            : metric.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <p className={`text-xl font-bold ${statusColor}`}>
                      {metric.value}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendIcon
                        size={12}
                        className={`mr-1 ${
                          metric.trend === "down"
                            ? "rotate-180 text-red-600"
                            : "text-green-600"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          metric.trend === "down"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  User Distribution
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userOverview.map((userType) => (
                    <div
                      key={userType.role}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded ${userType.color}`}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">
                          {userType.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {userType.count.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userType.percentage}%
                          </p>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${userType.color}`}
                            style={{ width: `${userType.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Growth Rate
                      </p>
                      <p className="text-xs text-blue-700">
                        Monthly user acquisition
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-900">+12.4%</p>
                      <p className="text-xs text-blue-700">vs last month</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Activity
                  </h3>
                  <button className="text-primary hover:text-primary-dark text-sm font-medium">
                    View All Logs
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.severity);

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.user}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.timestamp}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
                          >
                            {activity.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Administrative Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Users
                    className="text-blue-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Manage Users
                  </p>
                  <p className="text-xs text-gray-600">
                    Add, edit, or remove users
                  </p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Settings
                    className="text-green-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    System Settings
                  </p>
                  <p className="text-xs text-gray-600">
                    Configure system parameters
                  </p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <BarChart3
                    className="text-purple-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Generate Reports
                  </p>
                  <p className="text-xs text-gray-600">Create system reports</p>
                </div>
              </button>

              <button className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors group">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white">
                  <Database
                    className="text-red-600 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Database Backup
                  </p>
                  <p className="text-xs text-gray-600">Manage data backups</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
