# Patient Lookup Debugging Guide

## Issue Analysis

The patient lookup feature in the Pharmacist dashboard was showing "No Patients Found" because:

1. **No patient records exist in the database** - The most common cause
2. **Missing error logging** - Errors weren't being displayed in the console
3. **Silent API failures** - The API could fail without proper error messages

## Fixes Applied

### 1. Frontend Improvements (`src/app/dashboard/pharmacist/patients/page.tsx`)

- ✅ Added detailed console logging for API responses
- ✅ Added error handling for non-OK responses
- ✅ Added helpful "Getting Started" message when no patients exist
- ✅ Shows browser console tip for debugging

### 2. Backend Improvements (`src/app/api/pharmacists/patients/route.ts`)

- ✅ Added logging for patient count from database
- ✅ Added error handling in patient formatting
- ✅ Added logging for formatted patient count
- ✅ Filters out null entries from formatting errors

## How to Test

### Step 1: Check Browser Console

1. Open the Pharmacist Patients page
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for these messages:
   ```
   Patients API response: { success: true, patients: [...] }
   ```
5. Check if `patients` array is empty: `[]`

### Step 2: Check Server Console

1. Look at your Next.js server terminal
2. You should see:
   ```
   Found X patients in database
   Returning X formatted patients
   ```

### Step 3: Create Test Patient

If no patients exist, create one:

1. **Go to Registration Page**: `http://localhost:3002/register` (or your app URL)
2. **Fill in Patient Details**:
   - Username: `Jane Doe`
   - Email: `patient@test.com`
   - Password: `Test1234!`
   - Role: **Patient**
   - Date of Birth: `01/01/1990`
   - Phone: `555-1234`
   - Blood Type: `O+`
3. **Submit Registration**
4. **Refresh Pharmacist Patients Page**

### Step 4: Verify Patient Appears

1. Go back to Pharmacist dashboard → Patients
2. You should see the new patient card
3. Total Patients count should be `1`
4. Search functionality should work

## Testing Search Functionality

Once patients exist, test the search:

1. **Search by Name**: Type `Jane` or `Doe`
2. **Search by Email**: Type `patient@test.com`
3. **Search by Phone**: Type `555-1234`
4. **Search by Insurance**: Type insurance number (if added)

## Common Issues

### Issue: "Pharmacist profile not found"

**Solution**: Make sure you're logged in as a pharmacist with a complete profile.

### Issue: API returns error 500

**Check**:

1. MongoDB connection is working
2. Database models are properly initialized
3. Check server console for detailed error messages

### Issue: Patients exist but don't show

**Debug**:

1. Check browser console for API response
2. Check if `populate("user_id")` is working
3. Verify patient records have valid `user_id` reference

### Issue: Search doesn't work

**Check**:

1. Patient data has the fields you're searching (name, email, phone)
2. Browser console shows filtered results
3. Search term matching is case-insensitive

## API Endpoint Details

**Endpoint**: `GET /api/pharmacists/patients`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "patients": [
    {
      "id": "...",
      "name": "Jane Doe",
      "email": "patient@test.com",
      "phone": "555-1234",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "address": "N/A",
      "prescriptionsCount": 0,
      "insuranceNumber": "...",
      "allergies": [...],
      "medicalHistory": "...",
      "emergencyContact": {...}
    }
  ]
}
```

## Database Query

The API performs:

```javascript
const patients = await PatientModel.find({})
  .populate("user_id")
  .limit(100)
  .lean();
```

This:

- Fetches all patient records
- Populates the user information (username, email)
- Limits to 100 records for performance
- Returns plain objects for faster processing

## Next Steps

1. ✅ Check console logs for debugging info
2. ✅ Create test patient accounts if none exist
3. ✅ Verify API returns data correctly
4. ✅ Test search functionality with various terms
5. ✅ Check "View Details" modal works

## Quick Test Command

To verify patients exist in the database (if you have MongoDB CLI access):

```bash
# Connect to your MongoDB
mongosh

# Switch to your database
use drug_dispensing_system

# Count patients
db.patients.countDocuments()

# View sample patients
db.patients.find().limit(5).pretty()
```

## Support

If issues persist:

1. Check all console logs (browser + server)
2. Verify authentication token is valid
3. Ensure pharmacist profile exists
4. Confirm MongoDB connection is working
5. Check that PatientModel schema matches your data
