import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — safe to use in Client Components.
 * Reads credentials from NEXT_PUBLIC_* env vars (available to the browser).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
