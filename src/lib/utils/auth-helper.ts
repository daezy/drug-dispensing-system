import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  role: "patient" | "doctor" | "pharmacist" | "admin";
  firstName?: string;
  lastName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Authenticate request and extract user from JWT token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Try to get from cookie
      token = request.cookies.get("auth_token")?.value;
    }

    if (!token) {
      return {
        success: false,
        error: "No authentication token provided",
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    return {
      success: true,
      user: decoded,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Invalid or expired token",
    };
  }
}

/**
 * Generate JWT token for user
 */
export function generateAuthToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | undefined, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
