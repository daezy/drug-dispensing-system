// Forgot password functionality
let currentResetStep = 1;
let resetEmail = "";

// Initialize forgot password functionality
document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const newPasswordForm = document.getElementById("newPasswordForm");
  const newPasswordInput = document.getElementById("newPassword");

  // Handle forgot password form submission
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("resetEmail").value;

      if (!isValidEmail(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
      }

      await sendPasswordReset(email);
    });
  }

  // Handle new password form submission
  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword =
        document.getElementById("confirmNewPassword").value;

      if (!validateNewPassword(newPassword, confirmPassword)) {
        return;
      }

      await updatePassword(newPassword);
    });
  }

  // Password strength checking for new password
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", function () {
      checkNewPasswordStrength(this.value);
      validatePasswordRequirements(this.value);
    });
  }

  // Confirm password checking
  const confirmPasswordInput = document.getElementById("confirmNewPassword");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", function () {
      const password = newPasswordInput.value;
      const confirmPassword = this.value;
      const errorElement = document.getElementById("passwordMatchError");

      if (confirmPassword) {
        if (password !== confirmPassword) {
          this.classList.add("border-red-500");
          this.classList.remove("border-gray-300");
          errorElement.classList.remove("hidden");
        } else {
          this.classList.remove("border-red-500");
          this.classList.add("border-gray-300");
          errorElement.classList.add("hidden");
        }
      }
    });
  }

  // Check if we're coming from a reset link
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (token) {
    // Show reset password form directly
    showResetStep(3);
  }
});

// Send password reset email
async function sendPasswordReset(email) {
  const resetBtn = document.querySelector(
    '#forgotPasswordForm button[type="submit"]'
  );
  const btnText = document.getElementById("resetBtnText");
  const loader = document.getElementById("resetLoader");

  try {
    // Show loading state
    btnText.textContent = "Sending...";
    loader.classList.remove("hidden");
    resetBtn.disabled = true;

    // Simulate API call
    await simulatePasswordReset(email);

    resetEmail = email;
    document.getElementById("sentToEmail").textContent = email;

    showNotification("Password reset instructions sent!", "success");
    showResetStep(2);

    // Start resend timer
    startPasswordResetTimer();
  } catch (error) {
    showNotification(error.message || "Failed to send reset email", "error");

    // Reset button state
    btnText.textContent = "Send Reset Instructions";
    loader.classList.add("hidden");
    resetBtn.disabled = false;
  }
}

// Simulate password reset API call
async function simulatePasswordReset(email) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock validation - check if email exists in system
  const registeredEmails = [
    "patient@test.com",
    "doctor@test.com",
    "pharmacist@test.com",
    "admin@test.com",
    "john.doe@email.com",
    "mary.johnson@email.com",
  ];

  if (!registeredEmails.includes(email)) {
    throw new Error("Email address not found in our system");
  }

  return { success: true };
}

// Show specific reset step
function showResetStep(step) {
  currentResetStep = step;

  // Hide all steps
  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.add("hidden");
  });

  // Show current step
  const stepContents = {
    1: "emailStep",
    2: "checkEmailStep",
    3: "resetPasswordStep",
    4: "successStep",
  };

  const stepElement = document.getElementById(stepContents[step]);
  if (stepElement) {
    stepElement.classList.remove("hidden");
  }
}

// Go back to email entry
function goBackToEmail() {
  showResetStep(1);

  // Reset form
  const resetForm = document.getElementById("forgotPasswordForm");
  if (resetForm) {
    resetForm.reset();
  }

  // Reset button state
  const resetBtn = document.querySelector(
    '#forgotPasswordForm button[type="submit"]'
  );
  const btnText = document.getElementById("resetBtnText");
  const loader = document.getElementById("resetLoader");

  if (resetBtn && btnText && loader) {
    btnText.textContent = "Send Reset Instructions";
    loader.classList.add("hidden");
    resetBtn.disabled = false;
  }
}

// Open email client
function openEmailClient() {
  // Try to open default email client
  window.open("mailto:", "_blank");
  showNotification("Opening your email client...", "info");
}

// Resend reset email
async function resendResetEmail() {
  if (!resetEmail) {
    showNotification("Email address not found", "error");
    return;
  }

  try {
    await simulatePasswordReset(resetEmail);
    showNotification("Reset email sent again", "success");
    startPasswordResetTimer();
  } catch (error) {
    showNotification("Failed to resend email", "error");
  }
}

// Start resend timer
function startPasswordResetTimer() {
  const timerElement = document.getElementById("timer");
  const resendTimerElement = document.getElementById("resendTimer");
  const resendButton = document.querySelector(
    'button[onclick="resendResetEmail()"]'
  );

  if (!timerElement || !resendTimerElement || !resendButton) return;

  let timeLeft = 60;

  resendTimerElement.classList.remove("hidden");
  resendButton.disabled = true;
  resendButton.classList.add("opacity-50", "cursor-not-allowed");

  const countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      resendTimerElement.classList.add("hidden");
      resendButton.disabled = false;
      resendButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }, 1000);
}

// Password visibility toggle functions
function toggleNewPassword() {
  const passwordInput = document.getElementById("newPassword");
  const toggleIcon = document.getElementById("newPasswordToggle");

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

function toggleConfirmPassword() {
  const passwordInput = document.getElementById("confirmNewPassword");
  const toggleIcon = document.getElementById("confirmPasswordToggle");

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

// Password strength checker for new password
function checkNewPasswordStrength(password) {
  let strength = 0;
  const strengthBar = document.getElementById("newPasswordStrength");
  const strengthText = document.getElementById("newPasswordStrengthText");

  if (!strengthBar || !strengthText) return;

  if (!password) {
    strengthBar.style.width = "0%";
    strengthText.textContent = "Weak";
    strengthText.className = "text-xs whitespace-nowrap text-red-600";
    return;
  }

  // Check password criteria
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  // Update strength indicator
  const strengthLevels = [
    {
      text: "Very Weak",
      color: "bg-red-500",
      textColor: "text-red-600",
      width: "20%",
    },
    {
      text: "Weak",
      color: "bg-red-400",
      textColor: "text-red-600",
      width: "40%",
    },
    {
      text: "Fair",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      width: "60%",
    },
    {
      text: "Good",
      color: "bg-blue-500",
      textColor: "text-blue-600",
      width: "80%",
    },
    {
      text: "Strong",
      color: "bg-green-500",
      textColor: "text-green-600",
      width: "100%",
    },
  ];

  const level = strengthLevels[strength - 1] || strengthLevels[0];

  strengthBar.className = `h-full transition-all duration-300 ${level.color}`;
  strengthBar.style.width = level.width;
  strengthText.textContent = level.text;
  strengthText.className = `text-xs whitespace-nowrap ${level.textColor}`;
}

// Validate password requirements
function validatePasswordRequirements(password) {
  const requirements = {
    "req-length": password.length >= 8,
    "req-lowercase": /[a-z]/.test(password),
    "req-uppercase": /[A-Z]/.test(password),
    "req-number": /[0-9]/.test(password),
    "req-special": /[^A-Za-z0-9]/.test(password),
  };

  Object.keys(requirements).forEach((reqId) => {
    const element = document.getElementById(reqId);
    if (element) {
      if (requirements[reqId]) {
        element.classList.remove("fa-times", "text-red-500");
        element.classList.add("fa-check", "text-green-500");
      } else {
        element.classList.remove("fa-check", "text-green-500");
        element.classList.add("fa-times", "text-red-500");
      }
    }
  });
}

// Validate new password
function validateNewPassword(newPassword, confirmPassword) {
  if (!newPassword) {
    showNotification("Please enter a new password", "error");
    return false;
  }

  if (newPassword.length < 8) {
    showNotification("Password must be at least 8 characters long", "error");
    return false;
  }

  if (!/[a-z]/.test(newPassword)) {
    showNotification(
      "Password must contain at least one lowercase letter",
      "error"
    );
    return false;
  }

  if (!/[A-Z]/.test(newPassword)) {
    showNotification(
      "Password must contain at least one uppercase letter",
      "error"
    );
    return false;
  }

  if (!/[0-9]/.test(newPassword)) {
    showNotification("Password must contain at least one number", "error");
    return false;
  }

  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    showNotification(
      "Password must contain at least one special character",
      "error"
    );
    return false;
  }

  if (newPassword !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return false;
  }

  return true;
}

// Update password
async function updatePassword(newPassword) {
  const updateBtn = document.querySelector(
    '#newPasswordForm button[type="submit"]'
  );
  const btnText = document.getElementById("updateBtnText");
  const loader = document.getElementById("updateLoader");

  try {
    // Show loading state
    btnText.textContent = "Updating...";
    loader.classList.remove("hidden");
    updateBtn.disabled = true;

    // Simulate API call
    await simulatePasswordUpdate(newPassword);

    showNotification("Password updated successfully!", "success");
    showResetStep(4);
  } catch (error) {
    showNotification(error.message || "Failed to update password", "error");

    // Reset button state
    btnText.textContent = "Update Password";
    loader.classList.add("hidden");
    updateBtn.disabled = false;
  }
}

// Simulate password update API call
async function simulatePasswordUpdate(newPassword) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock successful update
  return { success: true };
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
