import "server-only";

export type DatabaseBackend = "pg" | "supabase";

/**
 * Which DAO implementation to use.
 * Default is `pg` (DATABASE_URL). Set DATABASE_BACKEND=supabase for the
 * service-role JS client.
 */
export function getDatabaseBackend(): DatabaseBackend {
  const value = (process.env.DATABASE_BACKEND ?? "pg").toLowerCase();
  if (value === "supabase") return "supabase";
  return "pg";
}
