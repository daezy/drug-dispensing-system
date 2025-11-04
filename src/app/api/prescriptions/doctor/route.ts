import { NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/utils/api-middleware";
import { connectToDatabase } from "@/lib/database/connection";
import {
  PrescriptionModel,
  DoctorModel,
  PatientModel,
  DrugModel,
  UserModel,
} from "@/lib/database/models";
import { blockchainService } from "@/lib/services/BlockchainService";

export const POST = withDoctorAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { patientId, medications, diagnosis, notes } = body;

    // Find the doctor record
    const doctor = await DoctorModel.findOne({ user_id: user.id }).populate(
      "user_id"
    );
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Find the patient record
    console.log("🔍 Looking for patient with user_id:", patientId);
    const patient = await PatientModel.findOne({ user_id: patientId }).populate(
      "user_id"
    );
    console.log("👤 Patient found:", {
      found: !!patient,
      patientRecordId: patient?._id?.toString(),
      userId: patientId,
    });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Get patient and doctor names
    const patientUser = patient.user_id as any;
    const doctorUser = doctor.user_id as any;
    const patientName = patientUser?.username || "Unknown Patient";
    const doctorName =
      doctorUser?.username || user.username || "Unknown Doctor";

    // Create prescriptions for each medication
    const createdPrescriptions = [];
    const blockchainRecords = [];

    for (const medication of medications) {
      // Find or create drug record
      let drug = await DrugModel.findOne({ name: medication.drugName });

      if (!drug) {
        // Create new drug if it doesn't exist
        // Set expiry date to 2 years from now by default
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        drug = await DrugModel.create({
          name: medication.drugName,
          strength: medication.dosage,
          dosage_form: "tablet", // Default form (required field)
          manufacturer: "Generic",
          expiry_date: expiryDate, // Required field
          description: `${medication.drugName} ${medication.dosage}`,
          requires_prescription: true,
          stock_quantity: 1000, // Changed from quantity_in_stock to match schema
        });
      }

      // Create prescription
      const prescription = await PrescriptionModel.create({
        patient_id: patient._id,
        doctor_id: doctor._id,
        drug_id: drug._id,
        quantity_prescribed: medication.quantity || 30,
        dosage_instructions:
          medication.instructions ||
          `${medication.frequency} for ${medication.duration}`,
        frequency: medication.frequency,
        duration: medication.duration,
        date_issued: new Date(),
        status: "pending", // Valid enum values: pending, verified, dispensed, rejected, expired
        notes: `${diagnosis}${notes ? "\n\nNotes: " + notes : ""}`,
      });

      // Record prescription creation on blockchain
      const blockchainTx = blockchainService.recordPrescriptionCreation(
        prescription._id.toString(),
        drug._id.toString(),
        drug.name,
        medication.quantity || 30,
        doctorName,
        patientName,
        `${medication.frequency} for ${medication.duration}. Diagnosis: ${diagnosis}`
      );

      // Update prescription with blockchain hash
      prescription.blockchain_hash = blockchainTx.hash;
      await prescription.save();

      console.log(
        `✅ Prescription created and recorded on blockchain: ${prescription._id}`
      );
      console.log(`   Patient Record ID: ${patient._id}`);
      console.log(`   Patient User ID: ${patientId}`);
      console.log(`   Patient: ${patientName}`);
      console.log(`   Drug: ${drug.name}`);
      console.log(
        `   Blockchain hash: ${blockchainTx.hash.substring(0, 16)}...`
      );

      createdPrescriptions.push(prescription);
      blockchainRecords.push({
        prescriptionId: prescription._id.toString(),
        blockchainHash: blockchainTx.hash,
        transactionId: blockchainTx.transactionId,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Prescription(s) created successfully and recorded on blockchain",
      prescriptions: createdPrescriptions.map((p) => ({
        id: p._id.toString(),
        prescriptionNumber: `RX${p._id.toString().slice(-8).toUpperCase()}`,
      })),
      blockchain: blockchainRecords,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create prescription" },
      { status: 500 }
    );
  }
});

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
