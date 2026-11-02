export type ProviderId = "anthropic" | "openai" | "gemini";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  keyUrl: string;
  keyHost: string;
  placeholder: string;
  /** Plain-language note on cost, shown next to the provider. */
  cost: string;
  free: boolean;
  model: string;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  gemini: {
    id: "gemini", label: "Google Gemini", keyUrl: "https://aistudio.google.com/apikey", keyHost: "aistudio.google.com",
    placeholder: "AIza...", cost: "Free tier available. No card needed, with daily limits that cover a briefing or two a day.",
    free: true, model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
  openai: {
    id: "openai", label: "OpenAI", keyUrl: "https://platform.openai.com/api-keys", keyHost: "platform.openai.com",
    placeholder: "sk-...", cost: "Paid. Prepaid credit is required, and a briefing costs a few cents.",
    free: false, model: process.env.OPENAI_MODEL || "gpt-5-mini",
  },
  anthropic: {
    id: "anthropic", label: "Anthropic", keyUrl: "https://console.anthropic.com/settings/keys", keyHost: "console.anthropic.com",
    placeholder: "sk-ant-...", cost: "Paid. Add credit in the console, and a briefing costs a few cents.",
    free: false, model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["gemini", "openai", "anthropic"];

export function isProvider(v: unknown): v is ProviderId {
  return v === "anthropic" || v === "openai" || v === "gemini";
}

/** Guess the provider from the shape of a key, so people can just paste it. */
export function detectProvider(key: string): ProviderId | null {
  if (/^sk-ant-/.test(key)) return "anthropic";
  if (/^AIza/.test(key)) return "gemini";
  if (/^sk-/.test(key)) return "openai";
  return null;
}

type Verdict = { ok: true } | { ok: false; error: string };

/** Checks a key by listing models, which costs nothing. */
export async function verifyKey(provider: ProviderId, key: string): Promise<Verdict> {
  const info = PROVIDERS[provider];
  const shape: Record<ProviderId, RegExp> = {
    anthropic: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    openai: /^sk-[A-Za-z0-9_-]{20,}$/,
    gemini: /^AIza[A-Za-z0-9_-]{30,}$/,
  };
  if (!shape[provider].test(key)) {
    return { ok: false, error: `That doesn't look like a ${info.label} key. It should start with ${info.placeholder.replace("...", "")}.` };
  }
  const req: Record<ProviderId, [string, Record<string, string>]> = {
    anthropic: ["https://api.anthropic.com/v1/models?limit=1", { "x-api-key": key, "anthropic-version": "2023-06-01" }],
    openai: ["https://api.openai.com/v1/models", { Authorization: `Bearer ${key}` }],
    gemini: ["https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { "x-goog-api-key": key }],
  };
  try {
    const [url, headers] = req[provider];
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (res.ok) return { ok: true };
    if ([400, 401, 403].includes(res.status)) return { ok: false, error: `${info.label} rejected that key. Check it and try again.` };
    return { ok: false, error: `Couldn't verify the key with ${info.label} right now. Try again in a moment.` };
  } catch {
    return { ok: false, error: `Couldn't reach ${info.label} to verify the key. Try again in a moment.` };
  }
}

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

/** One text completion from whichever provider the user chose. */
export async function complete(opts: {
  provider: ProviderId; apiKey: string; system: string; user: string; timeoutMs?: number;
}): Promise<string> {
  const { provider, apiKey, system, user } = opts;
  const timeout = opts.timeoutMs ?? 42_000;
  const model = PROVIDERS[provider].model;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 2400, temperature: 0.7, system, messages: [{ role: "user", content: user }] }),
      signal: AbortSignal.timeout(timeout),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ProviderError(json?.error?.message ?? `Anthropic error ${res.status}`, res.status);
    return (json?.content ?? []).map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("");
  }

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, reasoning_effort: "low", max_completion_tokens: 5000,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(timeout),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ProviderError(json?.error?.message ?? `OpenAI error ${res.status}`, res.status);
    return json?.choices?.[0]?.message?.content ?? "";
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3500, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(timeout),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ProviderError(json?.error?.message ?? `Gemini error ${res.status}`, res.status);
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? "").join("");
}
