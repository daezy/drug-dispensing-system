# Reporting & Compliance Module - Integration Guide

## Quick Start

This guide shows how to integrate the Reporting & Compliance Module components into your Drug Dispensing System.

---

## 1. Admin Dashboard Integration

### Option A: Add to Existing Admin Dashboard

Update your admin dashboard page to include the compliance dashboard:

**File**: `src/app/dashboard/admin/page.tsx`

```typescript
import ComplianceDashboard from "@/components/ComplianceDashboard";

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <ComplianceDashboard />
    </div>
  );
}
```

### Option B: Create Separate Compliance Page

Create a dedicated compliance monitoring page:

**File**: `src/app/dashboard/admin/compliance/page.tsx`

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComplianceDashboard from "@/components/ComplianceDashboard";
import FraudAlertsDashboard from "@/components/FraudAlertsDashboard";
import ComplianceReports from "@/components/ComplianceReports";

export default function CompliancePage() {
  return (
    <div className="p-6">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="fraud">
          <FraudAlertsDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <ComplianceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 2. Navigation Menu Integration

Add compliance menu items to your admin navigation:

**File**: `src/components/DashboardLayout.tsx`

```typescript
const adminMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard/admin",
    icon: "LayoutDashboard",
  },
  {
    name: "Compliance",
    href: "/dashboard/admin/compliance",
    icon: "Shield",
    submenu: [
      {
        name: "Overview",
        href: "/dashboard/admin/compliance",
      },
      {
        name: "Fraud Alerts",
        href: "/dashboard/admin/compliance?tab=fraud",
      },
      {
        name: "Reports",
        href: "/dashboard/admin/compliance?tab=reports",
      },
    ],
  },
  // ... other menu items
];
```

---

## 3. Role-Based Access Control

Ensure only admins can access compliance features:

**File**: `src/app/dashboard/admin/compliance/layout.tsx`

```typescript
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return <>{children}</>;
}
```

---

## 4. Missing UI Components

If you don't have these Shadcn UI components, install them:

```bash
# Calendar component (required for date picker)
npx shadcn-ui@latest add calendar

# Popover component (required for date picker)
npx shadcn-ui@latest add popover

# Tabs component (for tabbed interface)
npx shadcn-ui@latest add tabs

# Select component (for dropdowns)
npx shadcn-ui@latest add select
```

Also install date-fns for date formatting:

```bash
npm install date-fns
```

---

## 5. Database Setup

Ensure your MongoDB collections have the required indexes for performance:

```javascript
// Connect to MongoDB
use drug_dispensing

// Create indexes for dispensing records
db.dispensingrecords.createIndex({ dispensed_date: -1 })
db.dispensingrecords.createIndex({ patient_id: 1 })
db.dispensingrecords.createIndex({ drug_id: 1 })
db.dispensingrecords.createIndex({ prescription_id: 1 })

// Create indexes for prescriptions
db.prescriptions.createIndex({ created_at: -1 })
db.prescriptions.createIndex({ status: 1 })
db.prescriptions.createIndex({ patient_id: 1 })
db.prescriptions.createIndex({ doctor_id: 1 })

// Create indexes for drugs
db.drugs.createIndex({ current_stock: 1 })
db.drugs.createIndex({ expiry_date: 1 })
db.drugs.createIndex({ drug_name: 1 })

// Create indexes for audit logs
db.auditlogs.createIndex({ timestamp: -1 })
db.auditlogs.createIndex({ user_id: 1 })
db.auditlogs.createIndex({ action: 1 })
```

---

## 6. Test Data Generation (Optional)

Create sample data for testing the fraud detection:

**File**: `scripts/generate-test-data.js`

```javascript
// Generate duplicate prescriptions
db.prescriptions.insertMany([
  {
    prescription_id: "rx_001",
    patient_id: "pat_123",
    doctor_id: "doc_001",
    drug_id: "drug_456",
    quantity_prescribed: 30,
    created_at: new Date(),
    status: "verified",
  },
  {
    prescription_id: "rx_002",
    patient_id: "pat_123",
    doctor_id: "doc_002", // Different doctor
    drug_id: "drug_456", // Same drug
    quantity_prescribed: 30,
    created_at: new Date(),
    status: "verified",
  },
]);

// Generate excessive dispensing
db.dispensingrecords.insertOne({
  dispensing_id: "disp_001",
  prescription_id: "rx_003",
  patient_id: "pat_456",
  drug_id: "drug_789",
  quantity_dispensed: 50, // More than prescribed
  dispensed_date: new Date(),
  status: "completed",
});

db.prescriptions.insertOne({
  prescription_id: "rx_003",
  patient_id: "pat_456",
  drug_id: "drug_789",
  quantity_prescribed: 30, // Less than dispensed
  status: "verified",
});

// Generate expired drug dispensing
db.dispensingrecords.insertOne({
  dispensing_id: "disp_002",
  prescription_id: "rx_004",
  drug_id: "drug_expired",
  dispensed_date: new Date(),
  status: "completed",
});

db.drugs.insertOne({
  drug_id: "drug_expired",
  drug_name: "Expired Medicine",
  expiry_date: new Date("2023-01-01"), // Already expired
  current_stock: 100,
});
```

---

## 7. Testing the Integration

### Test Checklist:

1. **Dashboard Access**

   - [ ] Navigate to `/dashboard/admin/compliance`
   - [ ] Verify dashboard loads with metrics
   - [ ] Check auto-refresh is working (30s interval)
   - [ ] Verify trend indicators show correctly

2. **Fraud Alerts**

   - [ ] Switch to Fraud Alerts tab
   - [ ] Verify alerts are displayed
   - [ ] Test severity filters (critical, medium, low)
   - [ ] Test status filters (pending, investigating, resolved)
   - [ ] Test fraud type filters

3. **Reports**

   - [ ] Switch to Reports tab
   - [ ] Select each report type (audit logs, dispensed drugs, stock levels)
   - [ ] Select date range
   - [ ] Click "Preview Report"
   - [ ] Verify preview displays correctly
   - [ ] Click "Export CSV"
   - [ ] Verify CSV downloads
   - [ ] Click "Export PDF"
   - [ ] Verify PDF HTML generates

4. **Error Handling**
   - [ ] Test with invalid date ranges
   - [ ] Test with no data available
   - [ ] Test with network disconnection
   - [ ] Verify error messages are user-friendly

---

## 8. Production Deployment

### Environment Variables:

```env
# MongoDB
MONGODB_URI=mongodb://your-production-server:27017/drug_dispensing

# Node Environment
NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### Build and Deploy:

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Start production server
npm start
```

### Performance Tuning:

1. **Enable Database Caching**:

   - Use Redis for caching dashboard metrics
   - Cache fraud detection results for 5 minutes
   - Cache report previews for 1 minute

2. **Optimize Database Queries**:

   - Ensure all indexes are created
   - Use aggregation pipelines instead of multiple queries
   - Limit result sets with pagination

3. **Enable Compression**:
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
   };
   ```

---

## 9. Monitoring & Alerts

### Setup Application Monitoring:

```typescript
// lib/monitoring.ts
export async function logError(error: Error, context: string) {
  console.error(`[${context}]`, error);

  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error);
}

export async function logMetric(metric: string, value: number) {
  console.log(`[METRIC] ${metric}:`, value);

  // Send to metrics service (e.g., DataDog, New Relic)
  // metrics.gauge(metric, value);
}
```

### Usage in API Routes:

```typescript
// app/api/reporting/fraud/route.ts
import { logError, logMetric } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const result = await ReportingService.getInstance().detectFraud();

    // Log metrics
    const duration = Date.now() - startTime;
    await logMetric("fraud_detection_duration_ms", duration);
    await logMetric("fraud_alerts_count", result.alerts.length);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    await logError(error, "fraud_detection");
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 10. Troubleshooting

### Common Issues:

1. **"Cannot read property 'getInstance' of undefined"**

   - Ensure ReportingService is imported correctly
   - Check that DatabaseManager is initialized

2. **"No data available"**

   - Verify MongoDB connection
   - Check that collections have data
   - Run test data generation script

3. **"Export not working"**

   - Check browser download settings
   - Verify API endpoint is accessible
   - Check CORS settings

4. **"Dashboard not refreshing"**
   - Check auto-refresh toggle is ON
   - Verify network connectivity
   - Check browser console for errors

---

## Conclusion

Your Reporting & Compliance Module is now fully integrated! 🎉

For any issues or questions, refer to:

- **Full Documentation**: `REPORTING_COMPLIANCE_MODULE.md`
- **API Reference**: Check individual route files in `src/app/api/reporting/`
- **Component Documentation**: Check component files for usage examples

**Next Steps**:

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Train admin users on the new features
4. Monitor fraud detection results
5. Adjust detection thresholds as needed
