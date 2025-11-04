// User models and types based on ERD specifications
// Supports Doctor, Pharmacist, Patient, and Admin roles

export interface User {
  id: number;
  email: string;
  username: string;
  address?: string;
  passport_photo?: string;
  role: "doctor" | "pharmacist" | "patient" | "admin";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Doctor {
  doctor_id: number;
  user_id: number;
  license_number: string;
  specialization?: string;
  contact_info?: ContactInfo;
  verification_status: "pending" | "verified" | "rejected";
  user?: User;
}

export interface Pharmacy {
  pharmacy_id: number;
  name: string;
  license_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  operating_hours?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Pharmacist {
  pharmacist_id: number;
  user_id: number;
  pharmacy_id?: number; // Link to pharmacy
  license_number: string;
  pharmacy_name?: string; // Deprecated - use pharmacy.name
  contact_info?: ContactInfo;
  verification_status: "pending" | "verified" | "rejected";
  user?: User;
  pharmacy?: Pharmacy; // Related pharmacy
}

export interface Patient {
  patient_id: number;
  user_id: number;
  date_of_birth?: Date;
  medical_record_number?: string;
  contact_info?: ContactInfo;
  emergency_contact?: EmergencyContact;
  allergies?: string;
  medical_history?: string;
  user?: User;
}

export interface Drug {
  drug_id: number;
  pharmacy_id?: number; // Link to pharmacy - drugs are pharmacy-specific
  name: string;
  generic_name?: string;
  dosage_form:
    | "tablet"
    | "capsule"
    | "liquid"
    | "injection"
    | "cream"
    | "drops"
    | "inhaler";
  strength: string;
  manufacturer: string;
  batch_number?: string;
  expiry_date: Date;
  stock_quantity: number;
  minimum_stock_level: number;
  unit_price?: number;
  category?: string;
  description?: string;
  storage_requirements?: string;
  side_effects?: string;
  contraindications?: string;
  blockchain_hash?: string;
  // On-chain blockchain fields
  onchain_tx_hash?: string;
  onchain_block_number?: number;
  onchain_drug_id?: number;
  created_at: Date;
  updated_at: Date;
  pharmacy?: Pharmacy; // Related pharmacy
}

export interface Prescription {
  prescription_id: number;
  patient_id: number;
  doctor_id: number;
  drug_id: number;
  pharmacy_id?: number; // Target pharmacy for dispensing
  pharmacist_id?: number;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_instructions: string;
  frequency?: string;
  duration?: string;
  date_issued: Date;
  date_dispensed?: Date;
  status: "pending" | "verified" | "dispensed" | "rejected" | "expired";
  notes?: string;
  blockchain_hash?: string;
  // On-chain blockchain fields
  onchain_tx_hash?: string;
  onchain_block_number?: number;
  onchain_prescription_id?: number;
  // Related entities
  patient?: Patient;
  doctor?: Doctor;
  drug?: Drug;
  pharmacist?: Pharmacist;
}

export interface PrescriptionAudit {
  audit_id: number;
  prescription_id: number;
  action: "created" | "verified" | "dispensed" | "rejected" | "modified";
  performed_by: number;
  blockchain_transaction_hash?: string;
  timestamp: Date;
  details?: any;
}

export interface InventoryTransaction {
  transaction_id: number;
  drug_id: number;
  transaction_type:
    | "stock_in"
    | "dispensed"
    | "expired"
    | "damaged"
    | "returned";
  quantity: number;
  prescription_id?: number;
  performed_by: number;
  blockchain_transaction_hash?: string;
  timestamp: Date;
  notes?: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  type:
    | "prescription_ready"
    | "low_stock"
    | "drug_expired"
    | "prescription_expired"
    | "system_alert";
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

// Supporting interfaces
export interface ContactInfo {
  phone?: string;
  emergency_phone?: string;
  email?: string;
  secondary_email?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

// Registration form interfaces
export interface UserRegistrationData {
  email: string;
  password: string;
  username: string;
  address?: string;
  passport_photo?: File | string;
  role: "doctor" | "pharmacist" | "patient";
}

export interface DoctorRegistrationData extends UserRegistrationData {
  role: "doctor";
  license_number: string;
  specialization?: string;
  contact_info?: ContactInfo;
}

export interface PharmacistRegistrationData extends UserRegistrationData {
  role: "pharmacist";
  license_number: string;
  pharmacy_name?: string;
  contact_info?: ContactInfo;
}

export interface PatientRegistrationData extends UserRegistrationData {
  role: "patient";
  date_of_birth?: Date;
  contact_info?: ContactInfo;
  emergency_contact?: EmergencyContact;
  allergies?: string;
  medical_history?: string;
}

// Login and authentication
export interface LoginCredentials {
  email: string;
  password: string;
  role?: "doctor" | "pharmacist" | "patient" | "admin";
}

export interface AuthResponse {
  success: boolean;
  user?: User & {
    roleData?: Doctor | Pharmacist | Patient;
  };
  token?: string;
  message?: string;
}

// Prescription workflow interfaces (based on Figure 3.2)
export interface PrescriptionWorkflowData {
  patient_id: number;
  drug_id: number;
  quantity_prescribed: number;
  dosage_instructions: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PrescriptionVerificationData {
  prescription_id: number;
  verification_notes?: string;
  approved: boolean;
}

export interface DispenseData {
  prescription_id: number;
  quantity_dispensed: number;
  pharmacist_notes?: string;
  blockchain_hash?: string;
}

// System configuration
export interface SystemSettings {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_by?: number;
  updated_at: Date;
}

export interface BlockchainConfig {
  config_id: number;
  network_name: string;
  rpc_endpoint: string;
  contract_address?: string;
  is_active: boolean;
  created_at: Date;
}

// Dashboard and reporting interfaces
export interface DashboardStats {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  dispensedPrescriptions: number;
  lowStockDrugs: number;
  expiredDrugs: number;
  totalPatients?: number;
  totalDoctors?: number;
  totalPharmacists?: number;
}

export interface InventoryReport {
  drug_id: number;
  name: string;
  stock_quantity: number;
  minimum_stock_level: number;
  expiry_date: Date;
  status: "in_stock" | "low_stock" | "out_of_stock" | "expired";
}

export interface PrescriptionReport {
  prescription_id: number;
  patient_name: string;
  doctor_name: string;
  drug_name: string;
  status: string;
  date_issued: Date;
  date_dispensed?: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File upload types
export interface FileUploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Drug Traceability Types
export interface DrugBatch {
  batch_id: number;
  drug_id?: number;
  drug_name: string;
  batch_number: string;
  manufacturer_address: string;
  manufactured_date: Date;
  expiry_date: Date;
  initial_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  metadata_hash?: string;
  onchain_batch_id?: number;
  onchain_tx_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MovementRecord {
  movement_id: number;
  batch_id: number;
  movement_type:
    | "manufactured"
    | "received_by_pharmacist"
    | "dispensed_to_patient"
    | "returned"
    | "destroyed";
  from_address?: string;
  to_address: string;
  quantity: number;
  timestamp: Date;
  transaction_hash?: string;
  notes?: string;
  prescription_id?: number;
  onchain_movement_id?: number;
  onchain_tx_hash?: string;
  created_at: Date;
}

export interface DispensingRecord {
  dispensing_id: number;
  batch_id: number;
  prescription_id: number;
  patient_address: string;
  pharmacist_address: string;
  quantity: number;
  verification_hash: string;
  is_verified: boolean;
  verified_at?: Date;
  onchain_dispensing_id?: number;
  onchain_tx_hash?: string;
  created_at: Date;
  updated_at: Date;
  // Related entities
  batch?: DrugBatch;
  prescription?: Prescription;
}

export interface TraceabilityAuditLog {
  audit_id: number;
  batch_id: number;
  action:
    | "batch_created"
    | "movement_recorded"
    | "dispensing_recorded"
    | "verification_performed";
  performed_by: number;
  blockchain_tx_hash?: string;
  timestamp: Date;
  details?: any;
}

export interface DrugVerificationResult {
  isValid: boolean;
  dispensing?: DispensingRecord;
  batch?: DrugBatch;
  movementHistory?: MovementRecord[];
  message?: string;
}
