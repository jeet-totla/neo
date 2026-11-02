import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** POST /auth/signout — clears the session cookies and redirects to /login. */
export async function POST(request: NextRequest) {
  const origin   = new URL(request.url).origin;
  // Build the redirect response first so we can write Set-Cookie headers onto it.
  // Using createClient() from server.ts + NextResponse.redirect() doesn't work:
  // cookies() from next/headers queues Set-Cookie on Next.js's implicit response,
  // not on the NextResponse object we return — so the auth cookies never get cleared.
  const response = NextResponse.redirect(`${origin}/login`, { status: 302 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cleared cookies directly onto the redirect response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.signOut();
  return response;
}
