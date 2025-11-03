// Authentication and login functionality
let selectedRole = "";
let isWalletConnected = false;

// Role selection functionality
function selectRole(role) {
  selectedRole = role;

  // Remove active class from all role buttons
  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.classList.remove("border-primary", "bg-primary", "bg-opacity-10");
    btn.classList.add("border-gray-200");
    const icon = btn.querySelector("i");
    const text = btn.querySelector("span");
    icon.classList.remove("text-primary");
    icon.classList.add("text-gray-400");
    text.classList.remove("text-primary");
    text.classList.add("text-gray-700");
  });

  // Add active class to selected role button
  const selectedBtn = document.querySelector(`[data-role="${role}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove("border-gray-200");
    selectedBtn.classList.add("border-primary", "bg-primary", "bg-opacity-10");
    const icon = selectedBtn.querySelector("i");
    const text = selectedBtn.querySelector("span");
    icon.classList.remove("text-gray-400");
    icon.classList.add("text-primary");
    text.classList.remove("text-gray-700");
    text.classList.add("text-primary");
  }

  // Store selected role in session storage
  sessionStorage.setItem("selectedRole", role);
}

// Password visibility toggle
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("passwordToggle");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
}

// Wallet connection functionality
async function connectWallet() {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== "undefined") {
      showLoader("Connecting to wallet...");

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        isWalletConnected = true;
        const account = accounts[0];

        // Show success notification
        showNotification("Wallet connected successfully!", "success");

        // Update UI to show connected state
        updateWalletUI(account);

        // Automatically fill email if not provided
        const emailInput = document.getElementById("email");
        if (!emailInput.value) {
          emailInput.value = `${account.substring(0, 6)}@wallet.local`;
        }

        hideLoader();
      }
    } else {
      showNotification(
        "Please install MetaMask or another Web3 wallet",
        "error"
      );
    }
  } catch (error) {
    console.error("Wallet connection error:", error);
    showNotification("Failed to connect wallet. Please try again.", "error");
    hideLoader();
  }
}

// Update wallet UI when connected
function updateWalletUI(account) {
  const walletBtn = document.querySelector('button[onclick="connectWallet()"]');
  if (walletBtn) {
    walletBtn.innerHTML = `
            <i class="fas fa-check-circle text-accent"></i>
            <span>Wallet Connected</span>
            <span class="text-xs">${account.substring(
              0,
              6
            )}...${account.substring(account.length - 4)}</span>
        `;
    walletBtn.classList.remove(
      "border-gray-300",
      "text-gray-700",
      "hover:border-blockchain",
      "hover:text-blockchain"
    );
    walletBtn.classList.add(
      "border-accent",
      "text-accent",
      "bg-accent",
      "bg-opacity-10"
    );
  }
}

// Login form submission
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Validate form
      if (!selectedRole) {
        showNotification("Please select your role first", "error");
        return;
      }

      if (!email || !password) {
        showNotification("Please fill in all required fields", "error");
        return;
      }

      // Validate email format
      if (!isValidEmail(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
      }

      await handleLogin(email, password, selectedRole);
    });
  }

  // Load saved role from session storage
  const savedRole = sessionStorage.getItem("selectedRole");
  if (savedRole) {
    selectRole(savedRole);
  }
});

// Handle login process
async function handleLogin(email, password, role) {
  const loginBtn = document.querySelector('button[type="submit"]');
  const btnText = document.getElementById("loginBtnText");
  const loader = document.getElementById("loginLoader");

  try {
    // Show loading state
    btnText.textContent = "Signing In...";
    loader.classList.remove("hidden");
    loginBtn.disabled = true;

    // Simulate API call (replace with actual authentication)
    const loginResult = await simulateLogin(email, password, role);

    if (loginResult.success) {
      // Store user data
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("isAuthenticated", "true");

      if (isWalletConnected) {
        sessionStorage.setItem("walletConnected", "true");
      }

      showNotification("Login successful! Redirecting...", "success");

      // Redirect based on role
      setTimeout(() => {
        redirectToDashboard(role);
      }, 1500);
    } else {
      throw new Error(loginResult.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    showNotification(
      error.message || "Login failed. Please try again.",
      "error"
    );

    // Reset button state
    btnText.textContent = "Sign In";
    loader.classList.add("hidden");
    loginBtn.disabled = false;
  }
}

// Simulate login API call
async function simulateLogin(email, password, role) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock validation (replace with actual API)
  const validCredentials = {
    "patient@test.com": { password: "password123", role: "patient" },
    "doctor@test.com": { password: "password123", role: "doctor" },
    "pharmacist@test.com": { password: "password123", role: "pharmacist" },
    "admin@test.com": { password: "password123", role: "admin" },
  };

  const user = validCredentials[email];

  if (user && user.password === password && user.role === role) {
    return { success: true, user: { email, role } };
  } else {
    return {
      success: false,
      message: "Invalid credentials or role mismatch",
    };
  }
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
  const dashboardUrls = {
    patient: "./pages/patient-dashboard.html",
    doctor: "./pages/doctor-dashboard.html",
    pharmacist: "./pages/pharmacist-dashboard.html",
    admin: "./pages/admin-dashboard.html",
  };

  const url = dashboardUrls[role];
  if (url) {
    window.location.href = url;
  } else {
    console.error("Unknown role:", role);
    showNotification("Unknown role. Please contact support.", "error");
  }
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showLoader(message = "Loading...") {
  // Create and show loader overlay
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
  // Remove existing notification
  const existingNotification = document.getElementById("notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification
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

  // Animate in
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification && notification.parentElement) {
      notification.classList.add("translate-x-full");
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already authenticated
  const isAuthenticated = sessionStorage.getItem("isAuthenticated");
  const userRole = sessionStorage.getItem("userRole");

  if (
    isAuthenticated &&
    userRole &&
    window.location.pathname.includes("index.html")
  ) {
    // Redirect to dashboard if already logged in
    redirectToDashboard(userRole);
  }
});
