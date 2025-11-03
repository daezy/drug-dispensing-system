import { NextResponse } from "next/server";
import { withPatientAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { PrescriptionModel, PatientModel } from "@/lib/database/models";

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

    // Fetch prescriptions with populated data
    const prescriptions = await PrescriptionModel.find({
      patient_id: patient._id,
    })
      .populate({
        path: "doctor_id",
        populate: { path: "user_id", model: "User" },
      })
      .populate("drug_id")
      .populate({
        path: "pharmacist_id",
        populate: { path: "user_id", model: "User" },
      })
      .sort({ created_at: -1 })
      .lean();

    // Format prescriptions for frontend
    const formattedPrescriptions = prescriptions.map((prescription: any) => {
      const doctor = prescription.doctor_id;
      const drug = prescription.drug_id;
      const pharmacist = prescription.pharmacist_id;

      return {
        id: prescription._id.toString(),
        prescriptionNumber: `RX${prescription._id
          .toString()
          .slice(-8)
          .toUpperCase()}`,
        medication: drug?.name || "Unknown",
        dosage: drug?.strength || "N/A",
        quantity: prescription.quantity_prescribed,
        dispensedQuantity: prescription.quantity_dispensed || 0,
        frequency: prescription.frequency || "N/A",
        duration: prescription.duration || "N/A",
        instructions: prescription.dosage_instructions,
        status: prescription.status,
        dateIssued: prescription.date_issued,
        dateDispensed: prescription.date_dispensed,
        doctor: doctor?.user_id
          ? {
              id: doctor.user_id._id.toString(),
              name: doctor.user_id.username || "Unknown Doctor",
              specialty: doctor.specialization || "General",
              licenseNumber: doctor.license_number,
            }
          : null,
        pharmacist: pharmacist?.user_id
          ? {
              id: pharmacist.user_id._id.toString(),
              name: pharmacist.user_id.username || "Unknown Pharmacist",
              licenseNumber: pharmacist.license_number,
              pharmacyName: pharmacist.pharmacy_name,
            }
          : null,
        notes: prescription.notes,
        blockchainHash: prescription.blockchain_hash,
      };
    });

    return NextResponse.json({
      success: true,
      prescriptions: formattedPrescriptions,
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
});
