import { type NextRequest, NextResponse } from "next/server";

/**
 * Passthrough middleware. Demo uses a role-switcher cookie, not Supabase Auth.
 */
export async function middleware(_request: NextRequest) {
  void _request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
