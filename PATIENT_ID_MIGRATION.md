# Patient ID Migration Guide

## Overview

This guide explains how to generate Patient IDs for existing patients who were created before the Patient ID system was implemented.

## Prerequisites

### 1. Database Connection

Ensure MongoDB is running and accessible. You have two options:

#### Option A: Start Local MongoDB

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Or manually
mongod --config /usr/local/etc/mongod.conf
```

#### Option B: Use MongoDB Atlas (Cloud)

Make sure your `.env` file has the correct MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### 2. Install Dependencies

```bash
npm install --save-dev tsx
```

## Migration Methods

### Method 1: Command Line Script (Recommended)

This method runs a dedicated migration script that generates Patient IDs for all existing patients.

**Run the migration:**

```bash
npx tsx scripts/migrate-patient-ids.ts
```

**Expected output:**

```
🚀 Starting Patient ID Migration...

✅ Connected to database

📊 Found 25 patients without Patient IDs

🔄 Generating Patient IDs...

✅ Assigned PT-2025-000001 to patient 507f1f77bcf86cd799439011
✅ Assigned PT-2025-000002 to patient 507f191e810c19729de860ea
✅ Assigned PT-2025-000003 to patient 507f191e810c19729de860eb
...

============================================================
📈 Migration Summary:
============================================================
✅ Successfully assigned: 25 Patient IDs
❌ Failed: 0 patients
📊 Total processed: 25 patients
============================================================

🎉 Migration completed successfully!

📋 Sample Patient IDs:
   - PT-2025-000001
   - PT-2025-000002
   - PT-2025-000003
   - PT-2025-000004
   - PT-2025-000005

✅ All patients now have Patient IDs!
```

### Method 2: API Endpoint (For Production)

Use this method if you prefer to run the migration through an authenticated API endpoint (requires admin access).

**Endpoint:** `POST /api/admin/migrate-patient-ids`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Example using curl:**

```bash
curl -X POST http://localhost:3000/api/admin/migrate-patient-ids \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example using JavaScript/Fetch:**

```javascript
const response = await fetch("/api/admin/migrate-patient-ids", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
});

const result = await response.json();
console.log(result);
```

**Expected response:**

```json
{
  "success": true,
  "message": "Successfully generated 25 Patient IDs",
  "statistics": {
    "total": 25,
    "success": 25,
    "failed": 0
  },
  "sampleIds": [
    "PT-2025-000001",
    "PT-2025-000002",
    "PT-2025-000003",
    "PT-2025-000004",
    "PT-2025-000005",
    "PT-2025-000006",
    "PT-2025-000007",
    "PT-2025-000008",
    "PT-2025-000009",
    "PT-2025-000010"
  ]
}
```

## Patient ID Format

Generated Patient IDs follow this format:

- **Pattern:** `PT-YYYY-XXXXXX`
- **Example:** `PT-2025-000123`

**Components:**

- `PT` = Patient prefix
- `YYYY` = Current year (2025, 2026, etc.)
- `XXXXXX` = Sequential 6-digit number with leading zeros

## What Gets Updated

The migration:

1. Finds all patients where `medical_record_number` is null, empty, or doesn't exist
2. Generates a unique Patient ID for each patient
3. Saves the ID to the `medical_record_number` field in the database
4. Provides a summary of successful and failed migrations

## Verification

After running the migration, you can verify Patient IDs in several ways:

### 1. Check in MongoDB

```javascript
// MongoDB Shell
use your_database_name
db.patients.find({ medical_record_number: { $exists: true } }).count()
db.patients.find({}, { medical_record_number: 1, _id: 1 }).limit(10)
```

### 2. Check via Doctor Dashboard

1. Login as a doctor
2. Go to Prescriptions page
3. Click "Show Search"
4. Search for patients - you should see Patient IDs displayed

### 3. Check via API

```bash
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solution:** Ensure MongoDB is running

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB (macOS)
brew services start mongodb-community

# Or check your MongoDB Atlas connection string
```

### Error: "Admin access required"

**Solution:** Use an admin account token

```bash
# Login as admin first to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'
```

### Warning: "Duplicate schema index"

**Solution:** These are harmless warnings from Mongoose. They don't affect the migration.

### Error: "Cannot redeclare variable"

**Solution:** This is a TypeScript compilation issue. Use `npx tsx` instead of `npx ts-node`

## Rollback

If you need to remove Patient IDs:

```javascript
// ⚠️ WARNING: Only use in development!
// This will remove all Patient IDs

// MongoDB Shell
db.patients.updateMany({}, { $unset: { medical_record_number: "" } });
```

## Re-running the Migration

The migration is safe to run multiple times. It will:

- Skip patients who already have Patient IDs
- Only assign IDs to patients without them
- Report if all patients already have IDs

```
📊 Found 0 patients without Patient IDs
✨ All patients already have Patient IDs!
```

## Integration with New Patient Registration

Once the migration is complete, all new patients automatically receive a Patient ID during registration. No additional action is needed.

**Automatic ID assignment happens in:**

- `src/lib/services/UserService.ts` → `registerPatient()` method
- Called automatically during patient registration
- ID is stored in `medical_record_number` field

## Support

If you encounter issues:

1. Check database connection
2. Verify admin permissions (for API method)
3. Check the logs for specific error messages
4. Ensure all dependencies are installed

For additional help, see:

- `PATIENT_ID_SYSTEM.md` - Complete Patient ID system documentation
- MongoDB logs: `/usr/local/var/log/mongodb/mongo.log` (macOS)
- Application logs in your terminal
