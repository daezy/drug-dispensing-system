/**
 * Mongoose Models for Drug Traceability
 * Supports MongoDB storage for traceability data
 */

import mongoose, { Schema, Document } from "mongoose";

// Drug Batch Interface
export interface IDrugBatch extends Document {
  drug_id?: mongoose.Types.ObjectId;
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

// Movement Record Interface
export interface IMovementRecord extends Document {
  batch_id: mongoose.Types.ObjectId;
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
  prescription_id?: mongoose.Types.ObjectId;
  onchain_movement_id?: number;
  onchain_tx_hash?: string;
  created_at: Date;
}

// Dispensing Record Interface
export interface IDispensingRecord extends Document {
  batch_id: mongoose.Types.ObjectId;
  prescription_id: mongoose.Types.ObjectId;
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
}

// Traceability Audit Interface
export interface ITraceabilityAudit extends Document {
  batch_id: mongoose.Types.ObjectId;
  action:
    | "batch_created"
    | "movement_recorded"
    | "dispensing_recorded"
    | "verification_performed";
  performed_by: mongoose.Types.ObjectId;
  blockchain_tx_hash?: string;
  timestamp: Date;
  details?: any;
}

// Drug Batch Schema
const DrugBatchSchema = new Schema<IDrugBatch>(
  {
    drug_id: {
      type: Schema.Types.ObjectId,
      ref: "Drug",
      required: false,
    },
    drug_name: {
      type: String,
      required: true,
      trim: true,
    },
    batch_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    manufacturer_address: {
      type: String,
      required: true,
    },
    manufactured_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    initial_quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    remaining_quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    metadata_hash: {
      type: String,
      required: false,
    },
    onchain_batch_id: {
      type: Number,
      required: false,
    },
    onchain_tx_hash: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Movement Record Schema
const MovementRecordSchema = new Schema<IMovementRecord>(
  {
    batch_id: {
      type: Schema.Types.ObjectId,
      ref: "DrugBatch",
      required: true,
    },
    movement_type: {
      type: String,
      enum: [
        "manufactured",
        "received_by_pharmacist",
        "dispensed_to_patient",
        "returned",
        "destroyed",
      ],
      required: true,
    },
    from_address: {
      type: String,
      required: false,
    },
    to_address: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    transaction_hash: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    prescription_id: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: false,
    },
    onchain_movement_id: {
      type: Number,
      required: false,
    },
    onchain_tx_hash: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Dispensing Record Schema
const DispensingRecordSchema = new Schema<IDispensingRecord>(
  {
    batch_id: {
      type: Schema.Types.ObjectId,
      ref: "DrugBatch",
      required: true,
    },
    prescription_id: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    },
    patient_address: {
      type: String,
      required: true,
    },
    pharmacist_address: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    verification_hash: {
      type: String,
      required: true,
      unique: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verified_at: {
      type: Date,
      required: false,
    },
    onchain_dispensing_id: {
      type: Number,
      required: false,
    },
    onchain_tx_hash: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Traceability Audit Schema
const TraceabilityAuditSchema = new Schema<ITraceabilityAudit>(
  {
    batch_id: {
      type: Schema.Types.ObjectId,
      ref: "DrugBatch",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "batch_created",
        "movement_recorded",
        "dispensing_recorded",
        "verification_performed",
      ],
      required: true,
    },
    performed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockchain_tx_hash: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
DrugBatchSchema.index({ batch_number: 1 });
DrugBatchSchema.index({ drug_id: 1 });
DrugBatchSchema.index({ manufacturer_address: 1 });
DrugBatchSchema.index({ expiry_date: 1 });

MovementRecordSchema.index({ batch_id: 1 });
MovementRecordSchema.index({ movement_type: 1 });
MovementRecordSchema.index({ timestamp: 1 });

DispensingRecordSchema.index({ verification_hash: 1 });
DispensingRecordSchema.index({ patient_address: 1 });
DispensingRecordSchema.index({ batch_id: 1 });
DispensingRecordSchema.index({ prescription_id: 1 });

TraceabilityAuditSchema.index({ batch_id: 1 });
TraceabilityAuditSchema.index({ action: 1 });
TraceabilityAuditSchema.index({ timestamp: 1 });

// Export models
export const DrugBatch =
  mongoose.models.DrugBatch ||
  mongoose.model<IDrugBatch>("DrugBatch", DrugBatchSchema);

export const MovementRecord =
  mongoose.models.MovementRecord ||
  mongoose.model<IMovementRecord>("MovementRecord", MovementRecordSchema);

export const DispensingRecord =
  mongoose.models.DispensingRecord ||
  mongoose.model<IDispensingRecord>("DispensingRecord", DispensingRecordSchema);

export const TraceabilityAudit =
  mongoose.models.TraceabilityAudit ||
  mongoose.model<ITraceabilityAudit>(
    "TraceabilityAudit",
    TraceabilityAuditSchema
  );

// Helper function to get models (prevents module caching issues)
export const getTraceabilityModels = () => ({
  DrugBatch:
    mongoose.models.DrugBatch ||
    mongoose.model<IDrugBatch>("DrugBatch", DrugBatchSchema),
  MovementRecord:
    mongoose.models.MovementRecord ||
    mongoose.model<IMovementRecord>("MovementRecord", MovementRecordSchema),
  DispensingRecord:
    mongoose.models.DispensingRecord ||
    mongoose.model<IDispensingRecord>(
      "DispensingRecord",
      DispensingRecordSchema
    ),
  TraceabilityAudit:
    mongoose.models.TraceabilityAudit ||
    mongoose.model<ITraceabilityAudit>(
      "TraceabilityAudit",
      TraceabilityAuditSchema
    ),
});
