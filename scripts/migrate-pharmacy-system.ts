// Migration script to add pharmacy system to existing database
// Run with: ts-node scripts/migrate-pharmacy-system.ts

import { connectToDatabase } from "../src/lib/database/connection";
import {
  PharmacyModel,
  PharmacistModel,
  DrugModel,
  PrescriptionModel,
} from "../src/lib/database/models";

async function migratePharmacySystem() {
  console.log("🏥 Starting Pharmacy System Migration...\n");

  try {
    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to database\n");

    // Step 1: Create default pharmacy
    console.log("Step 1: Creating default pharmacy...");
    let defaultPharmacy = await PharmacyModel.findOne({
      license_number: "PHR-DEFAULT-001",
    });

    if (!defaultPharmacy) {
      defaultPharmacy = await PharmacyModel.create({
        name: "Main Pharmacy",
        license_number: "PHR-DEFAULT-001",
        address: "123 Main Street",
        city: "Default City",
        state: "XX",
        zip_code: "00000",
        phone: "+1-000-000-0000",
        email: "default@pharmacy.com",
        operating_hours: "24/7",
        is_active: true,
      });
      console.log(
        `✅ Created default pharmacy: ${defaultPharmacy.name} (ID: ${defaultPharmacy._id})\n`
      );
    } else {
      console.log(
        `ℹ️  Default pharmacy already exists (ID: ${defaultPharmacy._id})\n`
      );
    }

    // Step 2: Update pharmacists without pharmacy_id
    console.log("Step 2: Updating pharmacists...");
    const pharmacistsWithoutPharmacy = await PharmacistModel.countDocuments({
      pharmacy_id: { $exists: false },
    });

    if (pharmacistsWithoutPharmacy > 0) {
      const pharmacistResult = await PharmacistModel.updateMany(
        { pharmacy_id: { $exists: false } },
        { $set: { pharmacy_id: defaultPharmacy._id } }
      );
      console.log(
        `✅ Updated ${pharmacistResult.modifiedCount} pharmacists with default pharmacy\n`
      );
    } else {
      console.log(`ℹ️  All pharmacists already have pharmacy assigned\n`);
    }

    // Step 3: Update drugs without pharmacy_id
    console.log("Step 3: Updating drugs inventory...");
    const drugsWithoutPharmacy = await DrugModel.countDocuments({
      pharmacy_id: { $exists: false },
    });

    if (drugsWithoutPharmacy > 0) {
      const drugResult = await DrugModel.updateMany(
        { pharmacy_id: { $exists: false } },
        { $set: { pharmacy_id: defaultPharmacy._id } }
      );
      console.log(
        `✅ Updated ${drugResult.modifiedCount} drugs with default pharmacy\n`
      );
    } else {
      console.log(`ℹ️  All drugs already have pharmacy assigned\n`);
    }

    // Step 4: Update prescriptions without pharmacy_id
    console.log("Step 4: Updating prescriptions...");
    const prescriptionsWithoutPharmacy = await PrescriptionModel.countDocuments(
      {
        pharmacy_id: { $exists: false },
      }
    );

    if (prescriptionsWithoutPharmacy > 0) {
      const prescriptionResult = await PrescriptionModel.updateMany(
        { pharmacy_id: { $exists: false } },
        { $set: { pharmacy_id: defaultPharmacy._id } }
      );
      console.log(
        `✅ Updated ${prescriptionResult.modifiedCount} prescriptions with default pharmacy\n`
      );
    } else {
      console.log(`ℹ️  All prescriptions already have pharmacy assigned\n`);
    }

    // Step 5: Verification
    console.log("Step 5: Verifying migration...");
    const pharmacistsCount = await PharmacistModel.countDocuments({
      pharmacy_id: defaultPharmacy._id,
    });
    const drugsCount = await DrugModel.countDocuments({
      pharmacy_id: defaultPharmacy._id,
    });
    const prescriptionsCount = await PrescriptionModel.countDocuments({
      pharmacy_id: defaultPharmacy._id,
    });

    console.log("\n📊 Migration Summary:");
    console.log(`   Pharmacy: ${defaultPharmacy.name}`);
    console.log(`   Pharmacy ID: ${defaultPharmacy._id}`);
    console.log(`   Pharmacists: ${pharmacistsCount}`);
    console.log(`   Drugs: ${drugsCount}`);
    console.log(`   Prescriptions: ${prescriptionsCount}`);

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Create additional pharmacies if needed");
    console.log("2. Reassign pharmacists to correct pharmacies");
    console.log("3. Organize drugs by pharmacy locations");
    console.log(
      "4. Update prescription workflow to include pharmacy selection\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migratePharmacySystem();
