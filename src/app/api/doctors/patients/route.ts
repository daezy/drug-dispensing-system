import { NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import {
  PrescriptionModel,
  DoctorModel,
  PatientModel,
} from "@/lib/database/models";

export const GET = withDoctorAuth(async (request, user) => {
  try {
    await connectToDatabase();

    // Find the doctor record for this user
    const doctor = await DoctorModel.findOne({ user_id: user.id });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor profile not found",
        },
        { status: 404 }
      );
    }

    // Find all unique patients who have prescriptions from this doctor
    const prescriptions = await PrescriptionModel.find({
      doctor_id: doctor._id,
    })
      .distinct("patient_id")
      .lean();

    // Get full patient details
    const patients = await PatientModel.find({
      _id: { $in: prescriptions },
    })
      .populate("user_id")
      .lean();

    // Format patients for frontend
    const formattedPatients = await Promise.all(
      patients.map(async (patient: any) => {
        // Count prescriptions for this patient from this doctor
        const prescriptionCount = await PrescriptionModel.countDocuments({
          patient_id: patient._id,
          doctor_id: doctor._id,
        });

        const userInfo = patient.user_id;

        return {
          id: patient._id.toString(),
          name: userInfo?.username || "Unknown Patient",
          email: userInfo?.email || patient.contact_info?.email,
          phone: patient.contact_info?.phone,
          dateOfBirth: patient.date_of_birth,
          age: patient.date_of_birth
            ? Math.floor(
                (Date.now() - new Date(patient.date_of_birth).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )
            : null,
          medicalRecordNumber: patient.medical_record_number,
          allergies: patient.allergies,
          medicalHistory: patient.medical_history,
          emergencyContact: patient.emergency_contact,
          prescriptionCount,
          lastVisit: null, // Visits tracking requires separate appointments/visits collection
        };
      })
    );

    return NextResponse.json({
      success: true,
      patients: formattedPatients,
    });
  } catch (error) {
    console.error("Error fetching doctor's patients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
});
