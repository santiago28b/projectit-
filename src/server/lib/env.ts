import { publicEnv } from "@/shared/env";

/**
 * Server env. Public Supabase vars live in `@/shared/env`.
 * Service role stays here so it never ships to the browser by habit.
 */
export const env = {
  get appUrl() {
    return publicEnv.appUrl;
  },
  get supabaseUrl() {
    return publicEnv.supabaseUrl;
  },
  get supabasePublishableKey() {
    return publicEnv.supabasePublishableKey;
  },
  get supabaseServiceRoleKey() {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!value) {
      throw new Error(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    return value;
  },
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY ?? null;
  },
};
