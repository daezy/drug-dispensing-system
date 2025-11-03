// User authentication and management service using MongoDB/Mongoose
// Implements registration, login, and role management based on specifications

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../database/connection";
import {
  UserModel,
  DoctorModel,
  PharmacistModel,
  PatientModel,
} from "../database/models";
import {
  User,
  Doctor,
  Pharmacist,
  Patient,
  UserRegistrationData,
  DoctorRegistrationData,
  PharmacistRegistrationData,
  PatientRegistrationData,
  LoginCredentials,
  AuthResponse,
  ValidationResult,
  ValidationError,
} from "../../types";
import mongoose from "mongoose";

export class UserService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || this.generateFallbackSecret();

    if (!process.env.JWT_SECRET) {
      console.warn(
        "⚠️  JWT_SECRET not set in environment. Using generated fallback."
      );
    }
  }

  // Generate a fallback secret if none is provided
  private generateFallbackSecret(): string {
    return `pharmchain-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}`;
  }

  // Simple in-memory rate limiting (in production, use Redis or database)
  private loginAttempts = new Map<
    string,
    { count: number; lastAttempt: number }
  >();

  // Check if user has exceeded login attempts
  private checkRateLimit(email: string): {
    allowed: boolean;
    remaining?: number;
    resetTime?: number;
  } {
    const key = email.toLowerCase();
    const now = Date.now();
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    const userAttempts = this.loginAttempts.get(key);

    if (!userAttempts) {
      return { allowed: true };
    }

    // Reset if window has expired
    if (now - userAttempts.lastAttempt > windowMs) {
      this.loginAttempts.delete(key);
      return { allowed: true };
    }

    // Check if limit exceeded
    if (userAttempts.count >= maxAttempts) {
      const resetTime = userAttempts.lastAttempt + windowMs;
      return { allowed: false, resetTime };
    }

    return { allowed: true, remaining: maxAttempts - userAttempts.count };
  }

  // Record login attempt
  private recordLoginAttempt(email: string, success: boolean): void {
    const key = email.toLowerCase();
    const now = Date.now();

    if (success) {
      // Clear attempts on successful login
      this.loginAttempts.delete(key);
      return;
    }

    const userAttempts = this.loginAttempts.get(key);
    if (!userAttempts) {
      this.loginAttempts.set(key, { count: 1, lastAttempt: now });
    } else {
      userAttempts.count++;
      userAttempts.lastAttempt = now;
    }
  }

  // Ensure database connection
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  // Validate password strength
  private validatePasswordStrength(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters long",
      });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one lowercase letter",
      });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one uppercase letter",
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one number",
      });
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push({
        field: "password",
        message:
          "Password must contain at least one special character (@$!%*?&)",
      });
    }

    return errors;
  }

  // Sanitize user input to prevent injection attacks
  private sanitizeUserInput(data: UserRegistrationData): UserRegistrationData {
    const sanitized = { ...data };

    // Trim and normalize email
    if (sanitized.email) {
      sanitized.email = sanitized.email.trim().toLowerCase();
    }

    // Trim username and remove special characters
    if (sanitized.username) {
      sanitized.username = sanitized.username.trim().replace(/[<>]/g, "");
    }

    // Trim address
    if (sanitized.address) {
      sanitized.address = sanitized.address.trim().replace(/[<>]/g, "");
    }

    return sanitized;
  }

  // Validate registration data
  private validateRegistrationData(
    data: UserRegistrationData
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push({
        field: "email",
        message: "Valid email address is required",
      });
    }

    // Password validation
    if (!data.password) {
      errors.push({
        field: "password",
        message: "Password is required",
      });
    } else {
      // Check password strength
      const passwordStrengthErrors = this.validatePasswordStrength(
        data.password
      );
      errors.push(...passwordStrengthErrors);
    }

    // Username validation
    if (!data.username || data.username.length < 3) {
      errors.push({
        field: "username",
        message: "Username must be at least 3 characters long",
      });
    }

    // Role-specific validations
    if (data.role === "doctor") {
      const doctorData = data as DoctorRegistrationData;
      if (!doctorData.license_number) {
        errors.push({
          field: "license_number",
          message: "Medical license number is required for doctors",
        });
      }
    }

    if (data.role === "pharmacist") {
      const pharmacistData = data as PharmacistRegistrationData;
      if (!pharmacistData.license_number) {
        errors.push({
          field: "license_number",
          message: "Pharmacy license number is required for pharmacists",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Register new user
  async registerUser(data: UserRegistrationData): Promise<AuthResponse> {
    try {
      await this.ensureConnection();

      // Sanitize input data
      const sanitizedData = this.sanitizeUserInput(data);

      // Validate input data
      const validation = this.validateRegistrationData(sanitizedData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors
            .map((e) => e.message)
            .join(", ")}`,
        };
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({
        email: sanitizedData.email.toLowerCase(),
      });
      if (existingUser) {
        return {
          success: false,
          message: "Email address already registered",
        };
      }

      // Check if username already exists
      const existingUsername = await UserModel.findOne({
        username: sanitizedData.username,
      });
      if (existingUsername) {
        return {
          success: false,
          message: "Username already taken",
        };
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(
        sanitizedData.password,
        saltRounds
      );

      // Start transaction session
      const session = await mongoose.startSession();

      try {
        const result = await session.withTransaction(async () => {
          // Create new user document
          const newUser = new UserModel({
            email: sanitizedData.email.toLowerCase(),
            username: sanitizedData.username,
            address: sanitizedData.address,
            passport_photo: sanitizedData.passport_photo,
            role: sanitizedData.role,
            is_active: true,
            password_hash: passwordHash, // This will be virtual or handled separately
          });

          const savedUser = await newUser.save({ session });

          // Create role-specific document
          let roleData: any = null;

          if (sanitizedData.role === "doctor") {
            const doctorData = sanitizedData as DoctorRegistrationData;
            const newDoctor = new DoctorModel({
              user_id: savedUser._id,
              license_number: doctorData.license_number,
              specialization: doctorData.specialization || "",
              contact_info: doctorData.contact_info || {},
              verification_status: "verified",
            });
            roleData = await newDoctor.save({ session });
          } else if (sanitizedData.role === "pharmacist") {
            const pharmacistData = sanitizedData as PharmacistRegistrationData;
            const newPharmacist = new PharmacistModel({
              user_id: savedUser._id,
              license_number: pharmacistData.license_number,
              pharmacy_name: pharmacistData.pharmacy_name || "",
              contact_info: pharmacistData.contact_info || {},
              verification_status: "verified",
            });
            roleData = await newPharmacist.save({ session });
          } else if (sanitizedData.role === "patient") {
            const patientData = sanitizedData as PatientRegistrationData;
            const newPatient = new PatientModel({
              user_id: savedUser._id,
              date_of_birth: patientData.date_of_birth || null,
              contact_info: patientData.contact_info || {},
              emergency_contact: patientData.emergency_contact || {},
              allergies: patientData.allergies || "",
              medical_history: patientData.medical_history || "",
            });
            roleData = await newPatient.save({ session });
          }

          // Generate JWT token
          const token = this.generateToken(savedUser.toObject());

          return {
            success: true,
            user: {
              ...savedUser.toObject(),
              roleData: roleData?.toObject(),
            },
            token,
            message: "Account created successfully",
          };
        });

        await session.endSession();
        return result;
      } catch (transactionError) {
        await session.endSession();
        throw transactionError;
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Failed to create account. Please try again.",
      };
    }
  }

  // User login
  async loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      await this.ensureConnection();

      // Check rate limiting
      const rateLimit = this.checkRateLimit(credentials.email);
      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetTime!);
        return {
          success: false,
          message: `Too many login attempts. Please try again after ${resetTime.toLocaleTimeString()}`,
        };
      }

      // Find user by email and explicitly select password_hash
      const user = await UserModel.findOne({
        email: credentials.email.toLowerCase(),
        is_active: true,
      }).select("+password_hash");

      if (!user) {
        // Record failed login attempt
        this.recordLoginAttempt(credentials.email, false);
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Verify password exists
      const storedPasswordHash = (user as any).password_hash;
      if (!storedPasswordHash) {
        return {
          success: false,
          message: "Account setup incomplete. Please contact administrator.",
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        storedPasswordHash
      );

      if (!isValidPassword) {
        // Record failed login attempt
        this.recordLoginAttempt(credentials.email, false);
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Check role if specified
      if (credentials.role && user.role !== credentials.role) {
        return {
          success: false,
          message: "Invalid role selection",
        };
      }

      // Get role-specific data
      let roleData: any = null;

      if (user.role === "doctor") {
        roleData = await this.getDoctorByUserId(user._id.toString());

        // For demo purposes, allow login but warn about verification status
        if (roleData && roleData.verification_status !== "verified") {
          // Still allow login but include verification status in response
          // In production, you might want to block unverified doctors
        }
      } else if (user.role === "pharmacist") {
        roleData = await this.getPharmacistByUserId(user._id.toString());

        // For demo purposes, allow login but warn about verification status
        if (roleData && roleData.verification_status !== "verified") {
          // Still allow login but include verification status in response
          // In production, you might want to block unverified pharmacists
        }
      } else if (user.role === "patient") {
        roleData = await this.getPatientByUserId(user._id.toString());
      }

      // Generate JWT token
      const token = this.generateToken(user.toObject());

      // Record successful login (clears failed attempts)
      this.recordLoginAttempt(credentials.email, true);

      return {
        success: true,
        user: {
          ...user.toObject(),
          roleData: roleData?.toObject?.() || roleData,
        },
        token,
        message: "Login successful",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  }

  // Generate JWT token
  private generateToken(user: any): string {
    return jwt.sign(
      {
        userId: user._id || user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: "24h" }
    );
  }

  // Verify JWT token
  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      // Check if user still exists and is active
      const user = await this.getUserById(decoded.userId);
      if (!user || !user.is_active) {
        return { valid: false, error: "User account not found or inactive" };
      }

      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: "Invalid or expired token" };
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      await this.ensureConnection();

      const user = await UserModel.findById(id).select("-password_hash");
      return user ? user.toObject() : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  // Get doctor by user ID
  async getDoctorByUserId(userId: string): Promise<Doctor | null> {
    try {
      await this.ensureConnection();

      const doctor = await DoctorModel.findOne({ user_id: userId });
      return doctor ? doctor.toObject() : null;
    } catch (error) {
      console.error("Error fetching doctor:", error);
      return null;
    }
  }

  // Get pharmacist by user ID
  async getPharmacistByUserId(userId: string): Promise<Pharmacist | null> {
    try {
      await this.ensureConnection();

      const pharmacist = await PharmacistModel.findOne({ user_id: userId });
      return pharmacist ? pharmacist.toObject() : null;
    } catch (error) {
      console.error("Error fetching pharmacist:", error);
      return null;
    }
  }

  // Get patient by user ID
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    try {
      await this.ensureConnection();

      const patient = await PatientModel.findOne({ user_id: userId });
      return patient ? patient.toObject() : null;
    } catch (error) {
      console.error("Error fetching patient:", error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();

      const allowedFields = ["username", "address", "passport_photo"];
      const updateData: any = {};

      allowedFields.forEach((field) => {
        if (updates.hasOwnProperty(field)) {
          updateData[field] = (updates as any)[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return { success: false, message: "No valid fields to update" };
      }

      await UserModel.findByIdAndUpdate(userId, updateData);

      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: "Failed to update profile" };
    }
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();

      // Get current user with password hash
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Get stored password hash (this needs to be implemented properly)
      const storedPasswordHash = (user as any).password_hash;
      if (!storedPasswordHash) {
        return { success: false, message: "Password not set up properly" };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        storedPasswordHash
      );
      if (!isValidPassword) {
        return { success: false, message: "Current password is incorrect" };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return {
          success: false,
          message: "New password must be at least 8 characters long",
        };
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password (this needs to be implemented properly based on your schema)
      await UserModel.findByIdAndUpdate(userId, {
        password_hash: newPasswordHash,
      });

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: "Failed to change password" };
    }
  }

  // Find user by wallet address
  static async findUserByWallet(walletAddress: string) {
    try {
      await connectToDatabase();

      const user = await UserModel.findOne({
        walletAddress: walletAddress.toLowerCase(),
      }).lean();

      if (!user) {
        return null;
      }

      // Fetch role-specific data
      let roleData = null;
      switch (user.role) {
        case "doctor":
          roleData = await DoctorModel.findOne({ user_id: user._id }).lean();
          break;
        case "pharmacist":
          roleData = await PharmacistModel.findOne({
            user_id: user._id,
          }).lean();
          break;
        case "patient":
          roleData = await PatientModel.findOne({ user_id: user._id }).lean();
          break;
      }

      return {
        ...user,
        roleData,
      };
    } catch (error) {
      console.error("Error finding user by wallet:", error);
      throw error;
    }
  }

  // Register new user with wallet address (auto-registration)
  static async registerWalletUser(data: {
    walletAddress: string;
    email: string;
    username: string;
    role: string;
  }) {
    try {
      await connectToDatabase();

      // Create base user
      const user = await UserModel.create({
        email: data.email,
        username: data.username,
        firstName: "Wallet",
        lastName: "User",
        role: data.role,
        walletAddress: data.walletAddress.toLowerCase(),
        verification_status: "verified",
        auth_type: "wallet",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create role-specific document
      let roleData = null;
      switch (data.role) {
        case "doctor":
          roleData = await DoctorModel.create({
            user_id: user._id,
            specialization: "General",
            licenseNumber: `WALLET-${user._id.toString().slice(-8)}`,
            created_at: new Date(),
          });
          break;
        case "pharmacist":
          roleData = await PharmacistModel.create({
            user_id: user._id,
            licenseNumber: `WALLET-${user._id.toString().slice(-8)}`,
            pharmacyName: "Self-Service",
            created_at: new Date(),
          });
          break;
        case "patient":
          roleData = await PatientModel.create({
            user_id: user._id,
            dateOfBirth: new Date(),
            created_at: new Date(),
          });
          break;
      }

      return {
        ...user.toObject(),
        roleData: roleData?.toObject(),
      };
    } catch (error) {
      console.error("Error registering wallet user:", error);
      throw error;
    }
  }
}

export default UserService;
