import { NextRequest, NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { Models } from "@/lib/database/models";

// GET /api/doctors/settings - Get doctor settings
export const GET = withDoctorAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const doctor = await Models.Doctor.findOne({ user_id: user.id })
      .select("availability")
      .lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const settings = {
      availability: doctor.availability || {},
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
    console.error("Error fetching doctor settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

// PUT /api/doctors/settings - Update doctor settings
export const PUT = withDoctorAuth(async (request, user) => {
  try {
    const body = await request.json();

    await connectToDatabase();

    const updates: any = {};

    // Handle availability updates
    if (body.availability !== undefined) {
      updates.availability = body.availability;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid settings to update" },
        { status: 400 }
      );
    }

    const updatedDoctor = await Models.Doctor.findOneAndUpdate(
      { user_id: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("availability")
      .lean();

    if (!updatedDoctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const settings = {
      availability: updatedDoctor.availability || {},
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
    console.error("Error updating doctor settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
});
