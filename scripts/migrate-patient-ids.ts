/**
 * Migration Script: Generate Patient IDs for Existing Patients
 *
 * This script generates unique Patient IDs (PT-YYYY-XXXXXX) for all existing patients
 * who don't have a medical_record_number (Patient ID) assigned yet.
 *
 * Usage: npx ts-node scripts/migrate-patient-ids.ts
 */

import { connectToDatabase } from "../src/lib/database/connection";
import { PatientModel } from "../src/lib/database/models";
import { UserService } from "../src/lib/services/UserService";

async function migratePatientIds() {
  console.log("🚀 Starting Patient ID Migration...\n");

  try {
    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to database\n");

    // Find all patients without a medical_record_number
    const patientsWithoutId = await PatientModel.find({
      $or: [
        { medical_record_number: { $exists: false } },
        { medical_record_number: null },
        { medical_record_number: "" },
      ],
    });

    console.log(
      `📊 Found ${patientsWithoutId.length} patients without Patient IDs\n`
    );

    if (patientsWithoutId.length === 0) {
      console.log("✨ All patients already have Patient IDs!");
      return;
    }

    // Initialize UserService for ID generation
    const userService = new UserService();
    let successCount = 0;
    let errorCount = 0;

    console.log("🔄 Generating Patient IDs...\n");

    // Generate and assign IDs
    for (const patient of patientsWithoutId) {
      try {
        const patientId = await userService.generatePatientId();
        patient.medical_record_number = patientId;
        await patient.save();

        console.log(`✅ Assigned ${patientId} to patient ${patient._id}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to assign ID to patient ${patient._id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📈 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`✅ Successfully assigned: ${successCount} Patient IDs`);
    console.log(`❌ Failed: ${errorCount} patients`);
    console.log(`📊 Total processed: ${patientsWithoutId.length} patients`);
    console.log("=".repeat(60) + "\n");

    if (successCount > 0) {
      console.log("🎉 Migration completed successfully!");

      // Show sample of generated IDs
      const samplePatients = await PatientModel.find({
        medical_record_number: { $exists: true },
      })
        .limit(5)
        .select("medical_record_number");

      console.log("\n📋 Sample Patient IDs:");
      samplePatients.forEach((p: any) => {
        console.log(`   - ${p.medical_record_number}`);
      });
    }

    // Verify all patients now have IDs
    const remainingWithoutId = await PatientModel.countDocuments({
      $or: [
        { medical_record_number: { $exists: false } },
        { medical_record_number: null },
        { medical_record_number: "" },
      ],
    });

    if (remainingWithoutId > 0) {
      console.log(
        `\n⚠️  Warning: ${remainingWithoutId} patients still without IDs`
      );
    } else {
      console.log("\n✅ All patients now have Patient IDs!");
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migratePatientIds();
