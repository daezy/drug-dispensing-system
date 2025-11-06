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

      // Determine the type based on status
      let type: "prescription" | "dispensing" = "prescription";
      if (prescription.status === "dispensed") {
        type = "dispensing";
      }

      // Map status to frontend format
      let displayStatus: "completed" | "cancelled" | "pending" = "completed";
      if (prescription.status === "rejected" || prescription.status === "expired") {
        displayStatus = "cancelled";
      } else if (prescription.status === "dispensed") {
        displayStatus = "completed";
      }

      // Create title and description
      const medicationName = drug?.name || "Unknown Medication";
      const dosage = drug?.strength || "N/A";
      const title = `${medicationName} - ${dosage}`;
      const description = type === "dispensing" 
        ? `Dispensed ${prescription.quantity_dispensed || prescription.quantity_prescribed} units`
        : `Prescribed ${prescription.quantity_prescribed} units`;

      // Use the most relevant date
      const date = prescription.date_dispensed || prescription.date_issued || prescription.updated_at;

      return {
        id: prescription._id.toString(),
        type,
        title,
        description,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        status: displayStatus,
        doctorName: doctor?.user_id?.username || "Unknown Doctor",
        pharmacyName: pharmacist?.pharmacy_name || "Unknown Pharmacy",
        medications: [medicationName],
        // Additional details for reference
        prescriptionNumber: `RX${prescription._id.toString().slice(-8).toUpperCase()}`,
        quantity: prescription.quantity_prescribed,
        dispensedQuantity: prescription.quantity_dispensed || 0,
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
