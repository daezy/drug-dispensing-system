import { NextResponse } from "next/server";
import { withPatientAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import {
  PrescriptionModel,
  PatientModel,
  DoctorModel,
} from "@/lib/database/models";

export const GET = withPatientAuth(async (request, user) => {
  try {
    await connectToDatabase();

    // Find the patient record for this user
    const patient = await PatientModel.findOne({ user_id: user.id });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient profile not found",
        },
        { status: 404 }
      );
    }

    // Find all unique doctors who prescribed to this patient
    const doctorIds = await PrescriptionModel.find({
      patient_id: patient._id,
    })
      .distinct("doctor_id")
      .lean();

    // Get full doctor details
    const doctors = await DoctorModel.find({
      _id: { $in: doctorIds },
    })
      .populate("user_id")
      .lean();

    // Format doctors for frontend
    const formattedDoctors = await Promise.all(
      doctors.map(async (doctor: any) => {
        // Count prescriptions from this doctor to this patient
        const prescriptionCount = await PrescriptionModel.countDocuments({
          patient_id: patient._id,
          doctor_id: doctor._id,
        });

        // Get last prescription date
        const lastPrescription: any = await PrescriptionModel.findOne({
          patient_id: patient._id,
          doctor_id: doctor._id,
        })
          .sort({ date_issued: -1 })
          .select("date_issued")
          .lean();

        const userInfo = doctor.user_id;

        return {
          id: doctor._id.toString(),
          name: userInfo?.username || "Unknown Doctor",
          email: userInfo?.email || doctor.contact_info?.email,
          phone: doctor.contact_info?.phone,
          specialty: doctor.specialization || "General",
          licenseNumber: doctor.license_number,
          prescriptionCount,
          lastVisit: lastPrescription?.date_issued || null,
          verificationStatus: doctor.verification_status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
    });
  } catch (error) {
    console.error("Error fetching patient's doctors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
});
