import { NextRequest, NextResponse } from "next/server";
import { withPharmacistAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { Models } from "@/lib/database/models";

// GET /api/pharmacists/profile - Get pharmacist profile
export const GET = withPharmacistAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const pharmacist = await Models.Pharmacist.findOne({ user_id: user.id })
      .populate("user_id", "name email")
      .populate("pharmacy_id", "name address city state")
      .lean();

    if (!pharmacist) {
      return NextResponse.json(
        { success: false, message: "Pharmacist profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: pharmacist,
    });
  } catch (error) {
    console.error("Error fetching pharmacist profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
});

// PUT /api/pharmacists/profile - Update pharmacist profile
export const PUT = withPharmacistAuth(async (request, user) => {
  try {
    const body = await request.json();

    // Validate allowed fields for update
    const allowedUpdates = ["license_number", "phone", "shift_hours"];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedPharmacist = await Models.Pharmacist.findOneAndUpdate(
      { user_id: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("user_id", "name email")
      .populate("pharmacy_id", "name address city state")
      .lean();

    if (!updatedPharmacist) {
      return NextResponse.json(
        { success: false, message: "Pharmacist profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedPharmacist,
    });
  } catch (error) {
    console.error("Error updating pharmacist profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
});
