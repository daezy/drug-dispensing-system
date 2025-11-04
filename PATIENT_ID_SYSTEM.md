# Patient ID Generation and Auto-Lookup System

## Overview

A complete patient identification system that generates unique Patient IDs and enables doctors to quickly find patients using those IDs.

## Features Implemented

### 1. Patient ID Generation

- **Format**: `PT-YYYY-XXXXXX` (e.g., `PT-2024-001234`)
- **Components**:
  - `PT`: Prefix identifying it as a Patient ID
  - `YYYY`: Current year (2024, 2025, etc.)
  - `XXXXXX`: Sequential 6-digit number with zero-padding
- **Generation Logic**: Located in `src/lib/services/UserService.ts`
  - Counts existing patients in database
  - Increments count and formats with zero-padding
  - Checks for duplicates (handles edge cases with random suffix)
  - Automatically assigned during patient registration

### 2. Storage

- **Database Field**: `medical_record_number` in PatientModel
- **API Exposure**: Returned as `patientId` in API responses
- **Location**: MongoDB collection for patient records

### 3. Auto-Lookup Feature

#### UI Components

Located in `src/app/dashboard/doctor/prescriptions/page.tsx`:

- **Quick Lookup Card** (Blue border):

  - Large input field with placeholder "Enter Patient ID (e.g., PT-2024-001234)"
  - Auto-converts input to uppercase
  - Font-mono styling for better ID readability
  - Loading spinner during lookup

- **Success State** (Green card):

  - Shows patient name, email, and ID
  - Green checkmark icon
  - "Create Prescription" button
  - Appears when patient is found

- **Not Found State** (Yellow card):
  - Shows warning message with the entered ID
  - Appears when no matching patient exists

#### Lookup Logic

- **Trigger**: Minimum 3 characters entered
- **Debounce**: 300ms delay to prevent excessive lookups
- **Search Method**: Exact match on `patientId` field (case-insensitive)
- **Real-time**: Updates as user types

### 4. API Endpoint

**Route**: `/api/patients` (GET)
**Location**: `src/app/api/patients/route.ts`

**Returns**:

```json
{
  "success": true,
  "patients": [
    {
      "id": "user_mongodb_id",
      "patientId": "PT-2024-001234",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "allergies": ["Penicillin"],
      "medicalHistory": ["Hypertension"]
    }
  ]
}
```

### 5. Patient Search Enhancement

The existing patient search now includes Patient ID:

- Search by name, email, phone, **OR Patient ID**
- Patient ID displayed in blue badge next to patient name
- Results show all matching patients with their IDs

## User Flow

### For New Patients (Registration)

1. Patient registers account
2. System automatically generates unique Patient ID (e.g., `PT-2024-001234`)
3. ID stored in database and associated with patient profile
4. Patient receives ID for future reference

### For Doctors (Creating Prescriptions)

1. Doctor opens prescription creation page
2. Two search options available:

   - **Option A**: Quick ID Lookup

     - Type patient ID (e.g., `PT-2024-001234`)
     - System automatically finds patient within 300ms
     - Green success card appears with patient details
     - Click "Create Prescription" button

   - **Option B**: Name/Email Search
     - Type patient name, email, or phone
     - Browse filtered results
     - Patient IDs shown in blue badges
     - Click on patient to create prescription

## Technical Details

### generatePatientId() Function

```typescript
async generatePatientId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await PatientModel.countDocuments();
  const sequentialNumber = (count + 1).toString().padStart(6, '0');
  let patientId = `PT-${year}-${sequentialNumber}`;

  // Check for duplicates and handle collision
  let existingPatient = await PatientModel.findOne({
    medical_record_number: patientId
  });

  if (existingPatient) {
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    patientId = `PT-${year}-${sequentialNumber}${randomSuffix}`;
  }

  return patientId;
}
```

### Auto-Lookup useEffect Hook

```typescript
useEffect(() => {
  const trimmedId = patientIdInput.trim();

  if (trimmedId.length < 3) {
    setAutoLookupPatient(null);
    return;
  }

  const timeoutId = setTimeout(() => {
    setIsLookingUp(true);
    const found = patients.find(
      (p) =>
        p.patientId && p.patientId.toLowerCase() === trimmedId.toLowerCase()
    );

    if (found) {
      setAutoLookupPatient(found);
    } else {
      setAutoLookupPatient(null);
    }
    setIsLookingUp(false);
  }, 300); // 300ms debounce

  return () => clearTimeout(timeoutId);
}, [patientIdInput, patients]);
```

## Files Modified/Created

### Created

- `src/app/api/patients/route.ts` - API endpoint to fetch all patients

### Modified

- `src/lib/services/UserService.ts` - Added generatePatientId() function
- `src/app/dashboard/doctor/prescriptions/page.tsx` - Added auto-lookup UI and logic
- `src/types/index.ts` - Updated Patient interface with patientId field

## Testing Checklist

- [ ] Register new patient and verify ID is generated
- [ ] Check ID format matches `PT-YYYY-XXXXXX`
- [ ] Verify ID is stored in database (medical_record_number field)
- [ ] Type 3 characters of patient ID and verify auto-lookup triggers
- [ ] Verify 300ms debounce works (no excessive API calls)
- [ ] Confirm green success card appears when patient found
- [ ] Confirm yellow warning appears when patient not found
- [ ] Test case-insensitive matching (PT-2024-001234 = pt-2024-001234)
- [ ] Verify "Create Prescription" button works from auto-lookup
- [ ] Check patient search includes patientId in filter
- [ ] Verify patient ID badge displays in search results

## Migration for Existing Patients

If you have existing patients without Patient IDs, you'll need to run a migration:

```typescript
// Migration script (run once)
async function migrateExistingPatients() {
  const userService = new UserService();
  const patients = await PatientModel.find({
    medical_record_number: { $exists: false },
  });

  for (const patient of patients) {
    const patientId = await userService.generatePatientId();
    patient.medical_record_number = patientId;
    await patient.save();
    console.log(`Assigned ${patientId} to patient ${patient._id}`);
  }
}
```

## Benefits

1. **Easy Reference**: Doctors can quickly find patients using short IDs
2. **Reduced Errors**: Unique identifiers prevent patient mix-ups
3. **Improved Workflow**: Auto-lookup eliminates need to browse long lists
4. **Professional**: Standard medical record numbering system
5. **Scalable**: Sequential numbering supports unlimited patients
6. **User-Friendly**: Intuitive format that's easy to communicate (phone, forms, etc.)

## Future Enhancements

- Print patient ID cards
- QR code generation for quick scanning
- SMS/Email patient their ID upon registration
- ID-based prescription lookup for patients
- Integration with external healthcare systems
- Barcode support for ID scanning
