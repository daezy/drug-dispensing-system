# Drug Inventory Management System - Testing Guide

## 🚀 Quick Start Testing

### Prerequisites

1. Server running on `localhost:3002`
2. MongoDB connected
3. Logged in as **Pharmacist** role

---

## 📋 Testing Checklist

### ✅ Test 1: Add New Drug to Inventory

**Steps:**

1. Navigate to `http://localhost:3002/dashboard/pharmacist/inventory`
2. Click **"Add Drug"** button (top-right, purple button)
3. Fill in the form:
   - **Drug Name**: "Amoxicillin" (required)
   - **Generic Name**: "Amoxicillin Trihydrate"
   - **Dosage Form**: Select "Capsule"
   - **Strength**: "500mg" (required)
   - **Manufacturer**: "Pfizer" (required)
   - **Batch Number**: "BATCH-2025-001"
   - **Expiry Date**: Select a future date (e.g., 2026-12-31) (required)
   - **Initial Stock Quantity**: 100
   - **Minimum Stock Level**: 20
   - **Unit Price**: 2.50
   - **Category**: "Antibiotic"
   - **Description**: "Used to treat bacterial infections"
4. Click **"Add Drug"**

**Expected Results:**

- ✅ Success message appears
- ✅ Modal closes
- ✅ New drug appears in inventory table
- ✅ Stats update (Total Drugs count increases)
- ✅ Console shows blockchain transaction:
  ```
  ✅ Added drug: Amoxicillin (drugId)
     Blockchain hash: abc123...
  ```

**Verify Blockchain:**

1. Open browser DevTools Console (F12)
2. Look for blockchain log with transaction hash
3. Hash should start with transaction ID like `STOCK_...`

---

### ✅ Test 2: View Inventory Alerts

**Steps:**

1. Stay on inventory page
2. Look at the top stats cards
3. Look for alert banners below stats

**Expected Results:**

- ✅ **Low Stock** count shows items where `stock_quantity ≤ minimum_stock_level`
- ✅ **Expiring Soon** count shows drugs expiring within 30 days
- ✅ **Expired** count shows drugs past expiry date
- ✅ Alert banners appear with appropriate colors:
  - Red banner for expired drugs
  - Yellow banner for expiring soon
  - Orange banner for low stock

**To Test Low Stock Alert:**

1. Add a drug with stock quantity = 5, minimum level = 10
2. Low Stock count should increase
3. Orange alert banner should appear

---

### ✅ Test 3: Update Stock (Add Inventory)

**Steps:**

1. Find the drug you just added in the table
2. Click the **edit icon** (pencil) in the Actions column
3. In the Update Stock modal:
   - Ensure "Add Stock" is selected (green)
   - Enter Quantity: 50
   - Add Notes: "Restocking - new shipment arrived"
4. Click **"Update Stock"**

**Expected Results:**

- ✅ Modal closes
- ✅ Drug stock quantity increases (100 → 150)
- ✅ Table updates automatically
- ✅ Console shows:
  ```
  ✅ Updated drug: Amoxicillin (drugId)
     Blockchain hash: def456...
  ```

**Verify:**

- Check that the stock in the table now shows 150
- New blockchain transaction created with type `stock_in`

---

### ✅ Test 4: Update Stock (Remove - Damaged)

**Steps:**

1. Click edit icon on the same drug
2. In the Update Stock modal:
   - Click "Remove Stock" button (red)
   - Enter Quantity: 10
   - Select Reason: "Damaged"
   - Add Notes: "Found damaged bottles"
3. Click **"Update Stock"**

**Expected Results:**

- ✅ Stock decreases (150 → 140)
- ✅ Blockchain transaction with type `damaged`
- ✅ Table updates immediately

---

### ✅ Test 5: Search and Filter

**Steps:**

1. In the search box, type "Amox"
2. Results should filter to show only matching drugs
3. Clear search
4. Click "Filter" dropdown and select a category (e.g., "Antibiotic")

**Expected Results:**

- ✅ Search filters results in real-time
- ✅ Category filter shows only drugs in that category
- ✅ Filters are case-insensitive

---

### ✅ Test 6: Tab Navigation

**Steps:**

1. Click different tabs:
   - **All Drugs**
   - **Low Stock**
   - **Expiring**
   - **Expired**

**Expected Results:**

- ✅ Each tab shows filtered results
- ✅ Count in tab label matches displayed items
- ✅ Tab content updates without page reload

---

### ✅ Test 7: View Reports

**Steps:**

1. Navigate to `http://localhost:3002/dashboard/pharmacist/reports`
2. Should see 4 report type cards
3. Click **"Summary Report"** (purple card)

**Expected Results:**

- ✅ Shows overview stats:
  - Total Drugs count
  - Total Quantity
  - Total Value (in dollars)
- ✅ Shows alerts counts (low stock, expiring, expired)
- ✅ Shows category breakdown table

---

### ✅ Test 8: Blockchain Audit Report

**Steps:**

1. On reports page, click **"Blockchain Audit"** (green card)
2. Review the blockchain statistics

**Expected Results:**

- ✅ Shows total transactions count
- ✅ Shows breakdown by type (stock_in, dispensed, expired, etc.)
- ✅ Shows "Blockchain is valid and intact" message (green banner with shield icon)
- ✅ Shows recent transactions with:
  - Transaction type badge
  - Drug name
  - Quantity changes
  - Cryptographic hash (first 32 characters visible)
  - Timestamp

**Verify Integrity:**

- Green banner = Chain is valid ✅
- Red banner = Chain compromised ❌ (should never happen in normal operation)

---

### ✅ Test 9: Export Reports

**Steps:**

1. On any report view, click **"Export"** button
2. Check your Downloads folder

**Expected Results:**

- ✅ JSON file downloads automatically
- ✅ Filename includes date: `inventory-summary-2025-10-30.json`
- ✅ File contains complete report data
- ✅ Can open and read JSON structure

---

### ✅ Test 10: Prescription Dispensing (Auto Stock Deduction)

**Steps:**

1. First, ensure you have a drug in inventory with sufficient stock
2. Use API testing tool (Postman) or browser DevTools:

```javascript
// In browser console:
fetch("/api/prescriptions/dispense", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify({
    prescriptionId: "YOUR_PRESCRIPTION_ID",
    quantityDispensed: 5,
    notes: "Testing automatic stock deduction",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Dispense result:", data));
```

**Expected Results:**

- ✅ Response shows success
- ✅ Drug stock automatically reduced by dispensed quantity
- ✅ Blockchain transaction created with type `dispensed`
- ✅ Prescription status updated to "dispensed"
- ✅ If stock goes below minimum, low stock alert appears
- ✅ Console shows:
  ```
  ✅ Prescription dispensed: prescriptionId
     Drug: Amoxicillin
     Quantity: 5
     New stock: 135
     Blockchain hash: ghi789...
  ```

---

### ✅ Test 11: Stock Validation (Insufficient Stock)

**Steps:**

1. Try to dispense more than available stock
2. Use the API call from Test 10, but set `quantityDispensed` higher than current stock

**Expected Results:**

- ✅ Error response: "Insufficient stock"
- ✅ Shows available vs requested quantities
- ✅ Stock NOT deducted
- ✅ NO blockchain transaction created
- ✅ Prescription status unchanged

---

### ✅ Test 12: Expired Drug Prevention

**Steps:**

1. Add a drug with past expiry date (e.g., 2024-01-01)
2. Try to dispense it using API

**Expected Results:**

- ✅ Error: "Cannot dispense expired drug"
- ✅ Stock NOT deducted
- ✅ Drug shows in "Expired" tab
- ✅ Red "Expired" badge in inventory table

---

### ✅ Test 13: Delete Drug

**Steps:**

1. Find a drug in inventory table
2. Click **trash icon** (red) in Actions column
3. Confirm deletion in popup

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ Drug removed from table
- ✅ Stats update (Total Drugs decreases)
- ✅ Blockchain transaction created with type `expired`
- ✅ Drug history preserved in blockchain

---

### ✅ Test 14: Real-time Stats Update

**Steps:**

1. Note current stats in the 4 cards at top
2. Add a new drug with value (e.g., 100 units × $5 = $500)
3. Watch stats cards

**Expected Results:**

- ✅ Total Drugs increases
- ✅ Total Value increases by correct amount
- ✅ Updates happen without page refresh
- ✅ All stats accurate

---

### ✅ Test 15: Low Stock Alert Trigger

**Steps:**

1. Add drug with: stock=25, minimum=20 (above threshold)
2. Update stock: Remove 10 (new stock=15, below minimum)

**Expected Results:**

- ✅ Low Stock count increases by 1
- ✅ Orange alert banner appears
- ✅ Drug appears in "Low Stock" tab
- ✅ Orange "Low Stock" badge in table

---

## 🔍 Advanced Testing

### Test Blockchain Integrity

**Steps:**

1. Go to Reports → Blockchain Audit
2. Note the "Blockchain is valid and intact" message
3. Check browser console for verification logs

**Manual Verification:**

```javascript
// In browser console:
fetch("/api/drugs/reports?type=blockchain", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Chain Integrity:", data.data.statistics.chainIntegrity);
    console.log("Total Transactions:", data.data.statistics.totalTransactions);
    console.log("Recent Transactions:", data.data.recentTransactions);
  });
```

---

### Test API Endpoints Directly

#### 1. Get All Drugs

```bash
curl http://localhost:3002/api/drugs
```

#### 2. Get Low Stock Drugs

```bash
curl http://localhost:3002/api/drugs?lowStock=true
```

#### 3. Get Alerts

```bash
curl http://localhost:3002/api/drugs/alerts?type=all
```

#### 4. Get Reports

```bash
curl http://localhost:3002/api/drugs/reports?type=summary
```

#### 5. Add Drug (requires auth)

```bash
curl -X POST http://localhost:3002/api/drugs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Ibuprofen",
    "dosage_form": "tablet",
    "strength": "200mg",
    "manufacturer": "Generic Pharma",
    "expiry_date": "2026-12-31",
    "stock_quantity": 200,
    "minimum_stock_level": 50,
    "unit_price": 0.50,
    "category": "Painkiller"
  }'
```

---

## 🎯 Success Criteria

All tests pass if:

- ✅ All CRUD operations work without errors
- ✅ Blockchain transactions created for every inventory change
- ✅ Stock automatically deducted when prescriptions dispensed
- ✅ Alerts appear for low stock, expiring, expired drugs
- ✅ Reports generate accurate data
- ✅ Blockchain integrity verification passes
- ✅ Search and filter work correctly
- ✅ Export functionality works
- ✅ No console errors (except expected validation errors)
- ✅ UI updates in real-time without page refresh

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" error

**Solution:** Make sure you're logged in as Pharmacist role

### Issue: Drug not appearing after adding

**Solution:** Check browser console for errors, verify all required fields filled

### Issue: Blockchain hash not showing

**Solution:** Check backend logs, ensure BlockchainService is initialized

### Issue: Stats not updating

**Solution:** Refresh page, check if API calls completing successfully

### Issue: "Insufficient stock" error

**Solution:** Verify drug has enough stock, check current quantity in table

### Issue: Export not downloading

**Solution:** Check browser download settings, allow pop-ups

---

## 📊 Expected Console Logs

When everything works correctly, you should see logs like:

```
✅ Blockchain: Added transaction STOCK_1730304000000_abc123
   Drug: Amoxicillin (67890abcdef)
   Type: stock_in
   Quantity: 100
   Hash: a1b2c3d4e5f6...

✅ Added drug: Amoxicillin (67890abcdef)
   Blockchain hash: a1b2c3d4e5f6...

✅ Updated drug: Amoxicillin (67890abcdef)
   Blockchain hash: f6e5d4c3b2a1...

✅ Prescription dispensed: prescription123
   Drug: Amoxicillin
   Quantity: 5
   New stock: 95
   Blockchain hash: 1234567890ab...
```

---

## ✅ Final Verification

Run through all 15 tests in sequence. If all pass:

- ✅ System is working correctly
- ✅ Blockchain traceability active
- ✅ Automatic stock deduction functional
- ✅ Reports accurate
- ✅ **READY FOR PRODUCTION** 🚀

---

**Testing Date:** October 30, 2025  
**System Status:** Production Ready ✅
