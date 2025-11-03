import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database/connection";
import mongoose from "mongoose";
import { blockchainService } from "@/lib/services/BlockchainService";

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

// GET: Generate inventory reports
export async function GET(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type"); // 'summary', 'transactions', 'blockchain', 'valuation'
    const drugId = searchParams.get("drugId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const DrugModel = getDrugModel();
    const InventoryTransactionModel = getInventoryTransactionModel();

    // Summary Report
    if (!reportType || reportType === "summary") {
      const totalDrugs = await DrugModel.countDocuments();
      const lowStockDrugs = await DrugModel.countDocuments({
        $expr: { $lte: ["$stock_quantity", "$minimum_stock_level"] },
      });
      const expiredDrugs = await DrugModel.countDocuments({
        expiry_date: { $lt: new Date() },
      });
      const expiringDrugs = await DrugModel.countDocuments({
        expiry_date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const drugs = await DrugModel.find();
      const totalValue = drugs.reduce(
        (sum, drug) => sum + (drug.unit_price || 0) * drug.stock_quantity,
        0
      );
      const totalQuantity = drugs.reduce(
        (sum, drug) => sum + drug.stock_quantity,
        0
      );

      // Category breakdown
      const categoryBreakdown = await DrugModel.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalQuantity: { $sum: "$stock_quantity" },
            totalValue: {
              $sum: {
                $multiply: ["$stock_quantity", { $ifNull: ["$unit_price", 0] }],
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalDrugs,
            totalQuantity,
            totalValue: totalValue.toFixed(2),
            lowStockDrugs,
            expiredDrugs,
            expiringDrugs,
          },
          categoryBreakdown,
        },
      });
    }

    // Transaction History Report
    if (reportType === "transactions") {
      let query: any = {};

      if (drugId) {
        query.drug_id = drugId;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      const transactions = await InventoryTransactionModel.find(query)
        .populate("drug_id", "name generic_name")
        .populate("performed_by", "username email")
        .sort({ timestamp: -1 })
        .limit(100);

      return NextResponse.json({
        success: true,
        data: transactions,
        count: transactions.length,
      });
    }

    // Blockchain Report
    if (reportType === "blockchain") {
      const blockchainStats = blockchainService.getStatistics();
      const recentTransactions = blockchainService.getRecentTransactions(20);

      let drugHistory;
      if (drugId) {
        drugHistory = blockchainService.getDrugHistory(drugId);
      }

      return NextResponse.json({
        success: true,
        data: {
          statistics: blockchainStats,
          recentTransactions,
          drugHistory: drugHistory || null,
        },
      });
    }

    // Valuation Report
    if (reportType === "valuation") {
      const drugs = await DrugModel.find({
        unit_price: { $exists: true, $ne: null },
      }).sort({ unit_price: -1 });

      const valuationData = drugs.map((drug) => ({
        drug_id: drug._id,
        name: drug.name,
        stock_quantity: drug.stock_quantity,
        unit_price: drug.unit_price,
        total_value: (drug.unit_price || 0) * drug.stock_quantity,
        category: drug.category,
        expiry_date: drug.expiry_date,
      }));

      const totalInventoryValue = valuationData.reduce(
        (sum, item) => sum + item.total_value,
        0
      );

      return NextResponse.json({
        success: true,
        data: {
          totalInventoryValue: totalInventoryValue.toFixed(2),
          items: valuationData,
          itemCount: valuationData.length,
        },
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}
