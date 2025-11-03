// Smart Contract ABIs for PharmChain
// Contains ABIs for Prescription and DrugInventory contracts

export const PrescriptionContractABI = [
  // Events
  {
    type: "event",
    name: "PrescriptionCreated",
    inputs: [
      { name: "prescriptionId", type: "uint256", indexed: true },
      { name: "patientAddress", type: "address", indexed: true },
      { name: "doctorAddress", type: "address", indexed: true },
      { name: "drugId", type: "uint256", indexed: false },
      { name: "quantity", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PrescriptionVerified",
    inputs: [
      { name: "prescriptionId", type: "uint256", indexed: true },
      { name: "verifierAddress", type: "address", indexed: true },
      { name: "isApproved", type: "bool", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PrescriptionDispensed",
    inputs: [
      { name: "prescriptionId", type: "uint256", indexed: true },
      { name: "pharmacistAddress", type: "address", indexed: true },
      { name: "quantityDispensed", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "blockchainHash", type: "bytes32", indexed: false },
    ],
  },
  // Functions
  {
    type: "function",
    name: "createPrescription",
    stateMutability: "nonpayable",
    inputs: [
      { name: "patientAddress", type: "address" },
      { name: "drugId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "dosageInstructions", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "prescriptionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "verifyPrescription",
    stateMutability: "nonpayable",
    inputs: [
      { name: "prescriptionId", type: "uint256" },
      { name: "isApproved", type: "bool" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "dispensePrescription",
    stateMutability: "nonpayable",
    inputs: [
      { name: "prescriptionId", type: "uint256" },
      { name: "quantityDispensed", type: "uint256" },
      { name: "blockchainHash", type: "bytes32" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "getPrescription",
    stateMutability: "view",
    inputs: [{ name: "prescriptionId", type: "uint256" }],
    outputs: [
      {
        name: "prescription",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "patientAddress", type: "address" },
          { name: "doctorAddress", type: "address" },
          { name: "drugId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "dispensedAt", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export const DrugInventoryContractABI = [
  // Events
  {
    type: "event",
    name: "DrugAdded",
    inputs: [
      { name: "drugId", type: "uint256", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "initialQuantity", type: "uint256", indexed: false },
      { name: "pharmacistAddress", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DrugStockUpdated",
    inputs: [
      { name: "drugId", type: "uint256", indexed: true },
      { name: "previousQuantity", type: "uint256", indexed: false },
      { name: "newQuantity", type: "uint256", indexed: false },
      { name: "transactionType", type: "string", indexed: false },
      { name: "performedBy", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "blockchainHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DrugExpired",
    inputs: [
      { name: "drugId", type: "uint256", indexed: true },
      { name: "quantity", type: "uint256", indexed: false },
      { name: "expiryDate", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  // Functions
  {
    type: "function",
    name: "addDrug",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "genericName", type: "string" },
      { name: "initialQuantity", type: "uint256" },
      { name: "minimumStockLevel", type: "uint256" },
      { name: "expiryDate", type: "uint256" },
      { name: "batchNumber", type: "string" },
    ],
    outputs: [{ name: "drugId", type: "uint256" }],
  },
  {
    type: "function",
    name: "updateStock",
    stateMutability: "nonpayable",
    inputs: [
      { name: "drugId", type: "uint256" },
      { name: "quantityChange", type: "int256" },
      { name: "transactionType", type: "string" },
      { name: "blockchainHash", type: "bytes32" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "getDrug",
    stateMutability: "view",
    inputs: [{ name: "drugId", type: "uint256" }],
    outputs: [
      {
        name: "drug",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "genericName", type: "string" },
          { name: "currentQuantity", type: "uint256" },
          { name: "minimumStockLevel", type: "uint256" },
          { name: "expiryDate", type: "uint256" },
          { name: "batchNumber", type: "string" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getStockLevel",
    stateMutability: "view",
    inputs: [{ name: "drugId", type: "uint256" }],
    outputs: [{ name: "quantity", type: "uint256" }],
  },
] as const;

export const DrugTraceabilityContractABI = [
  // Events
  {
    type: "event",
    name: "DrugBatchCreated",
    inputs: [
      { name: "batchId", type: "uint256", indexed: true },
      { name: "drugName", type: "string", indexed: false },
      { name: "batchNumber", type: "string", indexed: false },
      { name: "manufacturer", type: "address", indexed: true },
      { name: "quantity", type: "uint256", indexed: false },
      { name: "manufacturedDate", type: "uint256", indexed: false },
      { name: "expiryDate", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DrugMovementRecorded",
    inputs: [
      { name: "movementId", type: "uint256", indexed: true },
      { name: "batchId", type: "uint256", indexed: true },
      { name: "movementType", type: "uint8", indexed: false },
      { name: "fromAddress", type: "address", indexed: true },
      { name: "toAddress", type: "address", indexed: false },
      { name: "quantity", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "transactionHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DrugDispensed",
    inputs: [
      { name: "dispensingId", type: "uint256", indexed: true },
      { name: "batchId", type: "uint256", indexed: true },
      { name: "prescriptionId", type: "uint256", indexed: false },
      { name: "patientAddress", type: "address", indexed: true },
      { name: "pharmacistAddress", type: "address", indexed: false },
      { name: "quantity", type: "uint256", indexed: false },
      { name: "verificationHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DrugVerified",
    inputs: [
      { name: "dispensingId", type: "uint256", indexed: true },
      { name: "patientAddress", type: "address", indexed: true },
      { name: "verificationHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  // Functions
  {
    type: "function",
    name: "createDrugBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "drugName", type: "string" },
      { name: "batchNumber", type: "string" },
      { name: "quantity", type: "uint256" },
      { name: "manufacturedDate", type: "uint256" },
      { name: "expiryDate", type: "uint256" },
      { name: "metadataHash", type: "bytes32" },
    ],
    outputs: [{ name: "batchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "recordPharmacistReceipt",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "notes", type: "string" },
    ],
    outputs: [{ name: "movementId", type: "uint256" }],
  },
  {
    type: "function",
    name: "recordPatientDispensing",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "prescriptionId", type: "uint256" },
      { name: "patientAddress", type: "address" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [{ name: "dispensingId", type: "uint256" }],
  },
  {
    type: "function",
    name: "verifyDrugAuthenticity",
    stateMutability: "nonpayable",
    inputs: [{ name: "verificationHash", type: "bytes32" }],
    outputs: [
      {
        name: "record",
        type: "tuple",
        components: [
          { name: "dispensingId", type: "uint256" },
          { name: "batchId", type: "uint256" },
          { name: "prescriptionId", type: "uint256" },
          { name: "patientAddress", type: "address" },
          { name: "pharmacistAddress", type: "address" },
          { name: "quantity", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "verificationHash", type: "bytes32" },
          { name: "isVerified", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getBatchMovementHistory",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      {
        name: "movements",
        type: "tuple[]",
        components: [
          { name: "movementId", type: "uint256" },
          { name: "batchId", type: "uint256" },
          { name: "movementType", type: "uint8" },
          { name: "fromAddress", type: "address" },
          { name: "toAddress", type: "address" },
          { name: "quantity", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "transactionHash", type: "bytes32" },
          { name: "notes", type: "string" },
          { name: "prescriptionId", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getBatchDetails",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      {
        name: "batch",
        type: "tuple",
        components: [
          { name: "batchId", type: "uint256" },
          { name: "drugName", type: "string" },
          { name: "batchNumber", type: "string" },
          { name: "manufacturer", type: "address" },
          { name: "manufacturedDate", type: "uint256" },
          { name: "expiryDate", type: "uint256" },
          { name: "initialQuantity", type: "uint256" },
          { name: "remainingQuantity", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "metadataHash", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getPatientDispensings",
    stateMutability: "view",
    inputs: [{ name: "patientAddress", type: "address" }],
    outputs: [{ name: "dispensingIds", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getDispensingDetails",
    stateMutability: "view",
    inputs: [{ name: "dispensingId", type: "uint256" }],
    outputs: [
      {
        name: "dispensing",
        type: "tuple",
        components: [
          { name: "dispensingId", type: "uint256" },
          { name: "batchId", type: "uint256" },
          { name: "prescriptionId", type: "uint256" },
          { name: "patientAddress", type: "address" },
          { name: "pharmacistAddress", type: "address" },
          { name: "quantity", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "verificationHash", type: "bytes32" },
          { name: "isVerified", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getBatchDispensings",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [{ name: "dispensingIds", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getTotalBatches",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "total", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalMovements",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "total", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalDispensings",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "total", type: "uint256" }],
  },
] as const;

// Contract addresses (will be set from environment variables)
export const CONTRACT_ADDRESSES = {
  PRESCRIPTION: (process.env.NEXT_PUBLIC_PRESCRIPTION_CONTRACT_ADDRESS ||
    "") as `0x${string}`,
  DRUG_INVENTORY: (process.env.NEXT_PUBLIC_DRUG_INVENTORY_CONTRACT_ADDRESS ||
    "") as `0x${string}`,
  DRUG_TRACEABILITY: (process.env
    .NEXT_PUBLIC_DRUG_TRACEABILITY_CONTRACT_ADDRESS || "") as `0x${string}`,
};

// TypeScript types for contract interactions
export interface PrescriptionCreatedEvent {
  prescriptionId: bigint;
  patientAddress: `0x${string}`;
  doctorAddress: `0x${string}`;
  drugId: bigint;
  quantity: bigint;
  timestamp: bigint;
}

export interface PrescriptionDispensedEvent {
  prescriptionId: bigint;
  pharmacistAddress: `0x${string}`;
  quantityDispensed: bigint;
  timestamp: bigint;
  blockchainHash: `0x${string}`;
}

export interface DrugStockUpdatedEvent {
  drugId: bigint;
  previousQuantity: bigint;
  newQuantity: bigint;
  transactionType: string;
  performedBy: `0x${string}`;
  timestamp: bigint;
  blockchainHash: `0x${string}`;
}

export interface DrugAddedEvent {
  drugId: bigint;
  name: string;
  initialQuantity: bigint;
  pharmacistAddress: `0x${string}`;
  timestamp: bigint;
}

export interface OnChainPrescription {
  id: bigint;
  patientAddress: `0x${string}`;
  doctorAddress: `0x${string}`;
  drugId: bigint;
  quantity: bigint;
  status: number; // 0: pending, 1: verified, 2: dispensed, 3: rejected
  createdAt: bigint;
  dispensedAt: bigint;
}

export interface OnChainDrug {
  id: bigint;
  name: string;
  genericName: string;
  currentQuantity: bigint;
  minimumStockLevel: bigint;
  expiryDate: bigint;
  batchNumber: string;
  isActive: boolean;
}

// Drug Traceability Types
export enum MovementType {
  Manufactured = 0,
  ReceivedByPharmacist = 1,
  DispensedToPatient = 2,
  Returned = 3,
  Destroyed = 4,
}

export interface DrugBatch {
  batchId: bigint;
  drugName: string;
  batchNumber: string;
  manufacturer: `0x${string}`;
  manufacturedDate: bigint;
  expiryDate: bigint;
  initialQuantity: bigint;
  remainingQuantity: bigint;
  isActive: boolean;
  metadataHash: `0x${string}`;
}

export interface MovementRecord {
  movementId: bigint;
  batchId: bigint;
  movementType: number; // MovementType enum
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  quantity: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
  notes: string;
  prescriptionId: bigint;
}

export interface DispensingRecord {
  dispensingId: bigint;
  batchId: bigint;
  prescriptionId: bigint;
  patientAddress: `0x${string}`;
  pharmacistAddress: `0x${string}`;
  quantity: bigint;
  timestamp: bigint;
  verificationHash: `0x${string}`;
  isVerified: boolean;
}

export interface DrugBatchCreatedEvent {
  batchId: bigint;
  drugName: string;
  batchNumber: string;
  manufacturer: `0x${string}`;
  quantity: bigint;
  manufacturedDate: bigint;
  expiryDate: bigint;
  timestamp: bigint;
}

export interface DrugMovementRecordedEvent {
  movementId: bigint;
  batchId: bigint;
  movementType: number;
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  quantity: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
}

export interface DrugDispensedEvent {
  dispensingId: bigint;
  batchId: bigint;
  prescriptionId: bigint;
  patientAddress: `0x${string}`;
  pharmacistAddress: `0x${string}`;
  quantity: bigint;
  verificationHash: `0x${string}`;
  timestamp: bigint;
}

export interface DrugVerifiedEvent {
  dispensingId: bigint;
  patientAddress: `0x${string}`;
  verificationHash: `0x${string}`;
  timestamp: bigint;
}
