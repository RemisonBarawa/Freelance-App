
import { UserRole } from "../types/auth";

/**
 * Validate user role to ensure it's one of the allowed values
 * Default to client if an invalid role is provided
 */
export function validateUserRole(role: string | null | undefined): UserRole {
  const validRoles: UserRole[] = ["client", "freelancer", "admin", "student"];
  
  if (role && validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  
  return "client"; // Default role
}

/**
 * Get the dashboard link based on user role
 */
export function getDashboardLink(role: UserRole): string {
  switch (role) {
    case "freelancer":
      return "/freelancer-dashboard";
    case "admin":
      return "/admin-dashboard";
    case "student":
      return "/student-dashboard";
    case "client":
      return "/client-dashboard";
    default:
      return "/";
  }
}
