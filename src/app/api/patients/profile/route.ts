import { NextRequest, NextResponse } from "next/server";
import { withPatientAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { Models } from "@/lib/database/models";

// GET /api/patients/profile - Get patient profile
export const GET = withPatientAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const patient = await Models.Patient.findOne({ user_id: user.id })
      .populate("user_id", "name email")
      .lean();

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: patient,
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
});

// PUT /api/patients/profile - Update patient profile
export const PUT = withPatientAuth(async (request, user) => {
  try {
    const body = await request.json();

    // Validate allowed fields for update
    const allowedUpdates = [
      "date_of_birth",
      "phone",
      "address",
      "allergies",
      "medical_history",
      "emergency_contact",
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

    const updatedPatient = await Models.Patient.findOneAndUpdate(
      { user_id: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("user_id", "name email")
      .lean();

    if (!updatedPatient) {
      return NextResponse.json(
        { success: false, message: "Patient profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
});
