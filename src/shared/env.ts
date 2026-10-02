/**
 * Public env used by both client and server.
 * Secrets (DATABASE_URL, API keys, service role) stay in server/lib/env.ts.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },

  /** Lazy — only required when DATABASE_BACKEND=supabase. */
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },

  /** Lazy — only required when DATABASE_BACKEND=supabase. */
  get supabasePublishableKey() {
    return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
};
