import { NextRequest, NextResponse } from "next/server";
import { withPharmacistAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { Models } from "@/lib/database/models";

// GET /api/pharmacists/settings - Get pharmacist settings
export const GET = withPharmacistAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const pharmacist = await Models.Pharmacist.findOne({ user_id: user.id })
      .select("shift_hours")
      .lean();

    if (!pharmacist) {
      return NextResponse.json(
        { success: false, message: "Pharmacist not found" },
        { status: 404 }
      );
    }

    const settings = {
      shiftHours: pharmacist.shift_hours || {},
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
      },
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching pharmacist settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

// PUT /api/pharmacists/settings - Update pharmacist settings
export const PUT = withPharmacistAuth(async (request, user) => {
  try {
    const body = await request.json();

    await connectToDatabase();

    const updates: any = {};

    // Handle shift hours updates
    if (body.shiftHours !== undefined) {
      updates.shift_hours = body.shiftHours;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid settings to update" },
        { status: 400 }
      );
    }

    const updatedPharmacist = await Models.Pharmacist.findOneAndUpdate(
      { user_id: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("shift_hours")
      .lean();

    if (!updatedPharmacist) {
      return NextResponse.json(
        { success: false, message: "Pharmacist not found" },
        { status: 404 }
      );
    }

    const settings = {
      shiftHours: updatedPharmacist.shift_hours || {},
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating pharmacist settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
});
