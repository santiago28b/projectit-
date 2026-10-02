import "server-only";

import { cookies } from "next/headers";

import {
  candidatesDao,
  companiesDao,
  usersDao,
} from "@/server/database/dao";
import type { CurrentUser, UserRole } from "@/server/models/domain";
import { CURRENT_USER_COOKIE } from "@/shared/constants";

/**
 * Who the role switcher says is looking, or null if nobody is picked yet.
 * Works in Server Components and API routes. Reads go through the configured
 * database backend (pg or Supabase service role), so RLS doesn't block the demo.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = (await cookies()).get(CURRENT_USER_COOKIE)?.value;
  if (!userId) return null;
  return loadCurrentUser(userId);
}

export async function loadCurrentUser(
  userId: string,
): Promise<CurrentUser | null> {
  const user = await usersDao.findById(userId);
  if (!user) return null;

  const [candidate, company] = await Promise.all([
    user.role === "candidate" ? candidatesDao.findByUserId(user.id) : null,
    user.companyId ? companiesDao.findById(user.companyId) : null,
  ]);

  return { user, candidate, company };
}

/** Portal a role lands on after switching. */
export function homeForRole(role: UserRole): string {
  if (role === "candidate") return "/candidate";
  if (role === "company_admin") return "/company";
  return "/admin";
}
