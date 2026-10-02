import { NextResponse } from "next/server";

/** Map thrown service errors to JSON API responses. */
export function jsonError(err: unknown, fallbackStatus = 500) {
  const message = err instanceof Error ? err.message : "Unexpected error";
  const status =
    message.includes("not implemented") || message.includes("not found")
      ? message.includes("not found")
        ? 404
        : 501
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export function requireQueryParam(
  url: URL,
  name: string,
): string | NextResponse {
  const value = url.searchParams.get(name);
  if (!value) {
    return NextResponse.json(
      { error: `Missing required query param: ${name}` },
      { status: 400 },
    );
  }
  return value;
}
