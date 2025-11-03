# Authentication Flow Verification

## Data Flow Overview

### Registration Flow

1. **Frontend (Register Page)** → Collects user data

   - firstName, lastName, email, password, phone, role
   - Role-specific fields (licenseNumber, specialty, etc.)

2. **Auth Context** → Transforms to API format

   - Maps firstName + lastName → username
   - Creates FormData with proper field names
   - Sends to `/api/auth/register`

3. **Register API** → Receives FormData

   - Parses form data
   - Maps frontend fields to database fields:
     - `username` (from "firstName lastName")
     - `email`
     - `password`
     - `role`
     - `address`
     - Role-specific: `license_number`, `specialization`, `pharmacy_name`, etc.

4. **UserService.registerUser()** → Stores in MongoDB

   - Creates User document with: `email`, `username`, `password_hash`, `role`, `address`
   - Creates role-specific document (Doctor/Pharmacist/Patient/Admin)
   - Sets `verification_status` to "verified" (auto-verified)

5. **Response** → Success message
   - User redirected to login page

### Login Flow

1. **Frontend (Login Page)** → Collects credentials

   - email, password, role

2. **Auth Context** → Sends to API

   - POST to `/api/auth/login`
   - Body: `{ email, password, role, rememberMe }`

3. **Login API** → Authenticates user

   - Calls `UserService.loginUser()`
   - Receives database user object with roleData
   - **Maps database fields to frontend fields:**
     - `_id` → `id`
     - `username` → split into `firstName` and `lastName`
     - `created_at` → `createdAt`
     - `updated_at` → `updatedAt`
     - `roleData.license_number` → `licenseNumber`
     - `roleData.specialization` → `specialty`
     - `roleData.contact_info.phone` → `phone`
     - etc.

4. **Response** → Returns mapped user + token

   ```json
   {
     "success": true,
     "user": {
       "id": "...",
       "email": "...",
       "firstName": "...",
       "lastName": "...",
       "role": "...",
       "licenseNumber": "...",
       "specialty": "...",
       "phone": "...",
       ...
     },
     "token": "...",
     "message": "Login successful"
   }
   ```

5. **Auth Context** → Stores in localStorage

   - `auth_token`: JWT token
   - `user_data`: Mapped user object (JSON string)
   - Updates Redux/Context state

6. **Dashboard** → Accesses user data
   - Uses `useAuth()` hook
   - Accesses: `user.firstName`, `user.lastName`, `user.role`, etc.

### Session Restoration

1. **Page Load** → Auth context checks localStorage
2. **If token + user_data exist:**
   - Parse user_data JSON
   - Dispatch AUTH_SUCCESS
   - User stays logged in
3. **If missing or invalid:**
   - User stays logged out
   - Redirected to login if accessing protected route

## Field Mappings

### Database → Frontend (Login API)

| Database Field                          | Frontend Field           | Notes                     |
| --------------------------------------- | ------------------------ | ------------------------- |
| `_id`                                   | `id`                     | MongoDB ObjectId → string |
| `username`                              | `firstName` + `lastName` | Split on first space      |
| `created_at`                            | `createdAt`              | ISO date string           |
| `updated_at`                            | `updatedAt`              | ISO date string           |
| `roleData.license_number`               | `licenseNumber`          | Doctor/Pharmacist         |
| `roleData.specialization`               | `specialty`              | Doctor                    |
| `roleData.pharmacy_name`                | `pharmacyName`           | Pharmacist                |
| `roleData.date_of_birth`                | `dateOfBirth`            | Patient                   |
| `roleData.contact_info.phone`           | `phone`                  | All roles                 |
| `roleData.contact_info.insuranceNumber` | `insuranceNumber`        | Patient                   |
| `roleData.emergency_contact`            | `emergencyContact`       | Patient (formatted)       |

### Frontend → Database (Register API)

| Frontend Field           | Database Field       | Notes             |
| ------------------------ | -------------------- | ----------------- |
| `firstName` + `lastName` | `username`           | Concatenated      |
| `email`                  | `email`              | Lowercase         |
| `password`               | `password_hash`      | Bcrypt hashed     |
| `role`                   | `role`               | Direct mapping    |
| `licenseNumber`          | `license_number`     | Doctor/Pharmacist |
| `specialty`              | `specialization`     | Doctor            |
| `pharmacyName`           | `pharmacy_name`      | Pharmacist        |
| `dateOfBirth`            | `date_of_birth`      | Patient           |
| `phone`                  | `contact_info.phone` | JSON field        |

## Protected Routes

All routes under `/dashboard/*` and role-specific pages require authentication:

- Check: `if (!user || user.role !== expectedRole) redirect to "/"`
- Auth check runs in `useEffect` with `[user, router]` dependencies

## Testing Checklist

### Registration

- [ ] Register as Patient
- [ ] Register as Doctor (with license number, specialty)
- [ ] Register as Pharmacist (with license number, pharmacy name)
- [ ] Verify success message appears
- [ ] Verify redirect to login page
- [ ] Check MongoDB for created User + Role documents
- [ ] Verify `verification_status` is "verified"

### Login

- [ ] Login with registered credentials
- [ ] Verify role selection matches registered role
- [ ] Check console for "Login successful" log
- [ ] Verify redirect to appropriate dashboard
- [ ] Verify `user.firstName` and `user.lastName` display correctly
- [ ] Verify role-specific fields (licenseNumber, specialty, etc.) are accessible
- [ ] Check localStorage for `auth_token` and `user_data`

### Session Persistence

- [ ] Refresh page while logged in
- [ ] Verify user stays logged in
- [ ] Verify user data persists
- [ ] Logout and verify localStorage is cleared
- [ ] Verify redirect to login page

### Protected Routes

- [ ] Try accessing `/dashboard/doctor` without login → should redirect
- [ ] Try accessing `/dashboard/patient` as doctor → should redirect
- [ ] Verify each role can only access their own dashboard

## Known Configuration

- **Auto-verification**: Enabled (users can login immediately after registration)
- **Email verification**: Disabled
- **Phone verification**: Disabled
- **Token expiry**: 24 hours
- **Password requirements**: Minimum 8 characters
