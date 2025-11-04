// MongoDB Models using Mongoose
// Blockchain-based drug dispensing system schemas

import mongoose from "mongoose";
import {
  User,
  Doctor,
  Pharmacist,
  Patient,
  Drug,
  Prescription,
  PrescriptionAudit,
  InventoryTransaction,
  Notification,
  SystemSettings,
  BlockchainConfig,
  EmergencyContact,
  ContactInfo,
} from "../../types";

// User Schema (base schema for all user types)
const userSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    address: {
      type: String,
      trim: true,
    },
    passport_photo: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["doctor", "pharmacist", "patient", "admin"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    // Email verification fields
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verification_token: {
      type: String,
      select: false,
    },
    // Password hash field (not included in the User interface for security)
    password_hash: {
      type: String,
      required: false, // Optional for wallet users
      select: false, // Don't include in queries by default
    },
    // Wallet authentication fields
    walletAddress: {
      type: String,
      unique: true,
      sparse: true, // Allow null values, but ensure uniqueness when present
      lowercase: true,
      trim: true,
    },
    auth_type: {
      type: String,
      enum: ["email", "wallet"],
      default: "email",
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Doctor Schema
const doctorSchema = new mongoose.Schema<Doctor>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    license_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    contact_info: {
      phone: String,
      emergency_phone: String,
      email: String,
      secondary_email: String,
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Pharmacist Schema
const pharmacistSchema = new mongoose.Schema<Pharmacist>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    license_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pharmacy_name: {
      type: String,
      trim: true,
    },
    contact_info: {
      phone: String,
      emergency_phone: String,
      email: String,
      secondary_email: String,
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Patient Schema
const patientSchema = new mongoose.Schema<Patient>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    date_of_birth: {
      type: Date,
    },
    medical_record_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    contact_info: {
      phone: String,
      emergency_phone: String,
      email: String,
      secondary_email: String,
    },
    emergency_contact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
      address: String,
    },
    allergies: {
      type: String,
      trim: true,
    },
    medical_history: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Drug Schema
const drugSchema = new mongoose.Schema<Drug>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    generic_name: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    dosage_form: {
      type: String,
      required: true,
      enum: [
        "tablet",
        "capsule",
        "liquid",
        "injection",
        "cream",
        "drops",
        "inhaler",
      ],
    },
    strength: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    batch_number: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    stock_quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minimum_stock_level: {
      type: Number,
      default: 10,
      min: 0,
    },
    unit_price: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
    },
    storage_requirements: {
      type: String,
      trim: true,
    },
    side_effects: {
      type: String,
      trim: true,
    },
    contraindications: {
      type: String,
      trim: true,
    },
    blockchain_hash: {
      type: String,
      maxlength: 66,
    },
    // On-chain blockchain fields
    onchain_tx_hash: {
      type: String,
      maxlength: 66,
    },
    onchain_block_number: {
      type: Number,
    },
    onchain_drug_id: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Prescription Schema
const prescriptionSchema = new mongoose.Schema<Prescription>(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    drug_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    pharmacist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacist",
    },
    quantity_prescribed: {
      type: Number,
      required: true,
      min: 1,
    },
    quantity_dispensed: {
      type: Number,
      default: 0,
      min: 0,
    },
    dosage_instructions: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    duration: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    date_issued: {
      type: Date,
      default: Date.now,
    },
    date_dispensed: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "dispensed", "rejected", "expired"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    blockchain_hash: {
      type: String,
      maxlength: 66,
    },
    // On-chain blockchain fields
    onchain_tx_hash: {
      type: String,
      maxlength: 66,
    },
    onchain_block_number: {
      type: Number,
    },
    onchain_prescription_id: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Prescription Audit Schema
const prescriptionAuditSchema = new mongoose.Schema<PrescriptionAudit>(
  {
    prescription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["created", "verified", "dispensed", "rejected", "modified"],
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockchain_transaction_hash: {
      type: String,
      maxlength: 66,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
  }
);

// Inventory Transaction Schema
const inventoryTransactionSchema = new mongoose.Schema<InventoryTransaction>(
  {
    drug_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    transaction_type: {
      type: String,
      required: true,
      enum: ["stock_in", "dispensed", "expired", "damaged", "returned"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    prescription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockchain_transaction_hash: {
      type: String,
      maxlength: 66,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

// Notification Schema
const notificationSchema = new mongoose.Schema<Notification>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "prescription_ready",
        "low_stock",
        "drug_expired",
        "prescription_expired",
        "system_alert",
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// System Settings Schema
const systemSettingsSchema = new mongoose.Schema<SystemSettings>(
  {
    setting_key: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    setting_value: {
      type: String,
    },
    description: {
      type: String,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updated_at" },
  }
);

// Blockchain Config Schema
const blockchainConfigSchema = new mongoose.Schema<BlockchainConfig>(
  {
    network_name: {
      type: String,
      default: "Base",
    },
    rpc_endpoint: {
      type: String,
      default:
        "https://mainnet.helius-rpc.com/?api-key=c56adc77-a357-46ba-9057-b75652c873c4",
    },
    contract_address: {
      type: String,
      maxlength: 42,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// Add indexes for better performance
// Note: Don't add indexes for fields with unique: true as they already have indexes
userSchema.index({ role: 1 });

doctorSchema.index({ verification_status: 1 });

pharmacistSchema.index({ verification_status: 1 });

drugSchema.index({ name: 1 });
drugSchema.index({ expiry_date: 1 });
drugSchema.index({ stock_quantity: 1 });

prescriptionSchema.index({ patient_id: 1 });
prescriptionSchema.index({ doctor_id: 1 });
prescriptionSchema.index({ pharmacist_id: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ date_issued: 1 });

inventoryTransactionSchema.index({ drug_id: 1 });
inventoryTransactionSchema.index({ timestamp: 1 });

notificationSchema.index({ user_id: 1 });
notificationSchema.index({ is_read: 1 });

// Create and export models
export const UserModel =
  mongoose.models.User || mongoose.model<User>("User", userSchema);
export const DoctorModel =
  mongoose.models.Doctor || mongoose.model<Doctor>("Doctor", doctorSchema);
export const PharmacistModel =
  mongoose.models.Pharmacist ||
  mongoose.model<Pharmacist>("Pharmacist", pharmacistSchema);
export const PatientModel =
  mongoose.models.Patient || mongoose.model<Patient>("Patient", patientSchema);
export const DrugModel =
  mongoose.models.Drug || mongoose.model<Drug>("Drug", drugSchema);
export const PrescriptionModel =
  mongoose.models.Prescription ||
  mongoose.model<Prescription>("Prescription", prescriptionSchema);
export const PrescriptionAuditModel =
  mongoose.models.PrescriptionAudit ||
  mongoose.model<PrescriptionAudit>(
    "PrescriptionAudit",
    prescriptionAuditSchema
  );
export const InventoryTransactionModel =
  mongoose.models.InventoryTransaction ||
  mongoose.model<InventoryTransaction>(
    "InventoryTransaction",
    inventoryTransactionSchema
  );
export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<Notification>("Notification", notificationSchema);
export const SystemSettingsModel =
  mongoose.models.SystemSettings ||
  mongoose.model<SystemSettings>("SystemSettings", systemSettingsSchema);
export const BlockchainConfigModel =
  mongoose.models.BlockchainConfig ||
  mongoose.model<BlockchainConfig>("BlockchainConfig", blockchainConfigSchema);

// Export all models as a single object
export const Models = {
  User: UserModel,
  Doctor: DoctorModel,
  Pharmacist: PharmacistModel,
  Patient: PatientModel,
  Drug: DrugModel,
  Prescription: PrescriptionModel,
  PrescriptionAudit: PrescriptionAuditModel,
  InventoryTransaction: InventoryTransactionModel,
  Notification: NotificationModel,
  SystemSettings: SystemSettingsModel,
  BlockchainConfig: BlockchainConfigModel,
};

export default Models;
