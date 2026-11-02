import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type ProviderId, verifyKey, detectProvider, isProvider, PROVIDERS } from "@/lib/providers";
import { saveUserApiKey, deleteUserApiKey } from "@/lib/user-key";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Save (or replace) the signed-in user's AI key. It is verified, encrypted and never sent back. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const provider = isProvider(body.provider) ? body.provider : detectProvider(key);
  if (!provider) return NextResponse.json({ error: "Pick a provider and paste its key." }, { status: 400 });

  const check = await verifyKey(provider, key);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  try {
    await saveUserApiKey(createAdminClient(), user.id, provider, key);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api-key] save failed:", msg);
    let error = "Couldn't save the key. Please try again.";
    if (/ENCRYPTION_KEY/.test(msg)) error = "Server setup is incomplete: ENCRYPTION_KEY is missing on the host.";
    else if (/SUPABASE_SERVICE_ROLE_KEY|supabaseKey|Invalid API key/i.test(msg)) error = "Server setup is incomplete: SUPABASE_SERVICE_ROLE_KEY is missing or wrong on the host.";
    else if (/provider/.test(msg) && /column/.test(msg)) error = "Database needs one update: run the latest supabase/schema.sql in the Supabase SQL editor.";
    else if (/user_secrets/.test(msg)) error = "Database needs setup: run supabase/schema.sql in the Supabase SQL editor.";
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, provider, label: PROVIDERS[provider as ProviderId].label, last4: key.slice(-4) });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  try {
    await deleteUserApiKey(createAdminClient(), user.id);
  } catch (e) {
    console.error("[api-key] delete failed:", e);
    return NextResponse.json({ error: "Couldn't remove the key. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
