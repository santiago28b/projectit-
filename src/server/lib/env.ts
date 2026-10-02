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
  /** Speech-to-text for Walkthrough Transcripts. Without it, Communication isn't assessed. */
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY || null;
  },
  get openaiTranscribeModel() {
    return process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
  },
  /** Optional: raises GitHub's rate limit when the Assessment reads repositories. */
  get githubToken() {
    return process.env.GITHUB_TOKEN || null;
  },
  /** Live Claude for AI Evidence and match reasons; the mock runs when unset. */
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY || null;
  },
  /** Override the Claude model without a code change. */
  get anthropicModel() {
    return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
  },
  /**
   * Walkthrough videos go to S3 when set; otherwise local disk.
   * Pair with AWS_REGION and credentials (env keys or instance role).
   */
  get s3WalkthroughBucket() {
    return process.env.S3_WALKTHROUGH_BUCKET?.trim() || null;
  },
  get awsRegion() {
    return process.env.AWS_REGION?.trim() || "us-east-1";
  },
};
