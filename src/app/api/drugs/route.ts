import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import mongoose from "mongoose";
import { blockchainService } from "@/lib/services/BlockchainService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Get Drug model
const getDrugModel = () => {
  return (
    mongoose.models.Drug ||
    mongoose.model("Drug", new mongoose.Schema({}, { strict: false }))
  );
};

// Get InventoryTransaction model
const getInventoryTransactionModel = () => {
  return (
    mongoose.models.InventoryTransaction ||
    mongoose.model(
      "InventoryTransaction",
      new mongoose.Schema({}, { strict: false })
    )
  );
};

// Verify JWT token and extract user info
function verifyToken(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET: Fetch all drugs or specific drug
export async function GET(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    const { searchParams } = new URL(request.url);
    const drugId = searchParams.get("id");
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock");
    const expired = searchParams.get("expired");
    const search = searchParams.get("search");

    const DrugModel = getDrugModel();

    // Get specific drug
    if (drugId) {
      const drug = await DrugModel.findById(drugId);
      if (!drug) {
        return NextResponse.json({ error: "Drug not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: drug });
    }

    // Build query
    let query: any = {};

    if (category) {
      query.category = category;
    }

    if (lowStock === "true") {
      query.$expr = { $lte: ["$stock_quantity", "$minimum_stock_level"] };
    }

    if (expired === "true") {
      query.expiry_date = { $lt: new Date() };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { generic_name: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }

    const drugs = await DrugModel.find(query).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: drugs,
      count: drugs.length,
    });
  } catch (error: any) {
    console.error("Error fetching drugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch drugs", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Add new drug to inventory
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
    const {
      name,
      generic_name,
      dosage_form,
      strength,
      manufacturer,
      batch_number,
      expiry_date,
      stock_quantity,
      minimum_stock_level,
      unit_price,
      category,
      description,
      storage_requirements,
      side_effects,
      contraindications,
    } = body;

    // Validation
    if (!name || !dosage_form || !strength || !manufacturer || !expiry_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const DrugModel = getDrugModel();
    const InventoryTransactionModel = getInventoryTransactionModel();

    // Create blockchain transaction
    const blockchainTx = blockchainService.recordStockIn(
      "pending", // Will update after drug is created
      name,
      stock_quantity || 0,
      0, // Previous quantity for new drug
      user.userId,
      user.role,
      batch_number,
      `Initial stock for ${name}`
    );

    // Create drug
    const drug = await DrugModel.create({
      name,
      generic_name,
      dosage_form,
      strength,
      manufacturer,
      batch_number,
      expiry_date: new Date(expiry_date),
      stock_quantity: stock_quantity || 0,
      minimum_stock_level: minimum_stock_level || 10,
      unit_price,
      category,
      description,
      storage_requirements,
      side_effects,
      contraindications,
      blockchain_hash: blockchainTx.hash,
    });

    // Update blockchain with actual drug ID
    const updatedBlockchainTx = blockchainService.recordStockIn(
      drug._id.toString(),
      name,
      stock_quantity || 0,
      0,
      user.userId,
      user.role,
      batch_number,
      `Initial stock for ${name} (Drug ID: ${drug._id})`
    );

    // Update drug with correct blockchain hash
    drug.blockchain_hash = updatedBlockchainTx.hash;
    await drug.save();

    // Create inventory transaction record
    await InventoryTransactionModel.create({
      drug_id: drug._id,
      transaction_type: "stock_in",
      quantity: stock_quantity || 0,
      performed_by: user.userId,
      blockchain_transaction_hash: updatedBlockchainTx.hash,
      notes: `Initial stock for ${name}`,
    });

    console.log(`✅ Added drug: ${name} (${drug._id})`);
    console.log(
      `   Blockchain hash: ${updatedBlockchainTx.hash.substring(0, 16)}...`
    );

    return NextResponse.json(
      {
        success: true,
        data: drug,
        blockchainTransaction: updatedBlockchainTx,
        message: "Drug added successfully with blockchain traceability",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding drug:", error);
    return NextResponse.json(
      { error: "Failed to add drug", details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update drug stock or details
export async function PUT(request: NextRequest) {
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
    const { drugId, updates, transactionType, notes } = body;

    if (!drugId) {
      return NextResponse.json(
        { error: "Drug ID is required" },
        { status: 400 }
      );
    }

    const DrugModel = getDrugModel();
    const InventoryTransactionModel = getInventoryTransactionModel();

    const drug = await DrugModel.findById(drugId);
    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    const previousQuantity = drug.stock_quantity;
    let blockchainTx;

    // Handle stock quantity updates with blockchain
    if (updates.stock_quantity !== undefined) {
      const quantityChange = updates.stock_quantity - previousQuantity;

      if (quantityChange > 0) {
        // Stock increase
        blockchainTx = blockchainService.recordStockIn(
          drug._id.toString(),
          drug.name,
          quantityChange,
          previousQuantity,
          user.userId,
          user.role,
          drug.batch_number,
          notes || `Stock increased by ${quantityChange}`
        );

        await InventoryTransactionModel.create({
          drug_id: drug._id,
          transaction_type: "stock_in",
          quantity: quantityChange,
          performed_by: user.userId,
          blockchain_transaction_hash: blockchainTx.hash,
          notes: notes || `Stock increased by ${quantityChange}`,
        });
      } else if (quantityChange < 0) {
        // Stock decrease (adjustment)
        blockchainTx = blockchainService.recordAdjustment(
          drug._id.toString(),
          drug.name,
          Math.abs(quantityChange),
          previousQuantity,
          updates.stock_quantity,
          user.userId,
          user.role,
          notes || `Stock adjusted: ${quantityChange}`
        );

        await InventoryTransactionModel.create({
          drug_id: drug._id,
          transaction_type: transactionType || "damaged",
          quantity: Math.abs(quantityChange),
          performed_by: user.userId,
          blockchain_transaction_hash: blockchainTx.hash,
          notes: notes || `Stock decreased by ${Math.abs(quantityChange)}`,
        });
      }

      updates.blockchain_hash = blockchainTx?.hash || drug.blockchain_hash;
    }

    // Update drug
    Object.assign(drug, updates);
    await drug.save();

    console.log(`✅ Updated drug: ${drug.name} (${drug._id})`);
    if (blockchainTx) {
      console.log(
        `   Blockchain hash: ${blockchainTx.hash.substring(0, 16)}...`
      );
    }

    return NextResponse.json({
      success: true,
      data: drug,
      blockchainTransaction: blockchainTx,
      message: "Drug updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating drug:", error);
    return NextResponse.json(
      { error: "Failed to update drug", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove drug from inventory
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const drugId = searchParams.get("id");

    if (!drugId) {
      return NextResponse.json(
        { error: "Drug ID is required" },
        { status: 400 }
      );
    }

    const DrugModel = getDrugModel();
    const drug = await DrugModel.findById(drugId);

    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    // Record in blockchain before deletion
    const blockchainTx = blockchainService.recordExpiry(
      drug._id.toString(),
      drug.name,
      drug.stock_quantity,
      drug.stock_quantity,
      user.userId,
      user.role,
      drug.batch_number,
      "Drug removed from inventory"
    );

    await DrugModel.findByIdAndDelete(drugId);

    console.log(`✅ Deleted drug: ${drug.name} (${drugId})`);
    console.log(`   Blockchain hash: ${blockchainTx.hash.substring(0, 16)}...`);

    return NextResponse.json({
      success: true,
      message: "Drug deleted successfully",
      blockchainTransaction: blockchainTx,
    });
  } catch (error: any) {
    console.error("Error deleting drug:", error);
    return NextResponse.json(
      { error: "Failed to delete drug", details: error.message },
      { status: 500 }
    );
  }
}
