import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import mongoose from "mongoose";
import { blockchainService } from "@/lib/services/BlockchainService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Get models
const getPrescriptionModel = () => {
  return (
    mongoose.models.Prescription ||
    mongoose.model("Prescription", new mongoose.Schema({}, { strict: false }))
  );
};

const getDrugModel = () => {
  return (
    mongoose.models.Drug ||
    mongoose.model("Drug", new mongoose.Schema({}, { strict: false }))
  );
};

const getInventoryTransactionModel = () => {
  return (
    mongoose.models.InventoryTransaction ||
    mongoose.model(
      "InventoryTransaction",
      new mongoose.Schema({}, { strict: false })
    )
  );
};

// Verify JWT token
function verifyToken(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// POST: Dispense prescription with automatic stock deduction
export async function POST(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    // Verify authentication
    const user = verifyToken(request);
    if (!user || user.role !== "pharmacist") {
      return NextResponse.json(
        { error: "Unauthorized. Pharmacist access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prescriptionId, quantityDispensed, notes } = body;

    if (!prescriptionId || !quantityDispensed) {
      return NextResponse.json(
        { error: "Prescription ID and quantity are required" },
        { status: 400 }
      );
    }

    const PrescriptionModel = getPrescriptionModel();
    const DrugModel = getDrugModel();
    const InventoryTransactionModel = getInventoryTransactionModel();

    // Get prescription
    const prescription = await PrescriptionModel.findById(prescriptionId)
      .populate("drug_id")
      .populate("patient_id");

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === "dispensed") {
      return NextResponse.json(
        { error: "Prescription already dispensed" },
        { status: 400 }
      );
    }

    if (prescription.status !== "verified") {
      return NextResponse.json(
        { error: "Prescription must be verified before dispensing" },
        { status: 400 }
      );
    }

    // Get drug
    const drug = await DrugModel.findById(
      prescription.drug_id._id || prescription.drug_id
    );

    if (!drug) {
      return NextResponse.json(
        { error: "Drug not found in inventory" },
        { status: 404 }
      );
    }

    // Check if enough stock available
    if (drug.stock_quantity < quantityDispensed) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          available: drug.stock_quantity,
          requested: quantityDispensed,
        },
        { status: 400 }
      );
    }

    // Check if drug is expired
    if (new Date(drug.expiry_date) < new Date()) {
      return NextResponse.json(
        { error: "Cannot dispense expired drug" },
        { status: 400 }
      );
    }

    const previousQuantity = drug.stock_quantity;
    const newQuantity = previousQuantity - quantityDispensed;

    // Record in blockchain
    const blockchainTx = blockchainService.recordDispensing(
      drug._id.toString(),
      drug.name,
      quantityDispensed,
      previousQuantity,
      user.userId,
      user.role,
      prescription._id.toString(),
      notes || `Dispensed for prescription ${prescription._id}`
    );

    // Update drug stock
    drug.stock_quantity = newQuantity;
    drug.blockchain_hash = blockchainTx.hash;
    await drug.save();

    // Update prescription
    prescription.quantity_dispensed = quantityDispensed;
    prescription.status = "dispensed";
    prescription.date_dispensed = new Date();
    prescription.pharmacist_id = user.userId;
    prescription.blockchain_hash = blockchainTx.hash;
    if (notes) {
      prescription.notes = notes;
    }
    await prescription.save();

    // Create inventory transaction record
    await InventoryTransactionModel.create({
      drug_id: drug._id,
      transaction_type: "dispensed",
      quantity: quantityDispensed,
      prescription_id: prescription._id,
      performed_by: user.userId,
      blockchain_transaction_hash: blockchainTx.hash,
      notes: notes || `Dispensed for prescription ${prescription._id}`,
    });

    console.log(`✅ Prescription dispensed: ${prescription._id}`);
    console.log(`   Drug: ${drug.name}`);
    console.log(`   Quantity: ${quantityDispensed}`);
    console.log(`   New stock: ${newQuantity}`);
    console.log(`   Blockchain hash: ${blockchainTx.hash.substring(0, 16)}...`);

    // Check if stock is now low
    let lowStockAlert = null;
    if (newQuantity <= drug.minimum_stock_level) {
      lowStockAlert = {
        type: "low_stock",
        drug: drug.name,
        currentStock: newQuantity,
        minimumLevel: drug.minimum_stock_level,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        prescription,
        drug: {
          _id: drug._id,
          name: drug.name,
          previousStock: previousQuantity,
          newStock: newQuantity,
          minimumLevel: drug.minimum_stock_level,
        },
        blockchainTransaction: {
          transactionId: blockchainTx.transactionId,
          hash: blockchainTx.hash,
          timestamp: blockchainTx.timestamp,
        },
        lowStockAlert,
      },
      message:
        "Prescription dispensed successfully with automatic stock deduction",
    });
  } catch (error: any) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json(
      { error: "Failed to dispense prescription", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Get dispensing history
export async function GET(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get("prescriptionId");
    const drugId = searchParams.get("drugId");

    const InventoryTransactionModel = getInventoryTransactionModel();

    let query: any = { transaction_type: "dispensed" };

    if (prescriptionId) {
      query.prescription_id = prescriptionId;
    }

    if (drugId) {
      query.drug_id = drugId;
    }

    const transactions = await InventoryTransactionModel.find(query)
      .populate("drug_id", "name generic_name")
      .populate("prescription_id")
      .populate("performed_by", "username email")
      .sort({ timestamp: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    console.error("Error fetching dispensing history:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispensing history", details: error.message },
      { status: 500 }
    );
  }
}
