import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthUser } from "./auth-helper";

/**
 * Response type for authenticated API handlers
 */
export type AuthenticatedHandler<T = any> = (
  request: NextRequest,
  user: AuthUser
) => Promise<NextResponse<T>>;

/**
 * Middleware wrapper that authenticates requests before passing to handler
 *
 * Usage:
 * export const GET = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ data: user });
 * });
 */
export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>,
  options?: {
    requiredRoles?: string[];
  }
): (request: NextRequest) => Promise<NextResponse<T>> {
  return async (request: NextRequest) => {
    try {
      // Authenticate the request
      const authResult = await authenticateRequest(request);

      if (!authResult.success || !authResult.user) {
        return NextResponse.json(
          {
            success: false,
            error: authResult.error || "Authentication required",
          },
          { status: 401 }
        ) as NextResponse<T>;
      }

      // Check role requirements if specified
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.includes(
          authResult.user.role
        );

        if (!hasRequiredRole) {
          return NextResponse.json(
            {
              success: false,
              error: "Insufficient permissions",
            },
            { status: 403 }
          ) as NextResponse<T>;
        }
      }

      // Call the handler with the authenticated user
      return await handler(request, authResult.user);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
        },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

/**
 * Role-specific middleware wrappers for convenience
 */
export const withPatientAuth = <T = any>(handler: AuthenticatedHandler<T>) =>
  withAuth(handler, { requiredRoles: ["patient"] });

export const withDoctorAuth = <T = any>(handler: AuthenticatedHandler<T>) =>
  withAuth(handler, { requiredRoles: ["doctor"] });

export const withPharmacistAuth = <T = any>(handler: AuthenticatedHandler<T>) =>
  withAuth(handler, { requiredRoles: ["pharmacist"] });

export const withAdminAuth = <T = any>(handler: AuthenticatedHandler<T>) =>
  withAuth(handler, { requiredRoles: ["admin"] });

/**
 * Middleware that allows multiple roles
 */
export const withAnyRole = <T = any>(
  handler: AuthenticatedHandler<T>,
  roles: string[]
) => withAuth(handler, { requiredRoles: roles });
