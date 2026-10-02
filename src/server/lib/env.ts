import { publicEnv } from "@/shared/env";

/**
 * Server env. DATABASE_URL and secrets stay here so they never ship to the browser.
 */
export const env = {
  get appUrl() {
    return publicEnv.appUrl;
  },
  get databaseUrl() {
    const value = process.env.DATABASE_URL;
    if (!value) {
      throw new Error("Missing required environment variable: DATABASE_URL");
    }
    return value;
  },
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY ?? null;
  },
  /** Live Claude for evaluateSubmission; the mock runs when unset. */
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY || null;
  },
};
