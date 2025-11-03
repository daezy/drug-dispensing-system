import { NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { PrescriptionModel, DoctorModel } from "@/lib/database/models";

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

    // Fetch prescriptions with populated data
    const prescriptions = await PrescriptionModel.find({
      doctor_id: doctor._id,
    })
      .populate({
        path: "patient_id",
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
      const patient = prescription.patient_id;
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
        patient: patient?.user_id
          ? {
              id: patient.user_id._id.toString(),
              name: patient.user_id.username || "Unknown Patient",
              email: patient.user_id.email,
              phone: patient.contact_info?.phone,
              dateOfBirth: patient.date_of_birth,
              allergies: patient.allergies,
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
    console.error("Error fetching doctor prescriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
});
