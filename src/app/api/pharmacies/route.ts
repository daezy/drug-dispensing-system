import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connection";
import { PharmacyModel } from "@/lib/database/models";
import { withAuth } from "@/lib/utils/api-middleware";

// GET /api/pharmacies - Get all pharmacies or search
export const GET = withAuth(async (request) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const zipCode = searchParams.get("zip_code");
    const active = searchParams.get("active");

    // Build query
    const query: any = {};

    if (city) {
      query.city = new RegExp(city, "i"); // Case-insensitive search
    }

    if (state) {
      query.state = state.toUpperCase();
    }

    if (zipCode) {
      query.zip_code = zipCode;
    }

    if (active !== null) {
      query.is_active = active === "true";
    }

    const pharmacies = await PharmacyModel.find(query).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: pharmacies,
      count: pharmacies.length,
    });
  } catch (error: any) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch pharmacies",
      },
      { status: 500 }
    );
  }
});

// POST /api/pharmacies - Create new pharmacy (Admin only)
export const POST = withAuth(async (request, user) => {
  try {
    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      license_number,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      operating_hours,
    } = body;

    // Validation
    if (
      !name ||
      !license_number ||
      !address ||
      !city ||
      !state ||
      !zip_code ||
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Check if license number already exists
    const existingPharmacy = await PharmacyModel.findOne({ license_number });
    if (existingPharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy with this license number already exists",
        },
        { status: 400 }
      );
    }

    // Create pharmacy
    const pharmacy = await PharmacyModel.create({
      name,
      license_number,
      address,
      city,
      state: state.toUpperCase(),
      zip_code,
      phone,
      email,
      operating_hours,
      is_active: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: pharmacy,
        message: "Pharmacy created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create pharmacy",
      },
      { status: 500 }
    );
  }
});

// PATCH /api/pharmacies - Update pharmacy (Admin only)
export const PATCH = withAuth(async (request, user) => {
  try {
    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get("id");

    if (!pharmacyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy ID required",
        },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Don't allow updating license_number
    delete updates.license_number;

    const pharmacy = await PharmacyModel.findByIdAndUpdate(
      pharmacyId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pharmacy,
      message: "Pharmacy updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update pharmacy",
      },
      { status: 500 }
    );
  }
});

// DELETE /api/pharmacies - Deactivate pharmacy (Admin only)
export const DELETE = withAuth(async (request, user) => {
  try {
    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get("id");

    if (!pharmacyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy ID required",
        },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const pharmacy = await PharmacyModel.findByIdAndUpdate(
      pharmacyId,
      { $set: { is_active: false } },
      { new: true }
    );

    if (!pharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pharmacy deactivated successfully",
    });
  } catch (error: any) {
    console.error("Error deleting pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete pharmacy",
      },
      { status: 500 }
    );
  }
});
