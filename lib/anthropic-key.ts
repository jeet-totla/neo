import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/lib/crypto";

/** Checks a key against Anthropic without spending anything (the models list is free). */
export async function verifyAnthropicKey(key: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key)) {
    return { ok: false, error: "That doesn't look like an Anthropic key. It should start with sk-ant-." };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, error: "Anthropic rejected that key. Check it and try again." };
    return { ok: false, error: "Couldn't verify the key with Anthropic right now. Try again in a moment." };
  } catch {
    return { ok: false, error: "Couldn't reach Anthropic to verify the key. Try again in a moment." };
  }
}

/** Server only. Pass the service-role client: user_secrets has no public policies. */
export async function saveUserApiKey(admin: SupabaseClient, userId: string, key: string) {
  const { error } = await admin.from("user_secrets").upsert({
    user_id: userId,
    anthropic_key_enc: encrypt(key),
    anthropic_key_last4: key.slice(-4),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function deleteUserApiKey(admin: SupabaseClient, userId: string) {
  const { error } = await admin.from("user_secrets").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function getUserApiKey(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin.from("user_secrets").select("anthropic_key_enc").eq("user_id", userId).maybeSingle();
  if (!data?.anthropic_key_enc) return null;
  try { return decrypt(data.anthropic_key_enc); } catch { return null; }
}

/** What the browser is allowed to know: whether a key exists and its last four characters. */
export async function getKeyStatus(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin.from("user_secrets").select("anthropic_key_last4").eq("user_id", userId).maybeSingle();
  return data?.anthropic_key_last4 ?? null;
}
