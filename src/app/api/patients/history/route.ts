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

    // Fetch prescription history (dispensed and rejected)
    const prescriptions = await PrescriptionModel.find({
      patient_id: patient._id,
      status: { $in: ["dispensed", "rejected", "expired"] },
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
      .sort({ updated_at: -1 })
      .limit(50)
      .lean();

    // Format history for frontend
    const formattedHistory = prescriptions.map((prescription: any) => {
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
        status: prescription.status,
        dateIssued: prescription.date_issued,
        dateDispensed: prescription.date_dispensed,
        dateUpdated: prescription.updated_at,
        doctor: doctor?.user_id
          ? {
              name: doctor.user_id.username || "Unknown Doctor",
              specialty: doctor.specialization || "General",
            }
          : null,
        pharmacist: pharmacist?.user_id
          ? {
              name: pharmacist.user_id.username || "Unknown Pharmacist",
              pharmacyName: pharmacist.pharmacy_name,
            }
          : null,
        notes: prescription.notes,
      };
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
});
