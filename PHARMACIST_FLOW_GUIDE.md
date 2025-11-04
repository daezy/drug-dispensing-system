# Pharmacist Flow - Complete Testing Guide

## Overview

The pharmacist flow allows pharmacists to view, verify, and dispense prescriptions created by doctors. This includes inventory management, prescription verification, and blockchain-recorded dispensing.

---

## Prerequisites

### 1. User Accounts Required

- **Pharmacist Account**: Email with role set to "pharmacist"
- **Doctor Account**: To create test prescriptions
- **Patient Account**: To link prescriptions to

### 2. Database Setup

- Pharmacist profile must be linked to user account
- Drugs must exist in inventory
- Prescriptions must be in "verified" or "pending" status

---

## Pharmacist Dashboard Features

### Dashboard Components:

1. **Pending Prescriptions** - Prescriptions awaiting dispensing
2. **Inventory Management** - View and manage drug stock
3. **Low Stock Alerts** - Items below minimum threshold
4. **Daily Statistics** - Orders processed today
5. **Prescription History** - All dispensed prescriptions

---

## Step-by-Step Workflow

### Phase 1: Login as Pharmacist

1. **Navigate to Login Page**

   ```
   http://localhost:3002
   ```

2. **Select Role**: Pharmacist

3. **Enter Credentials**:

   - Email: `pharmacist@example.com`
   - Password: Your password

4. **Expected Result**:
   - Redirect to `/dashboard/pharmacist`
   - See dashboard with stats and pending prescriptions

---

### Phase 2: View Pending Prescriptions

#### API Endpoint: `/api/prescriptions/pharmacist`

**Method**: GET

**Authentication**: Required (JWT token with pharmacist role)

**Query Parameters**:

- `status` (optional): Filter by status (verified, pending, dispensed)

**Response Format**:

```json
{
  "success": true,
  "prescriptions": [
    {
      "id": "prescription_id",
      "prescriptionNumber": "RX5E009AB3",
      "medication": "Amoxicillin",
      "genericName": "Amoxicillin",
      "dosage": "500mg",
      "dosageForm": "tablet",
      "quantity": 30,
      "dispensedQuantity": 0,
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take with food",
      "status": "verified",
      "dateIssued": "2025-11-04T...",
      "patient": {
        "id": "patient_id",
        "name": "John Doe",
        "email": "patient@example.com",
        "allergies": ["penicillin"],
        "insuranceNumber": "INS123456"
      },
      "doctor": {
        "id": "doctor_id",
        "name": "Dr. Smith",
        "specialty": "General",
        "licenseNumber": "LIC123456"
      },
      "blockchainHash": "0x..."
    }
  ]
}
```

**Testing Steps**:

1. Go to `/dashboard/pharmacist/prescriptions`
2. Should see list of prescriptions
3. Filter by status: All, Pending, Verified, Dispensed
4. Search by patient name or prescription number

---

### Phase 3: View Prescription Details

**Features to Test**:

1. Click "View Details" on any prescription
2. Modal should show:
   - Prescription number
   - Patient information (name, allergies, insurance)
   - Doctor information
   - Medication details (name, dosage, form, quantity)
   - Instructions and notes
   - Blockchain verification status
   - Transaction hash (if available)

**Expected Data**:

- ✅ Patient allergies highlighted (important for safety)
- ✅ Drug interactions warnings (if implemented)
- ✅ Insurance information for billing
- ✅ Doctor's license number for verification

---

### Phase 4: Dispense Prescription

#### API Endpoint: `/api/prescriptions/dispense`

**Method**: POST

**Authentication**: Required (pharmacist role only)

**Request Body**:

```json
{
  "prescriptionId": "prescription_id",
  "quantityDispensed": 30,
  "notes": "Counseled patient on proper usage"
}
```

**Business Logic**:

1. **Status Check**: Prescription must be "verified" (not "pending" or already "dispensed")
2. **Stock Check**: Verify sufficient drug quantity in inventory
3. **Expiry Check**: Ensure drug is not expired
4. **Stock Deduction**: Automatically reduce inventory
5. **Blockchain Recording**: Record dispensing transaction on blockchain
6. **Update Status**: Change prescription status to "dispensed"

**Response Format**:

```json
{
  "success": true,
  "message": "Prescription dispensed successfully",
  "prescription": {
    "id": "prescription_id",
    "status": "dispensed",
    "quantityDispensed": 30,
    "dateDispensed": "2025-11-04T...",
    "dispensedBy": "pharmacist_id"
  },
  "inventory": {
    "drugId": "drug_id",
    "previousStock": 1000,
    "newStock": 970
  },
  "blockchain": {
    "transactionId": "TX12345678",
    "hash": "0x...",
    "timestamp": 1234567890
  }
}
```

**Testing Steps**:

1. **Select Verified Prescription**:

   - Only prescriptions with status "verified" can be dispensed
   - Status "pending" → needs doctor/system verification first

2. **Click "Dispense" Button**:

   - Modal opens with dispensing form

3. **Fill Dispensing Form**:

   - Quantity (default: prescribed amount)
   - Notes (optional): Counseling provided, substitutions made, etc.

4. **Submit**:

   - Click "Confirm Dispensing"

5. **Expected Results**:
   - ✅ Success message displayed
   - ✅ Prescription status changes to "dispensed"
   - ✅ Inventory reduced by quantity dispensed
   - ✅ Blockchain transaction recorded
   - ✅ Transaction hash displayed
   - ✅ Date and time stamped
   - ✅ Pharmacist ID recorded

**Error Scenarios to Test**:

❌ **Insufficient Stock**:

```json
{
  "error": "Insufficient stock",
  "available": 10,
  "requested": 30
}
```

❌ **Already Dispensed**:

```json
{
  "error": "Prescription already dispensed"
}
```

❌ **Not Verified**:

```json
{
  "error": "Prescription must be verified before dispensing"
}
```

❌ **Expired Drug**:

```json
{
  "error": "Cannot dispense expired drug"
}
```

---

### Phase 5: Inventory Management

#### View Inventory: `/dashboard/pharmacist/inventory`

**Features**:

1. View all drugs in inventory
2. See current stock levels
3. Low stock alerts (below minimum threshold)
4. Expiring soon warnings (within 30 days)
5. Add new drugs
6. Update stock quantities
7. View transaction history

#### Add Drug to Inventory

**API Endpoint**: `/api/drugs`
**Method**: POST

**Request Body**:

```json
{
  "name": "Amoxicillin",
  "generic_name": "Amoxicillin",
  "strength": "500mg",
  "dosage_form": "tablet",
  "manufacturer": "PharmaCo",
  "batch_number": "BATCH123",
  "expiry_date": "2026-12-31",
  "stock_quantity": 1000,
  "unit_price": 0.5,
  "supplier": "MedSupply Inc",
  "requires_prescription": true,
  "storage_requirements": "Store at room temperature"
}
```

**Testing Steps**:

1. Go to `/dashboard/pharmacist/inventory`
2. Click "Add New Drug"
3. Fill in all required fields
4. Submit
5. Verify drug appears in inventory list

#### Update Stock

**API Endpoint**: `/api/drugs/[id]`
**Method**: PUT

**Request Body**:

```json
{
  "stock_quantity": 1500,
  "notes": "Received new shipment"
}
```

---

### Phase 6: Reports and Analytics

#### View Reports: `/dashboard/pharmacist/reports`

**Available Reports**:

1. **Dispensing History**

   - Date range filter
   - Patient-wise breakdown
   - Drug-wise breakdown

2. **Inventory Reports**

   - Current stock levels
   - Low stock items
   - Expiring items
   - Stock value

3. **Compliance Reports**

   - Controlled substances tracking
   - Prescription verification status
   - Blockchain verification status

4. **Export Options**:
   - CSV format
   - PDF format
   - Date range selection

---

## Common Issues and Solutions

### Issue 1: "Unauthorized" Error

**Cause**: Not logged in as pharmacist or token expired
**Solution**:

1. Verify role is set to "pharmacist"
2. Check localStorage for `auth_token`
3. Re-login if token expired

### Issue 2: No Prescriptions Showing

**Cause**: No verified prescriptions in database
**Solution**:

1. Create prescriptions as doctor first
2. Verify prescription status is "verified" or "pending"
3. Check API response in browser console

### Issue 3: Cannot Dispense

**Cause**: Prescription not in "verified" status
**Solution**:

1. Prescription must be verified first
2. Check prescription status in database
3. Update status to "verified" if needed

### Issue 4: Stock Deduction Not Working

**Cause**: Drug not found or insufficient permissions
**Solution**:

1. Verify drug exists in inventory
2. Check stock_quantity field
3. Ensure pharmacist has proper role permissions

### Issue 5: Blockchain Hash Not Showing

**Cause**: Blockchain service not recording properly
**Solution**:

1. Check debug logs in console
2. Verify BlockchainService is initialized
3. Check if transaction was recorded

---

## Testing Checklist

### Basic Flow

- [ ] Login as pharmacist
- [ ] View dashboard with stats
- [ ] See pending prescriptions list
- [ ] Filter prescriptions by status
- [ ] Search prescriptions by patient/number
- [ ] View prescription details
- [ ] See patient allergies
- [ ] View blockchain verification

### Dispensing Flow

- [ ] Select verified prescription
- [ ] Open dispense modal
- [ ] Fill quantity and notes
- [ ] Submit dispensing
- [ ] See success message
- [ ] Verify status changed to "dispensed"
- [ ] Check inventory reduced
- [ ] See blockchain transaction hash

### Inventory Management

- [ ] View inventory list
- [ ] See low stock alerts
- [ ] See expiring items
- [ ] Add new drug
- [ ] Update stock quantity
- [ ] View transaction history

### Reports

- [ ] Generate dispensing report
- [ ] Export to CSV
- [ ] Export to PDF
- [ ] Filter by date range
- [ ] View compliance report

### Error Handling

- [ ] Try dispensing with insufficient stock
- [ ] Try dispensing already dispensed prescription
- [ ] Try dispensing unverified prescription
- [ ] Try dispensing expired drug
- [ ] Verify error messages display correctly

---

## API Endpoints Summary

| Endpoint                        | Method | Purpose               | Auth       |
| ------------------------------- | ------ | --------------------- | ---------- |
| `/api/prescriptions/pharmacist` | GET    | List prescriptions    | Pharmacist |
| `/api/prescriptions/dispense`   | POST   | Dispense prescription | Pharmacist |
| `/api/drugs`                    | GET    | List inventory        | Pharmacist |
| `/api/drugs`                    | POST   | Add drug              | Pharmacist |
| `/api/drugs/[id]`               | PUT    | Update drug           | Pharmacist |
| `/api/drugs/alerts`             | GET    | Low stock alerts      | Pharmacist |
| `/api/reporting/dispensed`      | GET    | Dispensing report     | Pharmacist |
| `/api/reporting/stock`          | GET    | Stock report          | Pharmacist |

---

## Database Schema Reference

### Prescription Status Flow:

1. **pending** - Created by doctor, awaiting verification
2. **verified** - Verified and ready for dispensing
3. **dispensed** - Dispensed to patient
4. **rejected** - Rejected (invalid, contraindication, etc.)
5. **expired** - Past validity period

### Key Fields to Monitor:

- `status` - Current prescription status
- `quantity_prescribed` - Amount prescribed
- `quantity_dispensed` - Amount actually dispensed
- `pharmacist_id` - Who dispensed it
- `date_dispensed` - When it was dispensed
- `blockchain_hash` - Blockchain verification

---

## Next Steps

1. **Test the Complete Flow**:

   - Create prescription as doctor
   - Login as pharmacist
   - Verify and dispense prescription
   - Check inventory deduction
   - Verify blockchain recording

2. **Check Integration Points**:

   - Prescription → Patient linking
   - Inventory → Drug deduction
   - Blockchain → Transaction recording
   - Reporting → Data accuracy

3. **Debug Issues**:

   - Check browser console for errors
   - Review API responses
   - Verify database records
   - Check blockchain transaction logs

4. **Optimize Performance**:
   - Test with multiple prescriptions
   - Check loading times
   - Verify pagination works
   - Test search functionality

---

## Support and Documentation

- Main Documentation: See `TESTING_GUIDE.md`
- API Reference: See individual route files
- Blockchain Integration: See `BLOCKCHAIN_INTEGRATION.md`
- Reporting Module: See `REPORTING_COMPLIANCE_MODULE.md`

---

**Ready to test? Start by logging in as a pharmacist and following Phase 1!** 🏥💊
