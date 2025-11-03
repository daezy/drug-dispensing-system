// API endpoint for user registration using MongoDB
// Handles file upload, validation, and database storage

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import UserService from "@/lib/services/UserService";
import {
  DoctorRegistrationData,
  PharmacistRegistrationData,
  PatientRegistrationData,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();

    // Extract basic user data
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const address = formData.get("address") as string;
    const role = formData.get("role") as "doctor" | "pharmacist" | "patient";

    // Validate required fields
    if (!email || !password || !username || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Handle passport photo upload
    let passportPhotoUrl: string | undefined;
    const passportPhoto = formData.get("passport_photo") as File;

    if (passportPhoto && passportPhoto.size > 0) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(
          process.cwd(),
          "public",
          "uploads",
          "passports"
        );
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = passportPhoto.name.split(".").pop();
        const filename = `${username}_${timestamp}.${fileExtension}`;
        const filepath = join(uploadsDir, filename);

        // Save file
        const bytes = await passportPhoto.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        passportPhotoUrl = `/uploads/passports/${filename}`;
      } catch (error) {
        console.error("File upload error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to upload passport photo",
          },
          { status: 500 }
        );
      }
    }

    // Parse contact information
    const contactInfoStr = formData.get("contact_info") as string;
    let contactInfo: any = {};
    if (contactInfoStr) {
      try {
        contactInfo = JSON.parse(contactInfoStr);
      } catch (error) {
        console.error("Contact info parsing error:", error);
      }
    }

    // Role-specific data extraction
    let licenseNumber = "";
    let specialization = "";
    let pharmacyName = "";
    let dateOfBirth = "";
    let allergies = "";
    let medicalHistory = "";
    let emergencyContact: any = {};

    if (role === "doctor" || role === "pharmacist") {
      licenseNumber = (formData.get("license_number") as string) || "";
      if (!licenseNumber) {
        return NextResponse.json(
          {
            success: false,
            message: `License number is required for ${role}s`,
          },
          { status: 400 }
        );
      }
    }

    if (role === "doctor") {
      specialization = (formData.get("specialization") as string) || "";
    }

    if (role === "pharmacist") {
      pharmacyName = (formData.get("pharmacy_name") as string) || "";
    }

    if (role === "patient") {
      dateOfBirth = (formData.get("date_of_birth") as string) || "";
      allergies = (formData.get("allergies") as string) || "";
      medicalHistory = (formData.get("medical_history") as string) || "";

      const emergencyContactStr = formData.get("emergency_contact") as string;
      if (emergencyContactStr) {
        try {
          emergencyContact = JSON.parse(emergencyContactStr);
        } catch (error) {
          console.error("Emergency contact parsing error:", error);
        }
      }
    }

    // Prepare registration data based on role
    let registrationData: any;

    if (role === "doctor") {
      registrationData = {
        email,
        password,
        username,
        address,
        passport_photo: passportPhotoUrl,
        role: "doctor",
        license_number: licenseNumber,
        specialization: specialization || undefined,
        contact_info: contactInfo,
      } as DoctorRegistrationData;
    } else if (role === "pharmacist") {
      registrationData = {
        email,
        password,
        username,
        address,
        passport_photo: passportPhotoUrl,
        role: "pharmacist",
        license_number: licenseNumber,
        pharmacy_name: pharmacyName || undefined,
        contact_info: contactInfo,
      } as PharmacistRegistrationData;
    } else if (role === "patient") {
      registrationData = {
        email,
        password,
        username,
        address,
        passport_photo: passportPhotoUrl,
        role: "patient",
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        contact_info: contactInfo,
        emergency_contact: emergencyContact,
        allergies: allergies || undefined,
        medical_history: medicalHistory || undefined,
      } as PatientRegistrationData;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role specified",
        },
        { status: 400 }
      );
    }

    // Register user using UserService
    const userService = new UserService();
    const result = await userService.registerUser(registrationData);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
