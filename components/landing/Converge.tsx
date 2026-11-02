"use client";

import { BrandMark } from "@/components/landing/BrandMark";
import { LogoMark } from "@/components/Logo";
import { IconArrowRight } from "@/components/Icons";

const TILES: [string, string][] = [
  ["Bloomberg", "bloomberg.com"], ["TechCrunch", "techcrunch.com"], ["YouTube", "youtube.com"],
  ["All-In", "allin.com"], ["Substack", "substack.com"], ["X", "x.com"],
];

/** Many sources flow down into Neo, and one briefing comes out. */
export function Converge() {
  const xs = TILES.map((_, i) => 8 + i * 16.8); // percent across
  return (
    <div className="relative w-full max-w-[560px] mx-auto aspect-[560/560]">
      {/* Flow lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 560" fill="none" aria-hidden>
        {xs.map((x, i) => {
          const px = (x / 100) * 560;
          const d = `M${px} 74 C${px} 150 280 130 280 206`;
          return (
            <g key={i}>
              <path d={d} stroke="rgba(244,241,234,0.12)" strokeWidth="1.5" />
              <path d={d} stroke="#ff6a2c" strokeWidth="1.5" strokeLinecap="round" className="flow-dash" style={{ animationDelay: `${i * 260}ms` }} />
            </g>
          );
        })}
        <path d="M280 262 V318" stroke="rgba(244,241,234,0.12)" strokeWidth="1.5" />
        <path d="M280 262 V318" stroke="#ff6a2c" strokeWidth="1.5" strokeLinecap="round" className="flow-dash" />
      </svg>

      {/* Sources */}
      {TILES.map(([name, domain], i) => (
        <div key={name} className="absolute top-[3%] -translate-x-1/2 rise" style={{ left: `${xs[i]}%`, ["--d" as string]: `${300 + i * 80}ms` }}>
          <div className="rounded-[14px] border border-ink/10 bg-card/90 p-1.5 shadow-float" title={name}>
            <BrandMark domain={domain} name={name} size={38} />
          </div>
        </div>
      ))}

      {/* Neo node */}
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-4 rounded-full bg-accent/30 blur-xl animate-ping-slow" />
        <div className="relative rise" style={{ ["--d" as string]: "900ms" }}><LogoMark size={64} /></div>
      </div>

      {/* Briefing */}
      <div className="absolute inset-x-[6%] bottom-0 top-[58%] rise" style={{ ["--d" as string]: "1100ms" }}>
        <div className="glass h-full rounded-panel p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="dateline">Your briefing · 7:00 AM</span>
            <span className="dateline rounded-full bg-raised px-2 py-0.5">1 email</span>
          </div>
          <p className="font-display text-[22px] sm:text-[26px] leading-[1.1] tracking-[-0.01em]">What moved, and what it means for you</p>
          <div className="mt-3 space-y-1.5"><div className="h-1.5 rounded bg-ink/10 w-full" /><div className="h-1.5 rounded bg-ink/10 w-10/12" /></div>
          <p className="mt-3 text-[12px] leading-[18px] text-ink flex gap-2"><IconArrowRight size={14} className="mt-[2px] flex-shrink-0 text-accent" />Ask your portfolio about runway before Friday.</p>
        </div>
      </div>
    </div>
  );
}
