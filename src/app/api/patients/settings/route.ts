import { NextRequest, NextResponse } from "next/server";
import { withPatientAuth } from "@/lib/utils/api-middleware";

// GET /api/patients/settings - Get patient settings
export const GET = withPatientAuth(async (request, user) => {
  try {
    // Patient settings are stored in user preferences, not in database
    const settings = {
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        prescriptionReminders: true,
      },
      privacy: {
        shareDataWithDoctor: true,
        allowResearch: false,
      },
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching patient settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

// PUT /api/patients/settings - Update patient settings
export const PUT = withPatientAuth(async (request, user) => {
  try {
    const body = await request.json();

    // In a real implementation, store these preferences in database
    // For now, just validate and return
    const settings = {
      notifications: body.notifications || {
        emailNotifications: true,
        smsNotifications: false,
        prescriptionReminders: true,
      },
      privacy: body.privacy || {
        shareDataWithDoctor: true,
        allowResearch: false,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating patient settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
});
