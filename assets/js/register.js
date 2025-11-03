// Registration functionality
let currentStep = 1;
let selectedRegistrationRole = "";
let registrationData = {};

// Step management
function nextStep() {
  if (currentStep < 3) {
    document
      .getElementById(`step${currentStep}`)
      .classList.remove("bg-primary", "text-white");
    document
      .getElementById(`step${currentStep}`)
      .classList.add("bg-accent", "text-white");

    currentStep++;

    document
      .getElementById(`step${currentStep}`)
      .classList.remove("bg-gray-300", "text-gray-600");
    document
      .getElementById(`step${currentStep}`)
      .classList.add("bg-primary", "text-white");

    // Update progress bar
    if (currentStep === 2) {
      document.getElementById("progress1").classList.remove("bg-gray-300");
      document.getElementById("progress1").classList.add("bg-accent");
    } else if (currentStep === 3) {
      document.getElementById("progress2").classList.remove("bg-gray-300");
      document.getElementById("progress2").classList.add("bg-primary");
    }

    showStep(currentStep);
  }
}

function previousStep() {
  if (currentStep > 1) {
    document
      .getElementById(`step${currentStep}`)
      .classList.remove("bg-primary", "text-white");
    document
      .getElementById(`step${currentStep}`)
      .classList.add("bg-gray-300", "text-gray-600");

    currentStep--;

    document
      .getElementById(`step${currentStep}`)
      .classList.remove("bg-accent", "text-white");
    document
      .getElementById(`step${currentStep}`)
      .classList.add("bg-primary", "text-white");

    // Update progress bar
    if (currentStep === 1) {
      document.getElementById("progress1").classList.remove("bg-accent");
      document.getElementById("progress1").classList.add("bg-gray-300");
    } else if (currentStep === 2) {
      document.getElementById("progress2").classList.remove("bg-primary");
      document.getElementById("progress2").classList.add("bg-gray-300");
    }

    showStep(currentStep);
  }
}

function showStep(step) {
  // Hide all step contents
  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.add("hidden");
  });

  // Show current step
  const stepContents = {
    1: "roleSelection",
    2: "registrationForm",
    3: "verificationStep",
  };

  document.getElementById(stepContents[step]).classList.remove("hidden");
}

// Role selection for registration
function selectRegistrationRole(role) {
  selectedRegistrationRole = role;

  // Remove active class from all role cards
  document.querySelectorAll(".role-card").forEach((card) => {
    card.classList.remove("border-primary", "shadow-lg");
  });

  // Add active class to selected card
  event.target
    .closest(".role-card")
    .classList.add("border-primary", "shadow-lg");

  // Store role and move to next step
  registrationData.role = role;

  setTimeout(() => {
    nextStep();
    updateRegistrationForm(role);
  }, 500);
}

// Update registration form based on role
function updateRegistrationForm(role) {
  const roleText = document.getElementById("selectedRoleText");
  const roleSpecificFields = document.getElementById("roleSpecificFields");

  roleText.textContent = role.charAt(0).toUpperCase() + role.slice(1);

  let specificFields = "";

  switch (role) {
    case "doctor":
      specificFields = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="licenseNumber" class="block text-sm font-medium text-gray-700 mb-2">Medical License Number</label>
                        <input type="text" id="licenseNumber" name="licenseNumber" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="MD-YYYY-XXXXX">
                    </div>
                    <div>
                        <label for="specialty" class="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                        <select id="specialty" name="specialty" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select Specialty</option>
                            <option value="general">General Practice</option>
                            <option value="cardiology">Cardiology</option>
                            <option value="dermatology">Dermatology</option>
                            <option value="endocrinology">Endocrinology</option>
                            <option value="neurology">Neurology</option>
                            <option value="psychiatry">Psychiatry</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label for="hospitalAffiliation" class="block text-sm font-medium text-gray-700 mb-2">Hospital/Clinic Affiliation</label>
                    <input type="text" id="hospitalAffiliation" name="hospitalAffiliation" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="Hospital or clinic name">
                </div>
            `;
      break;

    case "pharmacist":
      specificFields = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="pharmacyLicense" class="block text-sm font-medium text-gray-700 mb-2">Pharmacy License Number</label>
                        <input type="text" id="pharmacyLicense" name="pharmacyLicense" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="PH-YYYY-XXXXX">
                    </div>
                    <div>
                        <label for="pharmacyName" class="block text-sm font-medium text-gray-700 mb-2">Pharmacy Name</label>
                        <input type="text" id="pharmacyName" name="pharmacyName" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="Pharmacy name">
                    </div>
                </div>
                <div>
                    <label for="pharmacyAddress" class="block text-sm font-medium text-gray-700 mb-2">Pharmacy Address</label>
                    <textarea id="pharmacyAddress" name="pharmacyAddress" required rows="3"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Full pharmacy address"></textarea>
                </div>
            `;
      break;

    case "patient":
      specificFields = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="dateOfBirth" class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                    </div>
                    <div>
                        <label for="insuranceNumber" class="block text-sm font-medium text-gray-700 mb-2">Insurance Number (Optional)</label>
                        <input type="text" id="insuranceNumber" name="insuranceNumber"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="Insurance ID">
                    </div>
                </div>
                <div>
                    <label for="emergencyContact" class="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                    <input type="text" id="emergencyContact" name="emergencyContact" required
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="Emergency contact name and phone">
                </div>
            `;
      break;

    case "admin":
      specificFields = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="employeeId" class="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                        <input type="text" id="employeeId" name="employeeId" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="EMP-YYYY-XXXXX">
                    </div>
                    <div>
                        <label for="department" class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <select id="department" name="department" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="">Select Department</option>
                            <option value="it">IT Administration</option>
                            <option value="medical">Medical Administration</option>
                            <option value="pharmacy">Pharmacy Administration</option>
                            <option value="compliance">Compliance</option>
                            <option value="finance">Finance</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label for="accessLevel" class="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                    <select id="accessLevel" name="accessLevel" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="">Select Access Level</option>
                        <option value="level1">Level 1 - Basic Admin</option>
                        <option value="level2">Level 2 - Advanced Admin</option>
                        <option value="level3">Level 3 - Super Admin</option>
                    </select>
                </div>
            `;
      break;
  }

  roleSpecificFields.innerHTML = specificFields;
}

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  const strengthBar = document.getElementById("passwordStrength");
  const strengthText = document.getElementById("passwordStrengthText");

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

// Form submission
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Password strength checking
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      checkPasswordStrength(this.value);
    });
  }

  // Password confirmation checking
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", function () {
      const password = passwordInput.value;
      const confirmPassword = this.value;

      if (confirmPassword && password !== confirmPassword) {
        this.classList.add("border-red-500");
        this.classList.remove("border-gray-300");
      } else {
        this.classList.remove("border-red-500");
        this.classList.add("border-gray-300");
      }
    });
  }

  // Form submission
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
      }

      // Validate password strength
      if (data.password.length < 8) {
        showNotification(
          "Password must be at least 8 characters long",
          "error"
        );
        return;
      }

      // Store form data
      registrationData = { ...registrationData, ...data };

      // Move to verification step
      nextStep();

      // Start verification process
      await sendVerificationEmail(data.email);
    });
  }
});

// Verification functionality
async function sendVerificationEmail(email) {
  document.getElementById("verificationEmail").textContent = email;

  try {
    // Simulate sending verification email
    await new Promise((resolve) => setTimeout(resolve, 1000));

    showNotification("Verification code sent to your email", "success");

    // Set up verification input handlers
    setupVerificationInputs();
  } catch (error) {
    showNotification("Failed to send verification email", "error");
  }
}

function setupVerificationInputs() {
  const inputs = document.querySelectorAll(".verification-input");

  inputs.forEach((input, index) => {
    input.addEventListener("input", function () {
      if (this.value.length === 1) {
        // Move to next input
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }

      // Check if all inputs are filled
      const allFilled = Array.from(inputs).every(
        (inp) => inp.value.length === 1
      );
      if (allFilled) {
        // Auto-verify after a short delay
        setTimeout(() => {
          const code = Array.from(inputs)
            .map((inp) => inp.value)
            .join("");
          if (code.length === 6) {
            verifyAccount();
          }
        }, 500);
      }
    });

    input.addEventListener("keydown", function (e) {
      // Handle backspace
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

async function verifyAccount() {
  const inputs = document.querySelectorAll(".verification-input");
  const code = Array.from(inputs)
    .map((input) => input.value)
    .join("");

  if (code.length !== 6) {
    showNotification("Please enter the complete verification code", "error");
    return;
  }

  try {
    showLoader("Verifying account...");

    // Simulate verification (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate successful verification
    if (code === "123456" || code.length === 6) {
      // Create account
      const accountResult = await createAccount(registrationData);

      if (accountResult.success) {
        hideLoader();
        showNotification("Account created successfully!", "success");

        // Redirect to login page after success
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
      } else {
        throw new Error(accountResult.message);
      }
    } else {
      throw new Error("Invalid verification code");
    }
  } catch (error) {
    hideLoader();
    showNotification(error.message || "Verification failed", "error");
  }
}

async function createAccount(data) {
  // Simulate account creation API call
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock successful account creation
  return {
    success: true,
    message: "Account created successfully",
  };
}

function resendCode() {
  const email =
    registrationData.email || document.getElementById("email").value;

  if (!email) {
    showNotification("Email address not found", "error");
    return;
  }

  // Start countdown
  startResendTimer();

  // Simulate resending code
  setTimeout(() => {
    showNotification("Verification code resent", "success");
  }, 1000);
}

function startResendTimer() {
  const timerElement = document.getElementById("timer");
  const resendTimer = document.getElementById("resendTimer");
  const resendButton = document.querySelector('button[onclick="resendCode()"]');

  let timeLeft = 60;

  resendTimer.classList.remove("hidden");
  resendButton.disabled = true;
  resendButton.classList.add("opacity-50", "cursor-not-allowed");

  const countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      resendTimer.classList.add("hidden");
      resendButton.disabled = false;
      resendButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }, 1000);
}

// Utility functions (imported from auth.js)
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
