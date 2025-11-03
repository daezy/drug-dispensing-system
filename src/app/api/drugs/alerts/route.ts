import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import mongoose from "mongoose";

// Get Drug model
const getDrugModel = () => {
  return (
    mongoose.models.Drug ||
    mongoose.model("Drug", new mongoose.Schema({}, { strict: false }))
  );
};

// GET: Fetch alerts (low stock, expiring, expired drugs)
export async function GET(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'low-stock', 'expiring', 'expired', 'all'
    const days = parseInt(searchParams.get("days") || "30"); // Days to check for expiring

    const DrugModel = getDrugModel();

    let result: any = {
      success: true,
      data: {
        lowStock: [],
        expiring: [],
        expired: [],
      },
      counts: {
        lowStock: 0,
        expiring: 0,
        expired: 0,
      },
    };

    const now = new Date();
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);

    // Get low stock drugs
    if (!type || type === "all" || type === "low-stock") {
      const lowStockDrugs = await DrugModel.find({
        $expr: { $lte: ["$stock_quantity", "$minimum_stock_level"] },
      }).sort({ stock_quantity: 1 });

      result.data.lowStock = lowStockDrugs;
      result.counts.lowStock = lowStockDrugs.length;
    }

    // Get expiring drugs (within specified days)
    if (!type || type === "all" || type === "expiring") {
      const expiringDrugs = await DrugModel.find({
        expiry_date: {
          $gte: now,
          $lte: expiringDate,
        },
      }).sort({ expiry_date: 1 });

      result.data.expiring = expiringDrugs;
      result.counts.expiring = expiringDrugs.length;
    }

    // Get expired drugs
    if (!type || type === "all" || type === "expired") {
      const expiredDrugs = await DrugModel.find({
        expiry_date: { $lt: now },
      }).sort({ expiry_date: -1 });

      result.data.expired = expiredDrugs;
      result.counts.expired = expiredDrugs.length;
    }

    result.message = `Found ${result.counts.lowStock} low stock, ${result.counts.expiring} expiring, and ${result.counts.expired} expired drugs`;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: error.message },
      { status: 500 }
    );
  }
}
