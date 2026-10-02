import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/shared/env";

/** Browser client for Client Components. */
export function createClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
  );
}
