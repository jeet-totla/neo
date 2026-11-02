import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "@/lib/crypto";
import { isProvider, type ProviderId } from "@/lib/providers";

// Column names keep their original "anthropic_" prefix so existing databases keep working.
// The new `provider` column says which service the key belongs to.

export async function saveUserApiKey(admin: SupabaseClient, userId: string, provider: ProviderId, key: string) {
  const { error } = await admin.from("user_secrets").upsert({
    user_id: userId,
    provider,
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

export async function getUserApiKey(admin: SupabaseClient, userId: string): Promise<{ provider: ProviderId; key: string } | null> {
  const { data } = await admin.from("user_secrets").select("*").eq("user_id", userId).maybeSingle();
  if (!data?.anthropic_key_enc) return null;
  try {
    return { provider: isProvider(data.provider) ? data.provider : "anthropic", key: decrypt(data.anthropic_key_enc) };
  } catch { return null; }
}

/** What the browser is allowed to know: which provider, and the last four characters. */
export async function getKeyStatus(admin: SupabaseClient, userId: string): Promise<{ provider: ProviderId; last4: string } | null> {
  const { data } = await admin.from("user_secrets").select("*").eq("user_id", userId).maybeSingle();
  if (!data?.anthropic_key_last4) return null;
  return { provider: isProvider(data.provider) ? data.provider : "anthropic", last4: data.anthropic_key_last4 };
}
