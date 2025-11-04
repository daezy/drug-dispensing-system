// API endpoint to fetch all patients with their patient IDs
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connection";
import { UserModel, PatientModel } from "@/lib/database/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all users with patient role
    const patientUsers = await UserModel.find({ role: "patient" }).lean();

    // Fetch corresponding patient data with medical_record_number (patientId)
    const patients = await Promise.all(
      patientUsers.map(async (user: any) => {
        const patientData: any = await PatientModel.findOne({
          user_id: user._id,
        }).lean();

        return {
          id: user._id.toString(),
          patientId: patientData?.medical_record_number || null,
          firstName: user.username?.split(" ")[0] || user.username || "",
          lastName: user.username?.split(" ").slice(1).join(" ") || "",
          email: user.email,
          phone: patientData?.contact_info?.phone || null,
          dateOfBirth: patientData?.date_of_birth || null,
          allergies: patientData?.allergies || null,
          medicalHistory: patientData?.medical_history || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      patients: patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch patients",
      },
      { status: 500 }
    );
  }
}
