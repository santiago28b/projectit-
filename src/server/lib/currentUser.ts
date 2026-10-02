import "server-only";

import { cookies } from "next/headers";

import {
  candidatesDao,
  companiesDao,
  usersDao,
} from "@/server/database/dao";
import type { CurrentUser } from "@/server/models/domain";
import { CURRENT_USER_COOKIE } from "@/shared/constants";
import { homeForRole } from "@/shared/routing";

export { homeForRole };

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

/** The Candidate the role switcher picked, or null for Company users / nobody. */
export async function getCurrentCandidate() {
  return (await getCurrentUser())?.candidate ?? null;
}
