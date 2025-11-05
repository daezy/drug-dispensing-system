import { NextResponse } from "next/server";
import { withPharmacistAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import {
  PrescriptionModel,
  PharmacistModel,
  PatientModel,
} from "@/lib/database/models";

export const GET = withPharmacistAuth(async (request, user) => {
  try {
    await connectToDatabase();

    // Find the pharmacist record for this user
    const pharmacist = await PharmacistModel.findOne({ user_id: user.id });

    if (!pharmacist) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacist profile not found",
        },
        { status: 404 }
      );
    }

    // Get all patients (pharmacists should be able to look up any patient)
    // Limit to 100 for performance
    const patients = await PatientModel.find({})
      .populate("user_id")
      .limit(100)
      .lean();

    console.log(`Found ${patients.length} patients in database`);

    // Format patients for frontend
    const formattedPatients = await Promise.all(
      patients.map(async (patient: any) => {
        try {
          // Count total prescriptions for this patient
          const prescriptionCount = await PrescriptionModel.countDocuments({
            patient_id: patient._id,
          });

          // Count active prescriptions (verified/pending)
          const activePrescriptionCount =
            await PrescriptionModel.countDocuments({
              patient_id: patient._id,
              status: { $in: ["verified", "pending"] },
            });

          const userInfo = patient.user_id;

          return {
            id: patient._id.toString(),
            name: userInfo?.username || "Unknown Patient",
            email: userInfo?.email || patient.contact_info?.email || "N/A",
            phone: patient.contact_info?.phone || "N/A",
            dateOfBirth: patient.date_of_birth || new Date().toISOString(),
            address: patient.address || "N/A",
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
            prescriptionsCount: prescriptionCount,
            prescriptionCount,
            activePrescriptionCount,
            insuranceNumber: patient.contact_info?.insuranceNumber,
            lastVisit: new Date().toISOString(), // TODO: Track actual last visit from prescription history
          };
        } catch (error) {
          console.error("Error formatting patient:", patient._id, error);
          return null;
        }
      })
    );

    // Filter out any null entries from formatting errors
    const validPatients = formattedPatients.filter((p) => p !== null);

    console.log(`Returning ${validPatients.length} formatted patients`);

    return NextResponse.json({
      success: true,
      patients: validPatients,
    });
  } catch (error) {
    console.error("Error fetching pharmacist's patients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
});
