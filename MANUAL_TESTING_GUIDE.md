# 🧪 Doctor Flow Manual Testing Guide

This guide provides step-by-step instructions for manually testing the complete doctor workflow to ensure everything works correctly.

---

## 📋 Prerequisites

### 1. Environment Setup

Ensure your `.env` file is properly configured:

```bash
# Check if .env exists
ls -la .env

# If not, copy from example
cp .env.example .env
```

**Required Environment Variables:**

- ✅ `MONGODB_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - Secret key for JWT tokens
- ✅ `NEXT_PUBLIC_APP_URL` - Application URL (default: http://localhost:3002)

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Test Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest jest jest-environment-jsdom mongodb-memory-server node-mocks-http
```

### 4. Start Development Server

```bash
npm run dev
```

Server should start at: http://localhost:3002

---

## 🔐 Test Data Setup

### Create Test Accounts

You'll need at least:

1. **One Doctor Account**
2. **One or More Patient Accounts**

#### Option A: Use Existing Accounts

If you already have test accounts in your database, note their credentials.

#### Option B: Create New Test Accounts via Registration

1. Go to http://localhost:3002/auth/register
2. Create a doctor account:

   - Username: `Dr. Test User`
   - Email: `doctor@test.com`
   - Password: `Test1234!`
   - Role: `Doctor`
   - License Number: `DOC-12345`
   - Specialization: `General Medicine`

3. Create a patient account:
   - Username: `Jane Doe`
   - Email: `patient@test.com`
   - Password: `Test1234!`
   - Role: `Patient`
   - Date of Birth: `01/01/1990`
   - Blood Type: `O+`

---

## ✅ Manual Test Cases

### Test 1: Login Flow ✅

**Steps:**

1. Navigate to http://localhost:3002/login
2. Enter doctor credentials:
   - Email: `doctor@test.com`
   - Password: `Test1234!`
3. Click "Sign In"

**Expected Results:**

- ✅ Successful login
- ✅ Redirected to `/dashboard/doctor`
- ✅ Token saved in localStorage (check DevTools → Application → Local Storage → `auth_token`)
- ✅ Dashboard displays doctor's name

**Pass Criteria:** No errors, successful redirection

---

### Test 2: Dashboard Display ✅

**Steps:**

1. After login, observe the dashboard

**Expected Results:**

- ✅ Statistics cards visible:
  - Total Patients
  - Active Prescriptions
  - Pending Approvals
  - Today's Appointments
- ✅ Quick action buttons present:
  - Create Prescription
  - View Patients
  - View Prescriptions
  - View History
- ✅ Performance metrics section visible
- ✅ Recent activity feed (if available)

**Pass Criteria:** All sections render without errors

---

### Test 3: Patient Search by Name ✅

**Steps:**

1. From dashboard, click "View Prescriptions" or navigate to `/dashboard/doctor/prescriptions`
2. In the "Find a Patient" section, type patient name in search box
3. Type at least 3 characters (e.g., "Jane")

**Expected Results:**

- ✅ Patient search dropdown appears
- ✅ Matching patients displayed with:
  - Name
  - Patient ID (PT-YYYY-XXXXXX format)
  - Email
  - Phone (if available)
  - Age
- ✅ "Create Prescription" button visible for each patient

**Pass Criteria:** Search results populate correctly

---

### Test 4: Patient Search by Patient ID ✅

**Steps:**

1. In the "Search by Patient ID" field, type a valid Patient ID
2. Example: `PT-2025-000001`

**Expected Results:**

- ✅ Auto-lookup activates after 3 characters
- ✅ Patient card displays below input with:
  - Patient name
  - Patient ID
  - Email
  - Quick action button
- ✅ Shows "Patient found!" message

**Pass Criteria:** Patient lookup works, displays correct patient

---

### Test 5: Create Prescription - Patient Pre-selection ✅

**Steps:**

1. From patient search results, click "Create Prescription" for a patient
2. You should be navigated to `/doctor/prescriptions?patientId=XXX&patientName=XXX&patientEmail=XXX`

**Expected Results:**

- ✅ Prescription form loads
- ✅ Patient information pre-populated:
  - Name displayed
  - Email displayed
  - Patient ID shown
- ✅ "Selected Patient" section visible at top
- ✅ Form ready for medication entry

**Pass Criteria:** Patient data correctly pre-filled from URL parameters

---

### Test 6: Add Single Medication ✅

**Steps:**

1. In the prescription form, fill out medication details:
   - **Drug Name**: `Amoxicillin`
   - **Dosage**: `500mg`
   - **Frequency**: `Twice daily`
   - **Duration**: `7 days`
   - **Quantity**: `30`
   - **Instructions**: `Take with food`

**Expected Results:**

- ✅ All fields accept input
- ✅ No validation errors
- ✅ Form fields update in real-time

**Pass Criteria:** All fields work correctly

---

### Test 7: Add Multiple Medications ✅

**Steps:**

1. After adding first medication, click "Add Another Medication" button
2. Fill out second medication:
   - **Drug Name**: `Ibuprofen`
   - **Dosage**: `400mg`
   - **Frequency**: `Three times daily`
   - **Duration**: `5 days`
   - **Quantity**: `15`
3. Optionally add a third medication

**Expected Results:**

- ✅ New medication form appears
- ✅ Each medication has its own set of fields
- ✅ "Remove Medication" button appears for each (except if only one)
- ✅ Can add multiple medications without limit

**Pass Criteria:** Multiple medication forms work independently

---

### Test 8: Remove Medication ✅

**Steps:**

1. With multiple medications added, click "Remove" button on one
2. Confirm the medication is removed

**Expected Results:**

- ✅ Medication form disappears
- ✅ Other medications remain intact
- ✅ No errors occur

**Pass Criteria:** Medication removal works smoothly

---

### Test 9: Fill Diagnosis and Notes ✅

**Steps:**

1. Scroll to "Diagnosis" field
2. Enter: `Upper respiratory infection`
3. In "Additional Notes" field, enter: `Patient has mild fever, advised rest and hydration`

**Expected Results:**

- ✅ Text areas accept input
- ✅ Character count updates (if implemented)
- ✅ No character limits interfere

**Pass Criteria:** Diagnosis and notes fields work

---

### Test 10: Submit Prescription ✅

**Steps:**

1. Review all entered data
2. Click "Create Prescription" button at bottom
3. Wait for submission

**Expected Results:**

- ✅ Loading indicator appears
- ✅ Success toast notification: "Prescription created successfully! X medication(s) prescribed."
- ✅ Form resets after submission
- ✅ Console shows blockchain logs:
  ```
  ✅ Prescription created and recorded on blockchain: [prescription_id]
     Patient: [patient_name]
     Drug: [drug_name]
     Blockchain hash: [hash_preview]...
  ```

**Pass Criteria:** Prescription saves successfully to database and blockchain

---

### Test 11: Verify Prescription in List ✅

**Steps:**

1. After creating prescription, navigate to `/dashboard/doctor/prescriptions`
2. Look for the newly created prescription in the list

**Expected Results:**

- ✅ Prescription appears in "Recent Prescriptions" section
- ✅ Displays:
  - Patient name
  - Prescription number (RX-XXXXXXXX)
  - Status badge (should be "Issued" in blue)
  - Date issued
  - Number of medications
  - Diagnosis
- ✅ "View" button present

**Pass Criteria:** New prescription visible in list

---

### Test 12: View Prescription Details ✅

**Steps:**

1. Click "View" button on a prescription
2. Modal should open with full details

**Expected Results:**

- ✅ Modal displays:
  - Prescription number
  - Patient name and ID
  - Date issued
  - Status (Issued)
  - All medications with:
    - Drug name
    - Dosage
    - Frequency
    - Duration
    - Quantity
    - Instructions
  - Diagnosis
  - Additional notes
  - Blockchain hash (if recorded)
- ✅ Close button works
- ✅ Data matches what was entered

**Pass Criteria:** All prescription data displayed accurately

---

### Test 13: Filter Prescriptions by Status ✅

**Steps:**

1. On prescriptions list page, use status filter dropdown
2. Select "Issued"
3. Select "Dispensed"
4. Select "All"

**Expected Results:**

- ✅ List updates based on filter selection
- ✅ Only prescriptions matching status shown
- ✅ Count updates accordingly

**Pass Criteria:** Filtering works correctly

---

### Test 14: Search Prescriptions ✅

**Steps:**

1. In search box, type patient name
2. Try prescription number (e.g., RX-XXXXXXXX)
3. Try diagnosis keywords

**Expected Results:**

- ✅ Results filter in real-time
- ✅ Matching prescriptions displayed
- ✅ Non-matching prescriptions hidden

**Pass Criteria:** Search functionality works

---

### Test 15: Verify Blockchain Recording ✅

**Steps:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Create a new prescription
4. Watch for blockchain logs

**Expected Results:**

- ✅ Console shows:
  ```
  ✅ Blockchain: Added transaction PRESC_[timestamp]_[random]
     Drug: [drug_name] ([drug_id])
     Type: stock_in
     Quantity: [quantity]
     Hash: [hash_preview]...
  ```
- ✅ Transaction ID starts with `PRESC_`
- ✅ Hash is 64-character hexadecimal string
- ✅ No errors in blockchain recording

**Pass Criteria:** Blockchain transaction created successfully

---

### Test 16: Check Database Entry ✅

**Steps:**

1. Open MongoDB Compass or your database client
2. Connect to your database
3. Navigate to `prescriptions` collection
4. Find the prescription you just created

**Expected Results:**

- ✅ Prescription document exists with:
  - `patient_id` (ObjectId reference)
  - `doctor_id` (ObjectId reference)
  - `drug_id` (ObjectId reference)
  - `quantity_prescribed` (number)
  - `dosage_instructions` (string)
  - `frequency` (string)
  - `duration` (string)
  - `date_issued` (date)
  - `status`: "issued"
  - `notes` (includes diagnosis)
  - `blockchain_hash` (64-char hex string)
  - `created_at` and `updated_at` timestamps

**Pass Criteria:** Database entry complete and accurate

---

### Test 17: Status Update Simulation ✅

**Steps:**

1. In database, manually update a prescription status:
   - Change `status` from "issued" to "dispensed"
   - Add `date_dispensed`: current date
2. Refresh prescriptions list in browser

**Expected Results:**

- ✅ Status badge changes from blue (Issued) to green (Dispensed)
- ✅ Status icon updates
- ✅ Date dispensed shows in details view

**Pass Criteria:** Status changes reflect in UI

---

### Test 18: Prescription History Page ✅

**Steps:**

1. Navigate to `/dashboard/doctor/history`
2. View prescription history timeline

**Expected Results:**

- ✅ All prescriptions listed chronologically
- ✅ Can filter by:
  - Type (prescription, appointment, etc.)
  - Time range (today, week, month, year, all)
- ✅ Search functionality works
- ✅ Each entry shows key details

**Pass Criteria:** History page displays correctly

---

### Test 19: Error Handling - Empty Form ✅

**Steps:**

1. Go to create prescription page
2. Try to submit without selecting patient
3. Try to submit with patient but no medications
4. Try to submit with empty medication fields

**Expected Results:**

- ✅ Validation errors appear
- ✅ Form does not submit
- ✅ Error messages clear and helpful
- ✅ Fields highlighted in red

**Pass Criteria:** Validation prevents invalid submissions

---

### Test 20: Error Handling - Session Expiry ✅

**Steps:**

1. In DevTools, delete `auth_token` from localStorage
2. Try to create a prescription or access protected page

**Expected Results:**

- ✅ Error message: "Please log in again"
- ✅ Redirected to login page
- ✅ No application crashes

**Pass Criteria:** Session expiry handled gracefully

---

## 🔍 Browser DevTools Checks

### Check 1: Network Tab

1. Open DevTools → Network tab
2. Create a prescription
3. Look for API calls:
   - `POST /api/prescriptions/doctor` - Status 200
   - Request payload includes patient, medications, diagnosis
   - Response includes prescription IDs and blockchain hashes

### Check 2: Console Tab

1. No error messages (red text)
2. Blockchain logs present (green ✅ checkmarks)
3. No warning about missing dependencies

### Check 3: Application Tab

1. Local Storage → `auth_token` present
2. Token is valid JWT format (three parts separated by dots)

---

## 🧪 Automated Tests

### Run Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run doctor flow tests specifically
npm run test:doctor-flow

# Run in watch mode
npm run test:watch
```

### Expected Test Results

```
PASS  __tests__/blockchain-service.test.ts
  BlockchainService Tests
    ✓ should record prescription creation with correct data
    ✓ should generate unique transaction IDs
    ✓ should link transactions with previous hash
    ✓ should verify chain integrity
    ...

PASS  __tests__/doctor-flow.test.ts
  Doctor Flow - Complete Integration Tests
    ✓ should authenticate doctor with valid credentials
    ✓ should find patient by Patient ID
    ✓ should create prescription with single medication
    ✓ should record on blockchain
    ...

Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```

---

## 📊 Test Results Checklist

Mark each test as you complete it:

### Authentication & Navigation

- [ ] Test 1: Login Flow
- [ ] Test 2: Dashboard Display
- [ ] Test 20: Session Expiry Handling

### Patient Search

- [ ] Test 3: Search by Name
- [ ] Test 4: Search by Patient ID
- [ ] Test 5: Patient Pre-selection

### Prescription Creation

- [ ] Test 6: Add Single Medication
- [ ] Test 7: Add Multiple Medications
- [ ] Test 8: Remove Medication
- [ ] Test 9: Fill Diagnosis and Notes
- [ ] Test 10: Submit Prescription
- [ ] Test 19: Error Handling - Empty Form

### Prescription Management

- [ ] Test 11: Verify in List
- [ ] Test 12: View Details
- [ ] Test 13: Filter by Status
- [ ] Test 14: Search Prescriptions
- [ ] Test 18: History Page

### Technical Verification

- [ ] Test 15: Blockchain Recording
- [ ] Test 16: Database Entry
- [ ] Test 17: Status Update

### Developer Checks

- [ ] Check 1: Network Tab
- [ ] Check 2: Console Tab
- [ ] Check 3: Application Tab

---

## 🐛 Common Issues & Solutions

### Issue 1: "Please log in again" on every request

**Solution:** Check that localStorage key is `auth_token` (not just `token`)

### Issue 2: Patient not found

**Solution:** Ensure patient has valid `user_id` in database

### Issue 3: Blockchain hash not saved

**Solution:** Check console for blockchain service errors

### Issue 4: "MONGODB_URI not defined"

**Solution:** Ensure `.env` file exists and is properly configured

### Issue 5: Tests fail with "Cannot find module"

**Solution:** Run `npm install` to ensure all dependencies installed

---

## 📝 Test Report Template

After completing all tests, fill out this report:

```
TEST EXECUTION REPORT
Date: _________________
Tester: _______________
Environment: Development / Staging / Production

SUMMARY:
- Total Tests: 20
- Tests Passed: _____ / 20
- Tests Failed: _____ / 20
- Tests Skipped: _____ / 20

CRITICAL ISSUES FOUND:
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

MINOR ISSUES FOUND:
1. ________________________________________________
2. ________________________________________________

BROWSER TESTED:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

ENVIRONMENT VARIABLES VERIFIED:
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] NEXT_PUBLIC_APP_URL

OVERALL ASSESSMENT:
[ ] PASS - Ready for production
[ ] PASS WITH MINOR ISSUES - Deploy with noted issues
[ ] FAIL - Critical issues must be fixed

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## ✅ Sign-off

Once all tests pass:

1. ✅ All 20 manual tests completed successfully
2. ✅ Automated tests pass
3. ✅ No console errors
4. ✅ Database entries verified
5. ✅ Blockchain recording confirmed
6. ✅ Test report completed

**Doctor flow is production-ready!** 🎉

---

**Last Updated:** November 4, 2025
