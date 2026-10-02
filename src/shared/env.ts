/**
 * Public env used by both client and server.
 * Secrets (DATABASE_URL, API keys) stay in server/lib/env.ts.
 */

export const publicEnv = {
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
