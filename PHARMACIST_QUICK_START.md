# Pharmacist Flow - Quick Start Guide 🏥💊

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Test Data

```bash
# You need:
1. Pharmacist account (email: pharmacist@test.com)
2. Doctor account (to create prescriptions)
3. Patient account (to receive prescriptions)
4. Drugs in inventory
```

### Step 2: Login as Pharmacist

```
URL: http://localhost:3002
Role: Pharmacist
Email: your-pharmacist-email
Password: your-password
```

### Step 3: Access Dashboard

```
Automatically redirected to: /dashboard/pharmacist
```

---

## 📋 Key Pages

| Page          | URL                                   | Purpose          |
| ------------- | ------------------------------------- | ---------------- |
| Dashboard     | `/dashboard/pharmacist`               | Overview & stats |
| Prescriptions | `/dashboard/pharmacist/prescriptions` | View & dispense  |
| Inventory     | `/dashboard/pharmacist/inventory`     | Manage drugs     |
| Reports       | `/dashboard/pharmacist/reports`       | Analytics        |
| Patients      | `/dashboard/pharmacist/patients`      | Patient history  |

---

## 🔄 Prescription Status Flow

```
pending → verified → dispensed
              ↓
           rejected
              ↓
           expired
```

### Status Meanings:

- **pending**: Just created, needs verification
- **verified**: Approved, ready to dispense
- **dispensed**: Given to patient ✅
- **rejected**: Invalid/contraindication ❌
- **expired**: Past validity period ⏰

---

## 💊 Dispense Prescription Workflow

### Quick Steps:

1. **View Prescriptions** → `/dashboard/pharmacist/prescriptions`
2. **Filter by Status** → Select "Verified"
3. **Click Prescription** → View details
4. **Check Patient Info** → Allergies, insurance
5. **Click "Dispense"** → Opens modal
6. **Enter Quantity** → Default is prescribed amount
7. **Add Notes** → Optional counseling notes
8. **Confirm** → Dispenses and updates inventory

### What Happens Automatically:

- ✅ Inventory reduced by quantity dispensed
- ✅ Blockchain transaction recorded
- ✅ Status changed to "dispensed"
- ✅ Timestamp and pharmacist ID saved
- ✅ Transaction hash generated

---

## 🔍 Important Checks Before Dispensing

### Safety Checks:

- [ ] Prescription is **verified** (not pending)
- [ ] Sufficient **stock** available
- [ ] Drug is **not expired**
- [ ] Check patient **allergies**
- [ ] Verify **dosage** and **instructions**
- [ ] Confirm **patient identity**

### System Checks (Automatic):

- Stock quantity validation
- Expiry date verification
- Prescription status check
- Authentication verification

---

## 📊 API Endpoints

### Get Prescriptions

```javascript
GET /api/prescriptions/pharmacist
Headers: { Authorization: `Bearer ${token}` }
Query: ?status=verified (optional)
```

### Dispense Prescription

```javascript
POST /api/prescriptions/dispense
Headers: {
  Authorization: `Bearer ${token}`,
  Content-Type: "application/json"
}
Body: {
  prescriptionId: "prescription_id",
  quantityDispensed: 30,
  notes: "Counseled on usage"
}
```

### Get Inventory

```javascript
GET / api / drugs;
Headers: {
  Authorization: `Bearer ${token}`;
}
```

---

## ⚠️ Common Errors & Solutions

### "Unauthorized" Error

```
Problem: Token expired or missing
Solution: Re-login and try again
```

### "Prescription must be verified before dispensing"

```
Problem: Status is "pending" not "verified"
Solution: Prescription needs verification first
```

### "Insufficient stock"

```
Problem: Not enough drugs in inventory
Solution: Update inventory or order more stock
```

### "Cannot dispense expired drug"

```
Problem: Drug past expiry date
Solution: Remove expired stock, order new batch
```

---

## 🎯 Testing Checklist

### Basic Operations

- [ ] Login as pharmacist
- [ ] View dashboard
- [ ] See pending prescriptions count
- [ ] View prescriptions list
- [ ] Filter by status
- [ ] Search prescriptions

### Dispensing

- [ ] Open prescription details
- [ ] Check patient allergies
- [ ] Click dispense button
- [ ] Enter quantity
- [ ] Add notes
- [ ] Confirm dispensing
- [ ] Verify success message
- [ ] Check blockchain hash displayed

### Inventory

- [ ] View inventory list
- [ ] See low stock alerts
- [ ] Add new drug
- [ ] Update stock quantity
- [ ] View transaction history

### Reports

- [ ] Generate dispensing report
- [ ] Export to CSV
- [ ] View by date range

---

## 🔐 Authentication

### Token Storage

```javascript
// Token saved in localStorage
const token = localStorage.getItem("auth_token");

// Include in all API requests
headers: {
  Authorization: `Bearer ${token}`;
}
```

### Token Expiry

- Tokens expire after 24 hours
- Re-login required if expired
- Automatic redirect to login page

---

## 📱 Mobile Responsiveness

All pharmacist pages are mobile-friendly:

- ✅ Responsive tables
- ✅ Touch-friendly buttons
- ✅ Optimized for tablets
- ✅ Works on phones

---

## 🎨 UI Components

### Prescription Card

```
┌─────────────────────────────────┐
│ RX5E009AB3          [Verified]  │
│ Patient: John Doe               │
│ Drug: Amoxicillin 500mg         │
│ Qty: 30 tablets                 │
│ [View Details] [Dispense]       │
└─────────────────────────────────┘
```

### Status Badges

- 🟡 Pending (Yellow)
- 🔵 Verified (Blue)
- 🟢 Dispensed (Green)
- 🔴 Rejected (Red)
- ⚫ Expired (Gray)

---

## 🚨 Emergency Procedures

### Urgent Prescription

```
1. Look for [URGENT] tag
2. Prioritize in queue
3. Verify stock availability
4. Dispense immediately
5. Note urgency in system
```

### Stock Out

```
1. Check alternative suppliers
2. Contact ordering department
3. Notify doctor of delay
4. Suggest therapeutic substitutes
5. Update patient on timeline
```

### System Down

```
1. Document manually
2. Patient ID + Prescription details
3. Enter in system when restored
4. Reconcile inventory
```

---

## 📞 Support

### Technical Issues

- Check browser console for errors
- Verify network connectivity
- Clear cache and cookies
- Try different browser

### Business Questions

- Refer to `PHARMACIST_FLOW_GUIDE.md`
- Check `TESTING_GUIDE.md`
- Review `REPORTING_COMPLIANCE_MODULE.md`

---

## 🎓 Training Resources

1. **Full Guide**: `PHARMACIST_FLOW_GUIDE.md`
2. **API Documentation**: See route files in `/api`
3. **Database Schema**: `src/lib/database/models.ts`
4. **Blockchain Integration**: `BLOCKCHAIN_INTEGRATION.md`

---

## 🏁 Ready to Start?

1. **Login** as pharmacist
2. Go to **Prescriptions** page
3. Click **"View Details"** on any prescription
4. Click **"Dispense"** button
5. Follow the prompts
6. **Success!** 🎉

---

**Need help? Check the full guide: `PHARMACIST_FLOW_GUIDE.md`**
