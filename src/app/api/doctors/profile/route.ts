import { NextRequest, NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { Models } from "@/lib/database/models";

// GET /api/doctors/profile - Get doctor profile
export const GET = withDoctorAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const doctor = await Models.Doctor.findOne({ user_id: user.id })
      .populate("user_id", "name email")
      .lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: doctor,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
});

// PUT /api/doctors/profile - Update doctor profile
export const PUT = withDoctorAuth(async (request, user) => {
  try {
    const body = await request.json();

    // Validate allowed fields for update
    const allowedUpdates = [
      "specialization",
      "license_number",
      "phone",
      "availability",
    ];
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

    const updatedDoctor = await Models.Doctor.findOneAndUpdate(
      { user_id: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("user_id", "name email")
      .lean();

    if (!updatedDoctor) {
      return NextResponse.json(
        { success: false, message: "Doctor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
});
