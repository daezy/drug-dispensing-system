# Pharmacy System Architecture

## Overview

The drug dispensing system now supports **pharmacy-specific operations**, where drugs are tied to specific pharmacies, prescriptions can be directed to pharmacies, and pharmacists are associated with their respective pharmacies.

---

## Data Model Changes

### 1. New Entity: Pharmacy

A **Pharmacy** represents a physical pharmacy location with the following attributes:

```typescript
interface Pharmacy {
  pharmacy_id: number;
  name: string; // e.g., "CVS Pharmacy - Main Street"
  license_number: string; // Unique pharmacy license
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  operating_hours?: string; // e.g., "Mon-Fri 9AM-9PM"
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### 2. Updated Entities

#### **Pharmacist**

- Added `pharmacy_id` field
- Links pharmacist to their pharmacy
- Can query all pharmacists at a specific pharmacy

```typescript
interface Pharmacist {
  pharmacist_id: number;
  user_id: number;
  pharmacy_id?: number; // NEW: Link to pharmacy
  license_number: string;
  pharmacy_name?: string; // Deprecated - use pharmacy.name
  contact_info?: ContactInfo;
  verification_status: "pending" | "verified" | "rejected";
  pharmacy?: Pharmacy; // NEW: Related pharmacy object
}
```

#### **Drug**

- Added `pharmacy_id` field
- Drugs are now pharmacy-specific inventory
- Each pharmacy maintains its own stock

```typescript
interface Drug {
  drug_id: number;
  pharmacy_id?: number; // NEW: Pharmacy-specific inventory
  name: string;
  generic_name?: string;
  dosage_form: string;
  strength: string;
  stock_quantity: number; // Stock at THIS pharmacy
  // ... other fields
  pharmacy?: Pharmacy; // NEW: Related pharmacy object
}
```

#### **Prescription**

- Added `pharmacy_id` field
- Doctor can specify target pharmacy when prescribing
- Prescription is dispensed at the specified pharmacy

```typescript
interface Prescription {
  prescription_id: number;
  patient_id: number;
  doctor_id: number;
  drug_id: number;
  pharmacy_id?: number; // NEW: Target pharmacy for dispensing
  pharmacist_id?: number; // Pharmacist who dispensed (from pharmacy)
  quantity_prescribed: number;
  status: "pending" | "verified" | "dispensed" | "rejected" | "expired";
  // ... other fields
}
```

---

## Workflow Examples

### 1. Doctor Creates Prescription

```typescript
// Doctor selects a pharmacy when creating prescription
const prescription = {
  patient_id: "patient123",
  doctor_id: "doctor456",
  drug_id: "drug789", // Drug must exist at the pharmacy
  pharmacy_id: "pharmacy001", // Target pharmacy
  quantity_prescribed: 30,
  dosage_instructions: "Take 1 tablet daily",
  status: "pending",
};
```

**Benefits:**

- Patient knows which pharmacy to visit
- Pharmacy receives prescription directly
- Stock availability can be checked upfront

### 2. Pharmacist Dispenses Prescription

```typescript
// Pharmacist at pharmacy_id "pharmacy001" dispenses
const dispense = {
  prescriptionId: "rx123",
  pharmacistId: "pharmacist789", // Must be from same pharmacy
  quantityDispensed: 30,
  notes: "Patient counseled on side effects",
};

// System validates:
// 1. Pharmacist belongs to prescription's pharmacy
// 2. Drug stock is available at this pharmacy
// 3. Prescription status is "verified"
```

**Benefits:**

- Only pharmacists from correct pharmacy can dispense
- Stock is deducted from correct pharmacy inventory
- Audit trail links to specific pharmacy location

### 3. Pharmacy-Specific Inventory

```typescript
// Query drugs at a specific pharmacy
const drugsAtPharmacy = await DrugModel.find({
  pharmacy_id: "pharmacy001",
  stock_quantity: { $gt: 0 }, // In stock
}).populate("pharmacy");

// Each pharmacy maintains separate inventory
// Pharmacy A: Amoxicillin - 500 units
// Pharmacy B: Amoxicillin - 200 units
```

**Benefits:**

- Independent stock management per pharmacy
- Low stock alerts are pharmacy-specific
- Inventory reports per pharmacy

---

## Database Schema

### Pharmacy Collection

```javascript
{
  _id: ObjectId,
  name: String,
  license_number: String (unique),
  address: String,
  city: String,
  state: String,
  zip_code: String,
  phone: String,
  email: String,
  operating_hours: String,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Updated Collections

**Pharmacists:**

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  pharmacy_id: ObjectId (ref: Pharmacy),  // NEW
  license_number: String,
  // ... other fields
}
```

**Drugs:**

```javascript
{
  _id: ObjectId,
  pharmacy_id: ObjectId (ref: Pharmacy),  // NEW
  name: String,
  stock_quantity: Number,
  // ... other fields
}
```

**Prescriptions:**

```javascript
{
  _id: ObjectId,
  patient_id: ObjectId (ref: Patient),
  doctor_id: ObjectId (ref: Doctor),
  drug_id: ObjectId (ref: Drug),
  pharmacy_id: ObjectId (ref: Pharmacy),  // NEW
  pharmacist_id: ObjectId (ref: Pharmacist),
  // ... other fields
}
```

---

## API Endpoints (New/Updated)

### Pharmacy Management

#### Create Pharmacy

```http
POST /api/pharmacies
Content-Type: application/json

{
  "name": "CVS Pharmacy - Main Street",
  "license_number": "PHR-2024-001",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "phone": "+1-555-0123",
  "email": "mainst@cvs.com",
  "operating_hours": "Mon-Fri 9AM-9PM, Sat-Sun 10AM-6PM"
}
```

#### Get Pharmacies

```http
GET /api/pharmacies
GET /api/pharmacies?city=New York
GET /api/pharmacies?state=NY
```

#### Get Pharmacy Details

```http
GET /api/pharmacies/:pharmacyId
```

### Updated Endpoints

#### Create Prescription (Doctor)

```http
POST /api/prescriptions/doctor
Content-Type: application/json

{
  "patient_id": "patient123",
  "drug_id": "drug789",
  "pharmacy_id": "pharmacy001",        // NEW: Specify pharmacy
  "quantity_prescribed": 30,
  "dosage_instructions": "Take 1 tablet daily"
}
```

#### Get Pharmacy Inventory

```http
GET /api/drugs?pharmacy_id=pharmacy001
GET /api/drugs/low-stock?pharmacy_id=pharmacy001
```

#### Get Prescriptions for Pharmacy

```http
GET /api/prescriptions/pharmacist?pharmacy_id=pharmacy001
GET /api/prescriptions/pharmacist?status=verified&pharmacy_id=pharmacy001
```

---

## Migration Guide

### For Existing Data

#### 1. Create Default Pharmacy

```javascript
// Create a default pharmacy for existing data
const defaultPharmacy = await PharmacyModel.create({
  name: "Main Pharmacy",
  license_number: "PHR-DEFAULT-001",
  address: "123 Default St",
  city: "Default City",
  state: "XX",
  zip_code: "00000",
  phone: "+1-000-0000",
  is_active: true,
});
```

#### 2. Update Existing Pharmacists

```javascript
// Link existing pharmacists to default pharmacy
await PharmacistModel.updateMany(
  { pharmacy_id: { $exists: false } },
  { $set: { pharmacy_id: defaultPharmacy._id } }
);
```

#### 3. Update Existing Drugs

```javascript
// Link existing drugs to default pharmacy
await DrugModel.updateMany(
  { pharmacy_id: { $exists: false } },
  { $set: { pharmacy_id: defaultPharmacy._id } }
);
```

#### 4. Update Existing Prescriptions

```javascript
// Link existing prescriptions to default pharmacy
await PrescriptionModel.updateMany(
  { pharmacy_id: { $exists: false } },
  { $set: { pharmacy_id: defaultPharmacy._id } }
);
```

### For New Installations

1. **Create Pharmacies First**

   - Set up pharmacy locations
   - Get pharmacy IDs

2. **Create Pharmacists**

   - Assign to pharmacies using `pharmacy_id`

3. **Add Drugs**

   - Add drugs to specific pharmacy inventory
   - Use `pharmacy_id` field

4. **Create Prescriptions**
   - Doctors specify `pharmacy_id` when prescribing
   - System validates drug availability at that pharmacy

---

## Business Logic Changes

### Prescription Validation

#### Before

```javascript
// Only checked if drug exists
const drug = await DrugModel.findById(drug_id);
if (!drug) throw new Error("Drug not found");
```

#### After

```javascript
// Check if drug exists at specific pharmacy
const drug = await DrugModel.findOne({
  _id: drug_id,
  pharmacy_id: pharmacy_id,
});
if (!drug) throw new Error("Drug not available at this pharmacy");
```

### Dispensing Validation

#### Before

```javascript
// Only checked pharmacist role
if (user.role !== "pharmacist") {
  throw new Error("Unauthorized");
}
```

#### After

```javascript
// Check pharmacist works at prescription's pharmacy
const pharmacist = await PharmacistModel.findOne({
  user_id: user.id,
  pharmacy_id: prescription.pharmacy_id,
});
if (!pharmacist) {
  throw new Error("Pharmacist not authorized for this pharmacy");
}
```

### Inventory Management

```javascript
// Stock is pharmacy-specific
const lowStock = await DrugModel.find({
  pharmacy_id: "pharmacy001",
  $expr: { $lt: ["$stock_quantity", "$minimum_stock_level"] },
});
```

---

## Benefits

### 1. **Multi-Location Support**

- Support pharmacy chains with multiple locations
- Each location has independent inventory
- Centralized management possible

### 2. **Better Patient Experience**

- Patient knows which pharmacy to visit
- Can choose nearby pharmacy
- Can transfer prescriptions between pharmacies

### 3. **Accurate Inventory**

- Stock levels are location-specific
- No confusion about availability
- Better supply chain management

### 4. **Improved Security**

- Pharmacists can only dispense at their pharmacy
- Audit trail includes pharmacy location
- Better fraud prevention

### 5. **Analytics & Reporting**

- Per-pharmacy reports
- Compare pharmacy performance
- Optimize stock distribution

---

## Next Steps

1. **Create Pharmacy Management UI**

   - Admin panel to create/edit pharmacies
   - Pharmacy selection for doctors
   - Pharmacy profile for pharmacists

2. **Update Prescription Flow**

   - Add pharmacy selection to prescription form
   - Show pharmacy details to patients
   - Filter prescriptions by pharmacy

3. **Enhance Inventory Management**

   - Pharmacy-specific inventory views
   - Transfer drugs between pharmacies
   - Multi-pharmacy stock search

4. **Add Pharmacy Search**

   - Find pharmacies by location
   - Show pharmacies with drug in stock
   - Distance-based sorting

5. **Implement Transfer System**
   - Transfer prescriptions between pharmacies
   - Transfer inventory between locations
   - Track transfer history

---

## Example Queries

### Find Pharmacies with Specific Drug in Stock

```javascript
const pharmaciesWithDrug = await DrugModel.find({
  name: "Amoxicillin",
  stock_quantity: { $gt: 0 },
}).populate("pharmacy");
```

### Get All Prescriptions for a Pharmacy

```javascript
const pharmacyPrescriptions = await PrescriptionModel.find({
  pharmacy_id: "pharmacy001",
  status: "verified",
})
  .populate("patient_id")
  .populate("doctor_id")
  .populate("drug_id");
```

### Get Pharmacists at a Pharmacy

```javascript
const pharmacists = await PharmacistModel.find({
  pharmacy_id: "pharmacy001",
  verification_status: "verified",
}).populate("user_id");
```

### Pharmacy Dashboard Stats

```javascript
const stats = {
  totalPrescriptions: await PrescriptionModel.countDocuments({
    pharmacy_id: "pharmacy001",
  }),
  pendingPrescriptions: await PrescriptionModel.countDocuments({
    pharmacy_id: "pharmacy001",
    status: "verified",
  }),
  totalDrugs: await DrugModel.countDocuments({
    pharmacy_id: "pharmacy001",
  }),
  lowStockDrugs: await DrugModel.countDocuments({
    pharmacy_id: "pharmacy001",
    $expr: { $lt: ["$stock_quantity", "$minimum_stock_level"] },
  }),
};
```

---

## Backward Compatibility

To maintain backward compatibility:

1. **`pharmacy_id` is optional** in all schemas
2. **Existing code without pharmacy_id continues to work**
3. **Default pharmacy can be created** for existing data
4. **Gradual migration** is supported

### Example: Making it Required Later

```javascript
// Phase 1: Add as optional (current)
pharmacy_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Pharmacy",
  // required: false  (default)
}

// Phase 2: After migration, make required
pharmacy_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Pharmacy",
  required: true  // Enforce after migration
}
```

---

## Summary

The pharmacy system enhancement provides:

- ✅ Multi-location pharmacy support
- ✅ Pharmacy-specific inventory management
- ✅ Prescription routing to specific pharmacies
- ✅ Enhanced security and audit trails
- ✅ Better analytics and reporting
- ✅ Backward compatible implementation

This architecture supports both single-pharmacy and multi-pharmacy chain operations while maintaining data integrity and security.
