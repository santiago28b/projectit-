import { type NextRequest, NextResponse } from "next/server";

/**
 * Passthrough middleware. Demo uses a role-switcher cookie, not Supabase Auth.
 */
export async function middleware(_request: NextRequest) {
  void _request;
  return NextResponse.next();
}

// api/uploads is skipped: Proxy buffers request bodies to 10MB by default,
// which would silently cut off Walkthrough video uploads.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
