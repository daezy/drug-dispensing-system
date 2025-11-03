/**
 * ReportingService
 * Handles data aggregation, analytics, and fraud detection for compliance reporting
 */

import { DatabaseManager } from "../database/connection";
import mongoose from "mongoose";

export interface DashboardMetrics {
  dispensedDrugs: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number; // percentage change from last period
  };
  pendingPrescriptions: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    expired: number;
  };
  stockLevels: {
    totalDrugs: number;
    lowStock: number;
    outOfStock: number;
    expired: number;
    expiringThisMonth: number;
  };
  fraudAlerts: {
    total: number;
    critical: number;
    medium: number;
    low: number;
    recentAlerts: FraudAlert[];
  };
}

export interface FraudAlert {
  id: string;
  type:
    | "duplicate_prescription"
    | "excessive_dispensing"
    | "expired_drug_dispensed"
    | "unusual_quantity"
    | "rapid_refills"
    | "suspicious_pattern";
  severity: "critical" | "medium" | "low";
  description: string;
  relatedEntity: {
    type: "prescription" | "drug" | "user";
    id: string;
    name: string;
  };
  detectedAt: Date;
  status: "new" | "investigating" | "resolved" | "false_positive";
}

export interface DispensedDrugReport {
  id: string;
  drugName: string;
  batchNumber?: string;
  patientName: string;
  pharmacistName: string;
  quantity: number;
  dispensedAt: Date;
  prescriptionId: string;
  verificationHash?: string;
}

export interface StockLevelReport {
  id: string;
  drugName: string;
  genericName?: string;
  currentStock: number;
  minimumLevel: number;
  status: "in_stock" | "low_stock" | "out_of_stock" | "expired";
  expiryDate: Date;
  batchNumber?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  performedBy: string;
  userRole: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress?: string;
  blockchainTxHash?: string;
}

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await DatabaseManager.getInstance().ensureConnection();

    const [dispensed, prescriptions, stock, fraud] = await Promise.all([
      this.getDispensedDrugsMetrics(),
      this.getPrescriptionMetrics(),
      this.getStockLevelMetrics(),
      this.getFraudAlerts(),
    ]);

    return {
      dispensedDrugs: dispensed,
      pendingPrescriptions: prescriptions,
      stockLevels: stock,
      fraudAlerts: fraud,
    };
  }

  /**
   * Get dispensed drugs metrics
   */
  private async getDispensedDrugsMetrics() {
    const Prescription = this.getPrescriptionModel();

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [total, today, thisWeek, thisMonth, lastMonth] = await Promise.all([
      Prescription.countDocuments({ status: "dispensed" }),
      Prescription.countDocuments({
        status: "dispensed",
        date_dispensed: { $gte: startOfToday },
      }),
      Prescription.countDocuments({
        status: "dispensed",
        date_dispensed: { $gte: startOfWeek },
      }),
      Prescription.countDocuments({
        status: "dispensed",
        date_dispensed: { $gte: startOfMonth },
      }),
      Prescription.countDocuments({
        status: "dispensed",
        date_dispensed: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    const trend =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      trend: Math.round(trend * 10) / 10,
    };
  }

  /**
   * Get prescription metrics
   */
  private async getPrescriptionMetrics() {
    const Prescription = this.getPrescriptionModel();

    const [total, pending, verified, rejected, expired] = await Promise.all([
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: "pending" }),
      Prescription.countDocuments({ status: "verified" }),
      Prescription.countDocuments({ status: "rejected" }),
      Prescription.countDocuments({ status: "expired" }),
    ]);

    return {
      total,
      pending,
      verified,
      rejected,
      expired,
    };
  }

  /**
   * Get stock level metrics
   */
  private async getStockLevelMetrics() {
    const Drug = this.getDrugModel();

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const drugs = await Drug.find();

    let lowStock = 0;
    let outOfStock = 0;
    let expired = 0;
    let expiringThisMonth = 0;

    drugs.forEach((drug: any) => {
      if (drug.stock_quantity === 0) {
        outOfStock++;
      } else if (drug.stock_quantity <= drug.minimum_stock_level) {
        lowStock++;
      }

      const expiryDate = new Date(drug.expiry_date);
      if (expiryDate < now) {
        expired++;
      } else if (expiryDate <= endOfMonth) {
        expiringThisMonth++;
      }
    });

    return {
      totalDrugs: drugs.length,
      lowStock,
      outOfStock,
      expired,
      expiringThisMonth,
    };
  }

  /**
   * Get fraud detection alerts
   */
  private async getFraudAlerts() {
    const alerts = await this.detectFraud();

    const critical = alerts.filter((a) => a.severity === "critical").length;
    const medium = alerts.filter((a) => a.severity === "medium").length;
    const low = alerts.filter((a) => a.severity === "low").length;

    return {
      total: alerts.length,
      critical,
      medium,
      low,
      recentAlerts: alerts.slice(0, 10),
    };
  }

  /**
   * Detect fraud and irregularities
   */
  async detectFraud(): Promise<FraudAlert[]> {
    await DatabaseManager.getInstance().ensureConnection();

    const alerts: FraudAlert[] = [];

    // Run all fraud detection checks in parallel
    const [
      duplicates,
      excessive,
      expiredDispensed,
      rapidRefills,
      unusualQuantities,
    ] = await Promise.all([
      this.detectDuplicatePrescriptions(),
      this.detectExcessiveDispensing(),
      this.detectExpiredDrugDispensing(),
      this.detectRapidRefills(),
      this.detectUnusualQuantities(),
    ]);

    alerts.push(
      ...duplicates,
      ...excessive,
      ...expiredDispensed,
      ...rapidRefills,
      ...unusualQuantities
    );

    return alerts.sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime()
    );
  }

  /**
   * Detect duplicate prescriptions
   */
  private async detectDuplicatePrescriptions(): Promise<FraudAlert[]> {
    const Prescription = this.getPrescriptionModel();
    const alerts: FraudAlert[] = [];

    const duplicates = await Prescription.aggregate([
      {
        $match: {
          status: { $in: ["pending", "verified", "dispensed"] },
          date_issued: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
      {
        $group: {
          _id: {
            patient_id: "$patient_id",
            drug_id: "$drug_id",
            doctor_id: "$doctor_id",
          },
          count: { $sum: 1 },
          prescriptions: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    for (const dup of duplicates) {
      alerts.push({
        id: `fraud_${Date.now()}_${Math.random()}`,
        type: "duplicate_prescription",
        severity: "critical",
        description: `${dup.count} duplicate prescriptions detected for the same patient, drug, and doctor within 30 days`,
        relatedEntity: {
          type: "prescription",
          id: dup.prescriptions[0]._id.toString(),
          name: `Prescription ${dup.prescriptions[0]._id
            .toString()
            .substring(0, 8)}`,
        },
        detectedAt: new Date(),
        status: "new",
      });
    }

    return alerts;
  }

  /**
   * Detect excessive dispensing
   */
  private async detectExcessiveDispensing(): Promise<FraudAlert[]> {
    const Prescription = this.getPrescriptionModel();
    const alerts: FraudAlert[] = [];

    const excessive = await Prescription.find({
      $expr: { $gt: ["$quantity_dispensed", "$quantity_prescribed"] },
    }).populate("drug_id", "name");

    for (const prescription of excessive) {
      alerts.push({
        id: `fraud_${Date.now()}_${Math.random()}`,
        type: "excessive_dispensing",
        severity: "critical",
        description: `Dispensed quantity (${
          (prescription as any).quantity_dispensed
        }) exceeds prescribed quantity (${
          (prescription as any).quantity_prescribed
        })`,
        relatedEntity: {
          type: "prescription",
          id: (prescription as any)._id.toString(),
          name: `Prescription for ${
            (prescription as any).drug_id?.name || "Unknown Drug"
          }`,
        },
        detectedAt: new Date(),
        status: "new",
      });
    }

    return alerts;
  }

  /**
   * Detect expired drug dispensing
   */
  private async detectExpiredDrugDispensing(): Promise<FraudAlert[]> {
    const Prescription = this.getPrescriptionModel();
    const Drug = this.getDrugModel();
    const alerts: FraudAlert[] = [];

    const recentDispensed = await Prescription.find({
      status: "dispensed",
      date_dispensed: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    }).populate("drug_id");

    for (const prescription of recentDispensed) {
      const drug = (prescription as any).drug_id;
      if (
        drug &&
        new Date(drug.expiry_date) <
          new Date((prescription as any).date_dispensed)
      ) {
        alerts.push({
          id: `fraud_${Date.now()}_${Math.random()}`,
          type: "expired_drug_dispensed",
          severity: "critical",
          description: `Expired drug "${
            drug.name
          }" was dispensed (expired: ${new Date(
            drug.expiry_date
          ).toLocaleDateString()})`,
          relatedEntity: {
            type: "drug",
            id: drug._id.toString(),
            name: drug.name,
          },
          detectedAt: new Date(),
          status: "new",
        });
      }
    }

    return alerts;
  }

  /**
   * Detect rapid refills
   */
  private async detectRapidRefills(): Promise<FraudAlert[]> {
    const Prescription = this.getPrescriptionModel();
    const alerts: FraudAlert[] = [];

    const rapidRefills = await Prescription.aggregate([
      {
        $match: {
          status: "dispensed",
          date_dispensed: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            patient_id: "$patient_id",
            drug_id: "$drug_id",
          },
          count: { $sum: 1 },
          dates: { $push: "$date_dispensed" },
          prescriptions: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gte: 3 }, // 3 or more refills in 30 days
        },
      },
    ]);

    for (const refill of rapidRefills) {
      alerts.push({
        id: `fraud_${Date.now()}_${Math.random()}`,
        type: "rapid_refills",
        severity: "medium",
        description: `Patient has ${refill.count} refills of the same drug within 30 days`,
        relatedEntity: {
          type: "prescription",
          id: refill.prescriptions[0]._id.toString(),
          name: `Multiple refills detected`,
        },
        detectedAt: new Date(),
        status: "new",
      });
    }

    return alerts;
  }

  /**
   * Detect unusual quantities
   */
  private async detectUnusualQuantities(): Promise<FraudAlert[]> {
    const Prescription = this.getPrescriptionModel();
    const alerts: FraudAlert[] = [];

    // Find prescriptions with unusually high quantities (e.g., > 90 days supply)
    const unusual = await Prescription.find({
      quantity_prescribed: { $gt: 180 }, // More than 180 units
      status: { $in: ["verified", "dispensed"] },
      date_issued: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }).populate("drug_id", "name");

    for (const prescription of unusual) {
      alerts.push({
        id: `fraud_${Date.now()}_${Math.random()}`,
        type: "unusual_quantity",
        severity: "medium",
        description: `Unusually high quantity prescribed: ${
          (prescription as any).quantity_prescribed
        } units`,
        relatedEntity: {
          type: "prescription",
          id: (prescription as any)._id.toString(),
          name: `High quantity for ${
            (prescription as any).drug_id?.name || "Unknown Drug"
          }`,
        },
        detectedAt: new Date(),
        status: "new",
      });
    }

    return alerts;
  }

  /**
   * Get dispensed drugs report
   */
  async getDispensedDrugsReport(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<DispensedDrugReport[]> {
    await DatabaseManager.getInstance().ensureConnection();
    const Prescription = this.getPrescriptionModel();

    const query: any = { status: "dispensed" };
    if (startDate || endDate) {
      query.date_dispensed = {};
      if (startDate) query.date_dispensed.$gte = startDate;
      if (endDate) query.date_dispensed.$lte = endDate;
    }

    const prescriptions = await Prescription.find(query)
      .populate("drug_id", "name batch_number")
      .populate("patient_id")
      .populate("pharmacist_id")
      .sort({ date_dispensed: -1 })
      .limit(limit);

    return prescriptions.map((p: any) => ({
      id: p._id.toString(),
      drugName: p.drug_id?.name || "Unknown",
      batchNumber: p.drug_id?.batch_number,
      patientName: p.patient_id?.user_id?.username || "Unknown Patient",
      pharmacistName:
        p.pharmacist_id?.user_id?.username || "Unknown Pharmacist",
      quantity: p.quantity_dispensed,
      dispensedAt: p.date_dispensed,
      prescriptionId: p._id.toString(),
      verificationHash: p.blockchain_hash,
    }));
  }

  /**
   * Get stock levels report
   */
  async getStockLevelsReport(): Promise<StockLevelReport[]> {
    await DatabaseManager.getInstance().ensureConnection();
    const Drug = this.getDrugModel();

    const drugs = await Drug.find().sort({ stock_quantity: 1 });

    return drugs.map((drug: any) => {
      let status: "in_stock" | "low_stock" | "out_of_stock" | "expired" =
        "in_stock";

      if (new Date(drug.expiry_date) < new Date()) {
        status = "expired";
      } else if (drug.stock_quantity === 0) {
        status = "out_of_stock";
      } else if (drug.stock_quantity <= drug.minimum_stock_level) {
        status = "low_stock";
      }

      return {
        id: drug._id.toString(),
        drugName: drug.name,
        genericName: drug.generic_name,
        currentStock: drug.stock_quantity,
        minimumLevel: drug.minimum_stock_level,
        status,
        expiryDate: drug.expiry_date,
        batchNumber: drug.batch_number,
      };
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<AuditLogEntry[]> {
    await DatabaseManager.getInstance().ensureConnection();
    const PrescriptionAudit = this.getPrescriptionAuditModel();
    const InventoryTransaction = this.getInventoryTransactionModel();

    const query: any = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const [prescriptionAudits, inventoryAudits] = await Promise.all([
      PrescriptionAudit.find(query)
        .populate("performed_by", "username role")
        .populate("prescription_id")
        .sort({ timestamp: -1 })
        .limit(limit / 2),
      InventoryTransaction.find(query)
        .populate("performed_by", "username role")
        .populate("drug_id", "name")
        .sort({ timestamp: -1 })
        .limit(limit / 2),
    ]);

    const logs: AuditLogEntry[] = [];

    prescriptionAudits.forEach((audit: any) => {
      logs.push({
        id: audit._id.toString(),
        timestamp: audit.timestamp,
        action: `Prescription ${audit.action}`,
        performedBy: audit.performed_by?.username || "Unknown",
        userRole: audit.performed_by?.role || "Unknown",
        entityType: "prescription",
        entityId: audit.prescription_id?._id?.toString() || "",
        details: audit.details,
        blockchainTxHash: audit.blockchain_transaction_hash,
      });
    });

    inventoryAudits.forEach((audit: any) => {
      logs.push({
        id: audit._id.toString(),
        timestamp: audit.timestamp,
        action: `Inventory ${audit.transaction_type}`,
        performedBy: audit.performed_by?.username || "Unknown",
        userRole: audit.performed_by?.role || "Unknown",
        entityType: "drug",
        entityId: audit.drug_id?._id?.toString() || "",
        details: {
          drug_name: audit.drug_id?.name,
          quantity: audit.quantity,
          notes: audit.notes,
        },
        blockchainTxHash: audit.blockchain_transaction_hash,
      });
    });

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Helper methods to get models
  private getPrescriptionModel() {
    return (
      mongoose.models.Prescription ||
      mongoose.model("Prescription", new mongoose.Schema({}, { strict: false }))
    );
  }

  private getDrugModel() {
    return (
      mongoose.models.Drug ||
      mongoose.model("Drug", new mongoose.Schema({}, { strict: false }))
    );
  }

  private getPrescriptionAuditModel() {
    return (
      mongoose.models.PrescriptionAudit ||
      mongoose.model(
        "PrescriptionAudit",
        new mongoose.Schema({}, { strict: false })
      )
    );
  }

  private getInventoryTransactionModel() {
    return (
      mongoose.models.InventoryTransaction ||
      mongoose.model(
        "InventoryTransaction",
        new mongoose.Schema({}, { strict: false })
      )
    );
  }
}

export const reportingService = ReportingService.getInstance();
