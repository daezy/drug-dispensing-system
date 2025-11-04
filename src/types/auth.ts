export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  walletAddress?: string;

  // Role-specific fields
  licenseNumber?: string; // for doctors and pharmacists
  specialty?: string; // for doctors
  hospitalAffiliation?: string; // for doctors
  pharmacyName?: string; // for pharmacists
  pharmacyAddress?: string; // for pharmacists
  dateOfBirth?: string; // for patients
  patientId?: string; // for patients - unique ID (PT-YYYY-XXXXXX)
  insuranceNumber?: string; // for patients
  emergencyContact?: string; // for patients
  employeeId?: string; // for admins
  department?: string; // for admins
  accessLevel?: string; // for admins
}

export type UserRole = "patient" | "doctor" | "pharmacist" | "admin";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;

  // Role-specific fields
  licenseNumber?: string;
  specialty?: string;
  hospitalAffiliation?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
  emergencyContact?: string;
  employeeId?: string;
  department?: string;
  accessLevel?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface VerificationRequest {
  email: string;
  code: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  token: string;
  newPassword: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  pharmacistId?: string;
  medication: string;
  dosage: string;
  instructions: string;
  quantity: number;
  refillsRemaining: number;
  status: "active" | "filled" | "expired" | "cancelled";
  prescribedDate: string;
  expirationDate: string;
  filledDate?: string;
  blockchainTxHash?: string;
}

export interface DashboardStats {
  patient?: {
    activePrescriptions: number;
    medicationsDue: number;
    refillsAvailable: number;
    blockchainTransactions: number;
  };
  doctor?: {
    todaysPatients: number;
    prescriptionsWritten: number;
    pendingApprovals: number;
    blockchainRecords: number;
  };
  pharmacist?: {
    prescriptionsFilled: number;
    pendingOrders: number;
    inventoryItems: number;
    verifiedTransactions: number;
  };
  admin?: {
    totalUsers: number;
    systemHealth: string;
    dailyTransactions: number;
    blockchainIntegrity: string;
  };
}

export interface Activity {
  id: string;
  type: "success" | "info" | "warning" | "error" | "blockchain";
  message: string;
  details: string;
  timestamp: string;
  userId: string;
}
