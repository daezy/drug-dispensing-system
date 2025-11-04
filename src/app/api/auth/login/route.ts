import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/UserService";
import { LoginCredentials } from "@/types";

// Helper function to map database user to frontend User type
function mapUserData(dbUser: any): any {
  const username = dbUser.username || "";
  const nameParts = username.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const user: any = {
    id: dbUser._id?.toString() || dbUser.id,
    email: dbUser.email,
    firstName,
    lastName,
    role: dbUser.role,
    isVerified: true, // Auto-verified for straightforward onboarding
    createdAt:
      dbUser.created_at || dbUser.createdAt || new Date().toISOString(),
    updatedAt:
      dbUser.updated_at || dbUser.updatedAt || new Date().toISOString(),
  };

  // Add role-specific data from roleData if available
  if (dbUser.roleData) {
    const roleData = dbUser.roleData;

    if (dbUser.role === "doctor") {
      user.licenseNumber = roleData.license_number;
      user.specialty = roleData.specialization;
      user.phone = roleData.contact_info?.phone;
      user.hospitalAffiliation = roleData.contact_info?.hospitalAffiliation;
    } else if (dbUser.role === "pharmacist") {
      user.licenseNumber = roleData.license_number;
      user.pharmacyName = roleData.pharmacy_name;
      user.phone = roleData.contact_info?.phone;
      user.pharmacyAddress = roleData.contact_info?.pharmacyAddress;
    } else if (dbUser.role === "patient") {
      user.phone = roleData.contact_info?.phone;
      user.dateOfBirth = roleData.date_of_birth;
      user.patientId = roleData.medical_record_number; // Patient ID (PT-YYYY-XXXXXX)
      user.insuranceNumber = roleData.contact_info?.insuranceNumber;
      if (roleData.emergency_contact) {
        user.emergencyContact = `${roleData.emergency_contact.name} - ${roleData.emergency_contact.phone}`;
      }
    } else if (dbUser.role === "admin") {
      user.phone = roleData.contact_info?.phone;
      user.employeeId = roleData.contact_info?.employeeId;
      user.department = roleData.contact_info?.department;
      user.accessLevel = roleData.contact_info?.accessLevel;
    }
  }

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, rememberMe } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Prepare login credentials
    const credentials: LoginCredentials = {
      email,
      password,
      role: role || undefined, // Optional role for additional verification
    };

    // Use UserService to authenticate user
    const userService = new UserService();
    const result = await userService.loginUser(credentials);

    if (result.success && result.user) {
      // Map the user data to match frontend expectations
      const mappedUser = mapUserData(result.user);

      return NextResponse.json(
        {
          success: true,
          user: mappedUser,
          token: result.token,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
