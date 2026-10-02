import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/lib/currentUser";

/**
 * The role-switcher Company admin, or a 401 response. Controllers take the
 * Company and reviewer from here, never from ids in the request.
 */
export async function requireCompany(): Promise<
  { companyId: string; userId: string } | { error: NextResponse }
> {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "company_admin" || !current.company) {
    return {
      error: NextResponse.json(
        { error: "Switch to a Company account first" },
        { status: 401 },
      ),
    };
  }
  return {
    companyId: current.company.id,
    userId: current.user.id,
  };
}
