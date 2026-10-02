import type { UserRole } from "@/shared/models/domain";

/** Portal a role lands on after switching. */
export function homeForRole(role: UserRole): string {
  if (role === "candidate") return "/candidate";
  if (role === "company_admin") return "/company";
  return "/admin";
}
