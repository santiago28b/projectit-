import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/server/lib/env";

/** Browser anon client for client components. */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
