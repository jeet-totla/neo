import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAnthropicKey, saveUserApiKey, deleteUserApiKey } from "@/lib/anthropic-key";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Save (or replace) the signed-in user's Anthropic key. It is verified, encrypted and never sent back. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";

  const check = await verifyAnthropicKey(key);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  try {
    await saveUserApiKey(createAdminClient(), user.id, key);
  } catch (e) {
    console.error("[anthropic-key] save failed:", e);
    return NextResponse.json({ error: "Couldn't save the key. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, last4: key.slice(-4) });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  try {
    await deleteUserApiKey(createAdminClient(), user.id);
  } catch (e) {
    console.error("[anthropic-key] delete failed:", e);
    return NextResponse.json({ error: "Couldn't remove the key. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
