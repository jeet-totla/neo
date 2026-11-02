"use client";

import { PROVIDERS, PROVIDER_ORDER, type ProviderId } from "@/lib/providers";

/** Provider picker, cost note, key link and the key input. Shared by onboarding and settings. */
export function ApiKeyField({ provider, onProvider, value, onValue, id = "api-key" }: {
  provider: ProviderId; onProvider: (p: ProviderId) => void; value: string; onValue: (v: string) => void; id?: string;
}) {
  const info = PROVIDERS[provider];
  return (
    <div>
      <div role="radiogroup" aria-label="AI provider" className="grid grid-cols-3 gap-2 mb-3">
        {PROVIDER_ORDER.map(p => {
          const on = provider === p;
          return (
            <button key={p} type="button" role="radio" aria-checked={on} onClick={() => onProvider(p)}
              className={`rounded-control border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150 ${
                on ? "border-ink bg-card shadow-soft" : "border-ink/10 bg-raised/50 hover:bg-raised"}`}>
              <span className="block text-[13px] font-medium text-ink leading-[18px]">{PROVIDERS[p].label}</span>
              <span className={`block text-[11px] leading-4 mt-0.5 ${PROVIDERS[p].free ? "text-good font-medium" : "text-muted"}`}>
                {PROVIDERS[p].free ? "Free tier" : "Paid"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] leading-[18px] text-body mb-2">
        {info.cost}{" "}
        <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
          Get a {info.label} key at {info.keyHost}
        </a>. Neo uses your key, so usage is billed to you. It is verified, then stored encrypted and never shown again.
      </p>
      <input id={id} type="password" autoComplete="off" value={value} onChange={e => onValue(e.target.value)}
        placeholder={info.placeholder} className="field font-mono !text-[13px]" />
    </div>
  );
}
