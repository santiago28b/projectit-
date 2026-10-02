import { type NextRequest, NextResponse } from "next/server";

import { CURRENT_USER_COOKIE } from "@/shared/constants";

/**
 * Next 16 Proxy (replaces deprecated middleware.ts).
 * Landing `/` always starts as Guest: strip the demo identity cookie
 * for this request and clear it in the browser.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const cookieHeader = requestHeaders.get("cookie");
  if (cookieHeader) {
    const cleaned = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith(`${CURRENT_USER_COOKIE}=`))
      .join("; ");
    if (cleaned) requestHeaders.set("cookie", cleaned);
    else requestHeaders.delete("cookie");
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(CURRENT_USER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

// api/uploads is skipped: Proxy buffers request bodies to 10MB by default,
// which would silently cut off Walkthrough video uploads.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
