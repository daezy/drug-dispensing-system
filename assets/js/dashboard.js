// Dashboard functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthentication();

  // Initialize dashboard features
  initializeDashboard();

  // Set up periodic updates
  setPeriodicUpdates();
});

// Check if user is authenticated
function checkAuthentication() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated");
  const userRole = sessionStorage.getItem("userRole");

  if (!isAuthenticated || !userRole) {
    // Redirect to login if not authenticated
    window.location.href = "../index.html";
    return;
  }

  // Verify user is on correct dashboard
  const currentPage = window.location.pathname.toLowerCase();
  const expectedPage = `${userRole}-dashboard.html`;

  if (!currentPage.includes(expectedPage)) {
    // Redirect to correct dashboard
    redirectToDashboard(userRole);
  }
}

// Initialize dashboard
function initializeDashboard() {
  const userRole = sessionStorage.getItem("userRole");
  const userEmail = sessionStorage.getItem("userEmail");
  const walletConnected = sessionStorage.getItem("walletConnected");

  // Update user info in header
  updateUserInfo(userRole, userEmail);

  // Update wallet status
  if (walletConnected) {
    updateWalletStatus(true);
  }

  // Load role-specific data
  loadDashboardData(userRole);

  // Set up event listeners
  setupEventListeners();
}

// Update user information in header
function updateUserInfo(role, email) {
  const userNameElement = document.querySelector(
    ".text-sm.font-medium.text-gray-900"
  );
  const userIdElement = document.querySelector(".text-xs.text-gray-600");

  if (userNameElement && userIdElement) {
    // Generate display name from email or use defaults
    const displayNames = {
      patient: "John Doe",
      doctor: "Dr. Sarah Smith",
      pharmacist: "Michael Johnson",
      admin: "Admin User",
    };

    const userIds = {
      patient: "P-2024-001",
      doctor: "MD-2024-789",
      pharmacist: "PH-2024-456",
      admin: "ADM-2024-123",
    };

    userNameElement.textContent = displayNames[role] || "User";
    userIdElement.textContent = `${
      role.charAt(0).toUpperCase() + role.slice(1)
    } ID: ${userIds[role] || "N/A"}`;
  }
}

// Update wallet connection status
function updateWalletStatus(connected) {
  const walletStatusElements = document.querySelectorAll(".text-accent");

  walletStatusElements.forEach((element) => {
    if (
      element.textContent.includes("Blockchain Connected") ||
      element.textContent.includes("Secure & Transparent")
    ) {
      const statusIcon = element.querySelector("i");
      const statusText = element.querySelector("span") || element;

      if (connected) {
        if (statusIcon) {
          statusIcon.className = "fas fa-shield-alt text-accent";
        }
        statusText.textContent = "Blockchain Connected";
        element.classList.add("text-accent");
        element.classList.remove("text-gray-600");
      } else {
        if (statusIcon) {
          statusIcon.className = "fas fa-exclamation-triangle text-orange-500";
        }
        statusText.textContent = "Wallet Disconnected";
        element.classList.add("text-orange-500");
        element.classList.remove("text-accent");
      }
    }
  });
}

// Load dashboard data based on role
async function loadDashboardData(role) {
  try {
    showLoader("Loading dashboard data...");

    // Simulate loading data
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Load role-specific data
    switch (role) {
      case "patient":
        await loadPatientData();
        break;
      case "doctor":
        await loadDoctorData();
        break;
      case "pharmacist":
        await loadPharmacistData();
        break;
      case "admin":
        await loadAdminData();
        break;
    }

    hideLoader();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    hideLoader();
    showNotification("Failed to load dashboard data", "error");
  }
}

// Load patient-specific data
async function loadPatientData() {
  // Simulate updating patient stats
  updateStatCard("Active Prescriptions", 3, "↑ 1 new this week");
  updateStatCard("Medications Due", 2, "⏰ Today");
  updateStatCard("Refills Available", 1, "✓ Ready");
  updateStatCard("Blockchain Transactions", 47, "🔗 Verified");

  // Update recent activity
  updateRecentActivity([
    {
      type: "success",
      message: "Prescription filled",
      details: "Lisinopril 10mg • 2 hours ago",
    },
    {
      type: "info",
      message: "New prescription",
      details: "From Dr. Smith • Yesterday",
    },
    {
      type: "blockchain",
      message: "Blockchain verified",
      details: "Transaction confirmed • 2 days ago",
    },
  ]);
}

// Load doctor-specific data
async function loadDoctorData() {
  // Simulate updating doctor stats
  updateStatCard("Today's Patients", 12, "↑ 2 more than yesterday");
  updateStatCard("Prescriptions Written", 28, "✓ This week");
  updateStatCard("Pending Approvals", 3, "⏰ Requires attention");
  updateStatCard("Blockchain Records", 156, "🔗 All verified");
}

// Load pharmacist-specific data
async function loadPharmacistData() {
  // Simulate updating pharmacist stats
  updateStatCard("Prescriptions Filled", 45, "↑ 5 more than yesterday");
  updateStatCard("Pending Orders", 8, "⏰ Requires processing");
  updateStatCard("Inventory Items", 1247, "✓ Stock levels good");
  updateStatCard("Verified Transactions", 203, "🔗 All blockchain verified");
}

// Load admin-specific data
async function loadAdminData() {
  // Simulate updating admin stats
  updateStatCard("Total Users", 1250, "↑ 15 new this week");
  updateStatCard("System Health", "99.9%", "✓ All systems operational");
  updateStatCard("Daily Transactions", 387, "↑ 12% from yesterday");
  updateStatCard("Blockchain Integrity", "100%", "🔗 All blocks verified");
}

// Update stat card values
function updateStatCard(title, value, description) {
  const cards = document.querySelectorAll(".bg-white.rounded-xl.shadow-sm");

  cards.forEach((card) => {
    const titleElement = card.querySelector(
      ".text-sm.font-medium.text-gray-600"
    );
    if (titleElement && titleElement.textContent.includes(title)) {
      const valueElement = card.querySelector(
        ".text-2xl.font-bold.text-gray-900"
      );
      const descElement = card.querySelector(".mt-4 .text-sm");

      if (valueElement) {
        // Add animation
        valueElement.style.opacity = "0.5";
        setTimeout(() => {
          valueElement.textContent = value;
          valueElement.style.opacity = "1";
        }, 300);
      }

      if (descElement) {
        descElement.innerHTML = description;
      }
    }
  });
}

// Update recent activity
function updateRecentActivity(activities) {
  const activityContainer = document.querySelector(".space-y-4");

  if (activityContainer && activities) {
    // Clear existing activities
    activityContainer.innerHTML = "";

    activities.forEach((activity) => {
      const activityElement = document.createElement("div");
      activityElement.className = "flex items-start space-x-3";

      const colorClasses = {
        success: "bg-green-500",
        info: "bg-blue-500",
        warning: "bg-yellow-500",
        error: "bg-red-500",
        blockchain: "bg-purple-500",
      };

      activityElement.innerHTML = `
                <div class="w-2 h-2 ${
                  colorClasses[activity.type] || "bg-gray-500"
                } rounded-full mt-2"></div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${
                      activity.message
                    }</p>
                    <p class="text-xs text-gray-600">${activity.details}</p>
                </div>
            `;

      activityContainer.appendChild(activityElement);
    });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Set up logout functionality
  const logoutButtons = document.querySelectorAll('button[onclick="logout()"]');
  logoutButtons.forEach((button) => {
    button.addEventListener("click", logout);
  });

  // Set up quick action buttons
  setupQuickActions();

  // Set up real-time updates
  setupRealTimeUpdates();
}

// Set up quick actions
function setupQuickActions() {
  const quickActionButtons = document.querySelectorAll(
    ".bg-blue-50, .bg-green-50, .bg-purple-50, .bg-orange-50"
  );

  quickActionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const actionText = this.querySelector("span").textContent;
      showNotification(`${actionText} feature coming soon!`, "info");
    });
  });
}

// Set up real-time updates
function setupRealTimeUpdates() {
  // Simulate real-time blockchain updates
  setInterval(() => {
    updateBlockchainStatus();
  }, 30000); // Update every 30 seconds

  // Simulate periodic data refresh
  setInterval(() => {
    refreshDashboardData();
  }, 60000); // Refresh every minute
}

// Update blockchain connection status
function updateBlockchainStatus() {
  const walletConnected = sessionStorage.getItem("walletConnected");

  if (walletConnected) {
    // Simulate occasional connection check
    const isConnected = Math.random() > 0.1; // 90% success rate
    updateWalletStatus(isConnected);

    if (!isConnected) {
      showNotification(
        "Blockchain connection lost. Please reconnect your wallet.",
        "warning"
      );
    }
  }
}

// Refresh dashboard data periodically
async function refreshDashboardData() {
  const userRole = sessionStorage.getItem("userRole");

  try {
    // Silently refresh data
    await loadDashboardData(userRole);

    // Update last refresh time
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    // Add refresh indicator if needed
    const header = document.querySelector("header");
    if (header) {
      const refreshIndicator =
        document.getElementById("refreshIndicator") ||
        document.createElement("div");
      refreshIndicator.id = "refreshIndicator";
      refreshIndicator.className =
        "text-xs text-gray-500 absolute top-2 right-2";
      refreshIndicator.textContent = `Last updated: ${timeString}`;

      if (!document.getElementById("refreshIndicator")) {
        header.style.position = "relative";
        header.appendChild(refreshIndicator);
      }
    }
  } catch (error) {
    console.error("Error refreshing dashboard:", error);
  }
}

// Set up periodic updates
function setPeriodicUpdates() {
  // Update time displays every minute
  setInterval(updateTimeDisplays, 60000);

  // Check session validity every 5 minutes
  setInterval(checkSessionValidity, 300000);
}

// Update time displays
function updateTimeDisplays() {
  const timeElements = document.querySelectorAll(".time-display");
  const now = new Date();

  timeElements.forEach((element) => {
    element.textContent = now.toLocaleString();
  });
}

// Check session validity
function checkSessionValidity() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated");
  const loginTime = sessionStorage.getItem("loginTime");

  if (!isAuthenticated) {
    logout();
    return;
  }

  // Check if session is older than 24 hours
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime);
    const now = Date.now();
    const sessionAge = now - loginTimestamp;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxSessionAge) {
      showNotification(
        "Your session has expired. Please log in again.",
        "warning"
      );
      setTimeout(() => {
        logout();
      }, 3000);
    }
  }
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
  const dashboardUrls = {
    patient: "./patient-dashboard.html",
    doctor: "./doctor-dashboard.html",
    pharmacist: "./pharmacist-dashboard.html",
    admin: "./admin-dashboard.html",
  };

  const url = dashboardUrls[role];
  if (url) {
    window.location.href = url;
  }
}

// Logout functionality
function logout() {
  // Clear all session data
  sessionStorage.clear();

  // Show logout notification
  showNotification("Logged out successfully", "success");

  // Redirect to login page
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1000);
}

// Utility functions
function showLoader(message = "Loading...") {
  const loader = document.createElement("div");
  loader.id = "globalLoader";
  loader.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  loader.innerHTML = `
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
            <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
            <span class="text-gray-700">${message}</span>
        </div>
    `;
  document.body.appendChild(loader);
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) {
    loader.remove();
  }
}

function showNotification(message, type = "info") {
  const existingNotification = document.getElementById("notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.id = "notification";
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  notification.className += ` ${colors[type]}`;
  notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  setTimeout(() => {
    if (notification && notification.parentElement) {
      notification.classList.add("translate-x-full");
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}
