# Backend Integration Quick Start Guide

## Prerequisites

1. **MongoDB Database**: Ensure MongoDB is running and accessible
2. **Environment Variables**: Configure the following in your `.env.local` file

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/pharmchain_db
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pharmchain_db

# JWT Secret (REQUIRED for authentication)
JWT_SECRET=your-very-secure-secret-key-here-min-32-characters

# Next.js
NODE_ENV=development
```

## Step 1: Environment Setup

Create or update `.env.local` in the project root:

```bash
cp .env.example .env.local  # If you have an example file
# OR
touch .env.local
```

Add the environment variables listed above.

## Step 2: Install Dependencies (if needed)

The required packages should already be installed. If not:

```bash
npm install
```

Key dependencies:

- `jsonwebtoken@^9.0.2` ✅ Already installed
- `@types/jsonwebtoken@^9.0.10` ✅ Already installed
- `mongoose` ✅ Already installed

## Step 3: Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000` (or your configured port).

## Step 4: Test Authentication

### Option A: Using Existing Login Flow

1. Navigate to `/login`
2. Log in with existing credentials
3. The login endpoint will generate a JWT token
4. Token is stored in the response and can be used for API calls

### Option B: Manual API Testing with curl

First, login to get a token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

Then use the token to access protected endpoints:

```bash
# Example: Get patient prescriptions
curl -X GET http://localhost:3000/api/prescriptions/patient \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 5: Test Each Endpoint

### For Patients

```bash
# Get my prescriptions
GET /api/prescriptions/patient

# Get my doctors
GET /api/patients/doctors

# Get my history
GET /api/patients/history
```

### For Doctors

```bash
# Get my prescriptions (issued by me)
GET /api/prescriptions/doctor

# Get my patients
GET /api/doctors/patients

# Get my history
GET /api/doctors/history
```

### For Pharmacists

```bash
# Get available prescriptions
GET /api/prescriptions/pharmacist

# Filter by status
GET /api/prescriptions/pharmacist?status=verified

# Get all patients
GET /api/pharmacists/patients
```

## Step 6: Verify Data Flow

### Check MongoDB Connection

Look for this in your terminal logs:

```
✅ Connected to MongoDB successfully
```

### Check Authentication

Protected endpoints should:

- Return **401 Unauthorized** if no token
- Return **403 Forbidden** if wrong role
- Return **200 OK** with data if authenticated correctly

### Check Data Returns

Even with empty database, endpoints should return:

```json
{
  "success": true,
  "prescriptions": [] // or patients, doctors, history
}
```

## Troubleshooting

### Issue: "JWT_SECRET not set"

**Symptom**: Warning in console  
**Solution**: Add `JWT_SECRET` to `.env.local`

```env
JWT_SECRET=generate-a-secure-random-string-at-least-32-chars
```

### Issue: "MongoDB connection error"

**Symptoms**:

- `❌ MongoDB connection error:` in logs
- 500 errors on API calls

**Solutions**:

1. Check MongoDB is running: `mongod --version`
2. Verify MONGODB_URI is correct
3. Check network connectivity (for Atlas)
4. Verify database user permissions

### Issue: "Authentication required" (401)

**Cause**: Missing or invalid JWT token  
**Solutions**:

1. Login first to get a token
2. Include token in Authorization header: `Authorization: Bearer <token>`
3. Check token hasn't expired (7-day expiry)

### Issue: "Insufficient permissions" (403)

**Cause**: Wrong role accessing endpoint  
**Solutions**:

1. Verify you're logged in with correct role (patient/doctor/pharmacist)
2. Check the endpoint requires your role
3. Use role-specific endpoints

### Issue: "Profile not found" (404)

**Cause**: User exists but role profile doesn't  
**Solutions**:

1. Ensure role-specific profile is created (Patient/Doctor/Pharmacist document)
2. Check user_id field matches user's \_id
3. Create profile if missing using registration flow

## Database Seeding (Optional)

If you need test data:

### 1. Create Sample Users

```javascript
// In MongoDB shell or Compass
db.users.insertMany([
  {
    email: "patient@test.com",
    username: "John Doe",
    role: "patient",
    password: "<hashed-password>",
    created_at: new Date(),
  },
  {
    email: "doctor@test.com",
    username: "Dr. Smith",
    role: "doctor",
    password: "<hashed-password>",
    created_at: new Date(),
  },
]);
```

### 2. Create Role Profiles

```javascript
// Create patient profile
db.patients.insertOne({
  user_id: ObjectId("user_id_from_above"),
  date_of_birth: new Date("1990-01-01"),
  contact_info: { phone: "555-0123" },
  allergies: "None",
});

// Create doctor profile
db.doctors.insertOne({
  user_id: ObjectId("doctor_user_id"),
  license_number: "MD12345",
  specialization: "General Medicine",
  contact_info: { phone: "555-0124" },
  verification_status: "verified",
});
```

### 3. Create Sample Prescriptions

```javascript
db.prescriptions.insertOne({
  patient_id: ObjectId("patient_profile_id"),
  doctor_id: ObjectId("doctor_profile_id"),
  drug_id: ObjectId("drug_id"),
  quantity_prescribed: 30,
  dosage_instructions: "Take one tablet daily",
  frequency: "Once daily",
  duration: "30 days",
  status: "pending",
  date_issued: new Date(),
  created_at: new Date(),
});
```

## Monitoring & Debugging

### Enable Detailed Logging

Check terminal for:

- ✅ Database connection success
- ✅ Authentication successes
- ❌ Error messages with stack traces

### Use MongoDB Compass

Connect to your database and verify:

- Collections are created
- Data is being inserted
- Relationships are correct (user_id fields match)

### Browser DevTools

1. Open Network tab
2. Make API calls from the app
3. Check:
   - Request headers (Authorization token present?)
   - Response status codes
   - Response data structure

### Server Logs

Watch for:

```
Error fetching [type] [data]: [error message]
```

This helps identify specific issues with queries or data.

## Next Steps After Successful Testing

1. ✅ Verify all 8 endpoints work
2. ✅ Test with multiple users
3. ✅ Test role-based access control
4. ✅ Verify data population (related records)
5. ✅ Test error cases (invalid tokens, missing profiles)

Once working locally:

1. Set up environment variables in Vercel/production
2. Update MongoDB URI to production database
3. Generate secure JWT_SECRET for production
4. Test deployment
5. Monitor production logs

## Security Checklist

Before production:

- [ ] JWT_SECRET is strong (min 32 chars, random)
- [ ] MongoDB connection uses authentication
- [ ] MongoDB user has minimal required permissions
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is configured (future enhancement)
- [ ] Error messages don't leak sensitive info

## Common Workflow

1. User logs in → Gets JWT token
2. Token stored in localStorage/cookies by frontend
3. Frontend includes token in all API requests
4. Middleware authenticates token
5. API fetches user's role profile
6. Query database for user-specific data
7. Return formatted data to frontend

---

## Support

If you encounter issues not covered here:

1. Check `BACKEND_INTEGRATION_SUMMARY.md` for detailed implementation info
2. Review console logs for specific error messages
3. Verify MongoDB and JWT setup
4. Check that role profiles exist for test users

**Happy coding! 🚀**
