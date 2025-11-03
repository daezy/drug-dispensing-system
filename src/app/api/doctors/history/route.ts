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

    // Fetch prescription history (dispensed, rejected, expired)
    const prescriptions = await PrescriptionModel.find({
      doctor_id: doctor._id,
      status: { $in: ["dispensed", "rejected", "expired"] },
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
      .sort({ updated_at: -1 })
      .limit(100)
      .lean();

    // Format history for frontend
    const formattedHistory = prescriptions.map((prescription: any) => {
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
        status: prescription.status,
        dateIssued: prescription.date_issued,
        dateDispensed: prescription.date_dispensed,
        dateUpdated: prescription.updated_at,
        patient: patient?.user_id
          ? {
              name: patient.user_id.username || "Unknown Patient",
              email: patient.user_id.email,
            }
          : null,
        pharmacist: pharmacist?.user_id
          ? {
              name: pharmacist.user_id.username || "Unknown Pharmacist",
              pharmacyName: pharmacist.pharmacy_name,
            }
          : null,
        notes: prescription.notes,
        blockchainHash: prescription.blockchain_hash,
      };
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Error fetching doctor history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
});
