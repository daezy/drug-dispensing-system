import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { DatabaseManager } from "@/lib/database/connection";
import { UserService } from "@/lib/services/UserService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    await DatabaseManager.getInstance().ensureConnection();

    const { walletAddress, role } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!role || !["doctor", "patient", "pharmacist", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    // Check if user with this wallet address exists
    let user = await UserService.findUserByWallet(walletAddress);

    if (!user) {
      // Auto-register new user with wallet address
      const username = `user_${walletAddress.slice(0, 8)}`;
      const email = `${walletAddress.toLowerCase()}@wallet.local`;

      user = await UserService.registerWalletUser({
        walletAddress,
        email,
        username,
        role,
      });

      console.log("New wallet user registered:", walletAddress);
    } else {
      // User exists, verify role matches
      if (user.role !== role) {
        return NextResponse.json(
          { error: `This wallet is registered as ${user.role}, not ${role}` },
          { status: 403 }
        );
      }
      console.log("Existing wallet user logged in:", walletAddress);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        walletAddress,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Map user data for frontend
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || "Wallet",
      lastName: user.lastName || "User",
      role: user.role,
      walletAddress: user.walletAddress,
      isVerified: true,
      // Add role-specific data if available
      ...(user.roleData && {
        licenseNumber: user.roleData.licenseNumber,
        specialization: user.roleData.specialization,
        pharmacyName: user.roleData.pharmacyName,
        hospitalName: user.roleData.hospitalName,
        dateOfBirth: user.roleData.dateOfBirth,
        address: user.roleData.address,
        phoneNumber: user.roleData.phoneNumber,
      }),
    };

    return NextResponse.json({
      success: true,
      message: user.walletAddress
        ? "Login successful"
        : "Account created and logged in",
      token,
      user: userData,
    });
  } catch (error: any) {
    console.error("Wallet login error:", error);
    return NextResponse.json(
      { error: error.message || "Wallet authentication failed" },
      { status: 500 }
    );
  }
}
