import { NextResponse } from "next/server";
import { withPharmacistAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import { PrescriptionModel, PharmacistModel } from "@/lib/database/models";

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query filter
    const query: any = {};

    // Show prescriptions that are ready for this pharmacist or already dispensed by them
    // Also show pending/verified prescriptions that can be dispensed
    if (status) {
      query.status = status;
    } else {
      // Default: show prescriptions that need attention
      query.status = { $in: ["verified", "pending", "dispensed"] };
    }

    // Fetch prescriptions with populated data
    const prescriptions = await PrescriptionModel.find(query)
      .populate({
        path: "patient_id",
        populate: { path: "user_id", model: "User" },
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
      .limit(100) // Limit for performance
      .lean();

    // Format prescriptions for frontend
    const formattedPrescriptions = prescriptions.map((prescription: any) => {
      const patient = prescription.patient_id;
      const doctor = prescription.doctor_id;
      const drug = prescription.drug_id;
      const dispensingPharmacist = prescription.pharmacist_id;

      return {
        id: prescription._id.toString(),
        prescriptionNumber: `RX${prescription._id
          .toString()
          .slice(-8)
          .toUpperCase()}`,
        medication: drug?.name || "Unknown",
        genericName: drug?.generic_name,
        dosage: drug?.strength || "N/A",
        dosageForm: drug?.dosage_form,
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
              insuranceNumber: patient.contact_info?.insuranceNumber,
            }
          : null,
        doctor: doctor?.user_id
          ? {
              id: doctor.user_id._id.toString(),
              name: doctor.user_id.username || "Unknown Doctor",
              specialty: doctor.specialization || "General",
              licenseNumber: doctor.license_number,
              phone: doctor.contact_info?.phone,
            }
          : null,
        pharmacist: dispensingPharmacist?.user_id
          ? {
              id: dispensingPharmacist.user_id._id.toString(),
              name:
                dispensingPharmacist.user_id.username || "Unknown Pharmacist",
              licenseNumber: dispensingPharmacist.license_number,
              pharmacyName: dispensingPharmacist.pharmacy_name,
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
    console.error("Error fetching pharmacist prescriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
});
