import { type NextRequest } from "next/server";

import { updateSession } from "@/shared/supabase/middleware";

/**
 * Refreshes the Supabase auth session cookie on each request.
 * Role-switcher demo does not require login yet; this keeps Auth ready.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
