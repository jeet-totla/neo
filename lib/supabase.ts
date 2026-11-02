// Browser Supabase client — safe to import in "use client" components.
// For Server Components / Route Handlers, import from "@/lib/supabase/server"
// directly (it uses next/headers and cannot be bundled for the browser).

export { createClient as createBrowserClient } from "./supabase/client";
