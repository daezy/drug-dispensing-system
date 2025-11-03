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

export class UserService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret =
      process.env.JWT_SECRET || "pharmchain-drug-dispensing-secret-key";
  }

  // Ensure database connection
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
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
    if (!data.password || data.password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters long",
      });
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
      // Validate input data
      const validation = this.validateRegistrationData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors
            .map((e) => e.message)
            .join(", ")}`,
        };
      }

      // Check if email already exists
      const existingUser = await this.db.query(
        "SELECT id FROM users WHERE email = ?",
        [data.email]
      );

      if (existingUser.length > 0) {
        return {
          success: false,
          message: "Email address already registered",
        };
      }

      // Check if username already exists
      const existingUsername = await this.db.query(
        "SELECT id FROM users WHERE username = ?",
        [data.username]
      );

      if (existingUsername.length > 0) {
        return {
          success: false,
          message: "Username already taken",
        };
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Start transaction for user creation
      const queries = [];

      // Insert user
      queries.push({
        sql: `INSERT INTO users (email, password_hash, username, address, passport_photo, role) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        params: [
          data.email,
          passwordHash,
          data.username,
          data.address || null,
          data.passport_photo || null,
          data.role,
        ],
      });

      const results = await this.db.transaction(queries);
      const userId = (results[0] as any).insertId;

      // Create role-specific record
      let roleData: any = null;

      if (data.role === "doctor") {
        const doctorData = data as DoctorRegistrationData;
        await this.db.query(
          `INSERT INTO doctors (user_id, license_number, specialization, contact_info) 
           VALUES (?, ?, ?, ?)`,
          [
            userId,
            doctorData.license_number,
            doctorData.specialization || null,
            JSON.stringify(doctorData.contact_info || {}),
          ]
        );

        roleData = await this.getDoctorByUserId(userId);
      } else if (data.role === "pharmacist") {
        const pharmacistData = data as PharmacistRegistrationData;
        await this.db.query(
          `INSERT INTO pharmacists (user_id, license_number, pharmacy_name, contact_info) 
           VALUES (?, ?, ?, ?)`,
          [
            userId,
            pharmacistData.license_number,
            pharmacistData.pharmacy_name || null,
            JSON.stringify(pharmacistData.contact_info || {}),
          ]
        );

        roleData = await this.getPharmacistByUserId(userId);
      } else if (data.role === "patient") {
        const patientData = data as PatientRegistrationData;
        await this.db.query(
          `INSERT INTO patients (user_id, date_of_birth, contact_info, emergency_contact, allergies, medical_history) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            patientData.date_of_birth || null,
            JSON.stringify(patientData.contact_info || {}),
            JSON.stringify(patientData.emergency_contact || {}),
            patientData.allergies || null,
            patientData.medical_history || null,
          ]
        );

        roleData = await this.getPatientByUserId(userId);
      }

      // Get created user
      const user = await this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "Failed to create user account",
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        user: { ...user, roleData },
        token,
        message: "Account created successfully",
      };
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
      // Find user by email
      const users = await this.db.query(
        "SELECT * FROM users WHERE email = ? AND is_active = true",
        [credentials.email]
      );

      if (users.length === 0) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      const user = users[0] as User;

      // Verify password
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        user.password_hash as any
      );

      if (!isValidPassword) {
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
        roleData = await this.getDoctorByUserId(user.id);

        // Check if doctor is verified
        if (roleData && roleData.verification_status !== "verified") {
          return {
            success: false,
            message:
              "Doctor account pending verification. Please contact administrator.",
          };
        }
      } else if (user.role === "pharmacist") {
        roleData = await this.getPharmacistByUserId(user.id);

        // Check if pharmacist is verified
        if (roleData && roleData.verification_status !== "verified") {
          return {
            success: false,
            message:
              "Pharmacist account pending verification. Please contact administrator.",
          };
        }
      } else if (user.role === "patient") {
        roleData = await this.getPatientByUserId(user.id);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        user: { ...user, roleData },
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
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
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
  async getUserById(id: number): Promise<User | null> {
    try {
      const users = await this.db.query(
        "SELECT id, email, username, address, passport_photo, role, is_active, created_at, updated_at FROM users WHERE id = ?",
        [id]
      );

      return users.length > 0 ? (users[0] as User) : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  // Get doctor by user ID
  async getDoctorByUserId(userId: number): Promise<Doctor | null> {
    try {
      const doctors = await this.db.query(
        "SELECT * FROM doctors WHERE user_id = ?",
        [userId]
      );

      if (doctors.length > 0) {
        const doctor = doctors[0] as Doctor;
        if (doctor.contact_info) {
          doctor.contact_info = JSON.parse(doctor.contact_info as any);
        }
        return doctor;
      }
      return null;
    } catch (error) {
      console.error("Error fetching doctor:", error);
      return null;
    }
  }

  // Get pharmacist by user ID
  async getPharmacistByUserId(userId: number): Promise<Pharmacist | null> {
    try {
      const pharmacists = await this.db.query(
        "SELECT * FROM pharmacists WHERE user_id = ?",
        [userId]
      );

      if (pharmacists.length > 0) {
        const pharmacist = pharmacists[0] as Pharmacist;
        if (pharmacist.contact_info) {
          pharmacist.contact_info = JSON.parse(pharmacist.contact_info as any);
        }
        return pharmacist;
      }
      return null;
    } catch (error) {
      console.error("Error fetching pharmacist:", error);
      return null;
    }
  }

  // Get patient by user ID
  async getPatientByUserId(userId: number): Promise<Patient | null> {
    try {
      const patients = await this.db.query(
        "SELECT * FROM patients WHERE user_id = ?",
        [userId]
      );

      if (patients.length > 0) {
        const patient = patients[0] as Patient;
        if (patient.contact_info) {
          patient.contact_info = JSON.parse(patient.contact_info as any);
        }
        if (patient.emergency_contact) {
          patient.emergency_contact = JSON.parse(
            patient.emergency_contact as any
          );
        }
        return patient;
      }
      return null;
    } catch (error) {
      console.error("Error fetching patient:", error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: number,
    updates: Partial<User>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const allowedFields = ["username", "address", "passport_photo"];
      const updateFields = Object.keys(updates).filter((key) =>
        allowedFields.includes(key)
      );

      if (updateFields.length === 0) {
        return { success: false, message: "No valid fields to update" };
      }

      const setClause = updateFields.map((field) => `${field} = ?`).join(", ");
      const values = updateFields.map((field) => (updates as any)[field]);
      values.push(userId);

      await this.db.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: "Failed to update profile" };
    }
  }

  // Change password
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current user
      const users = await this.db.query(
        "SELECT password_hash FROM users WHERE id = ?",
        [userId]
      );

      if (users.length === 0) {
        return { success: false, message: "User not found" };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        users[0].password_hash
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

      // Update password
      await this.db.query(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newPasswordHash, userId]
      );

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: "Failed to change password" };
    }
  }
}

export default UserService;
