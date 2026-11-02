"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight } from "@/components/Icons";

const FEED = [
  { src: "Axios", kind: "Article", age: "3h", hot: true,  title: "A payments company cuts fees for early-stage startups" },
  { src: "Hacker News", kind: "Thread", age: "5h", title: "Open-source model closes the gap on coding benchmarks" },
  { src: "All-In", kind: "Podcast", age: "8h", title: "Why flat rounds are the new normal at Series B" },
  { src: "Not Boring", kind: "Newsletter", age: "9h", title: "The quiet consolidation of vertical software" },
  { src: "Bloomberg", kind: "Video", age: "11h", title: "Markets open mixed as rate expectations shift" },
];

const LENSES = [
  {
    who: "Seed investor, New York",
    text: "Fee cuts squeeze every fintech that sells payments to startups. Check which portfolio companies earn from the spread, and how much of their revenue depends on it.",
    act: "Ask each fintech company what share of revenue is payments spread.",
  },
  {
    who: "B2B founder, Lagos",
    text: "Cheaper rails help you, and your customers will notice the same news. Revisit your pricing before they ask, and see whether a local provider will match the offer.",
    act: "Email your payments provider today and ask for the new rate.",
  },
  {
    who: "Finance student",
    text: "A fee cut is a pricing move in a market with thin margins. The bigger players can afford to cut first, and that is the part worth understanding for interviews.",
    act: "Read how interchange works, then write down who pays for it.",
  },
  {
    who: "Policy analyst",
    text: "Lower fees will draw attention to who bears the cost, merchants or consumers. Expect consumer-finance regulators to comment in the coming weeks.",
    act: "Watch for statements from the CFPB and the FCA.",
  },
];

export function LensDemo() {
  const [i, setI] = useState(0);
  const [chars, setChars] = useState(0);
  const touched = useRef(false);
  const lens = LENSES[i];
  const full = lens.text.length;

  // Type the text in whenever the lens changes
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setChars(full); return; }
    setChars(0);
    const id = setInterval(() => setChars(c => (c >= full ? (clearInterval(id), c) : c + 2)), 16);
    return () => clearInterval(id);
  }, [i, full]);

  // Rotate on its own until the visitor picks one
  useEffect(() => {
    const id = setInterval(() => { if (!touched.current) setI(v => (v + 1) % LENSES.length); }, 8000);
    return () => clearInterval(id);
  }, []);

  const done = chars >= full;

  return (
    <div className="glass rounded-panel p-3 sm:p-4 shadow-float">
      <div className="flex items-center gap-1.5 px-2 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" /><span className="h-2.5 w-2.5 rounded-full bg-ink/15" /><span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="dateline ml-3">Sample, written for illustration</span>
      </div>

      <div className="grid lg:grid-cols-[5fr_auto_7fr] gap-3 lg:gap-0 items-stretch">
        {/* Inputs */}
        <div className="rounded-card bg-page/70 border border-ink/[0.06] p-4 sm:p-5">
          <p className="dateline mb-3">What you follow · last 24h</p>
          <ul className="space-y-1.5">
            {FEED.map((f, k) => (
              <li key={f.title} className={`rise rounded-control px-3 py-2.5 border transition-colors ${f.hot ? "bg-card border-accent/30 shadow-soft" : "border-transparent"}`}
                style={{ ["--d" as string]: `${300 + k * 90}ms` }}>
                <div className="dateline flex items-center gap-2">
                  <span className={f.hot ? "text-accent" : ""}>{f.src}</span><span>·</span><span>{f.kind}</span><span>·</span><span>{f.age}</span>
                </div>
                <p className={`mt-1 text-[13px] leading-[18px] ${f.hot ? "text-ink font-medium" : "text-body"}`}>{f.title}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Connector */}
        <div aria-hidden className="relative flex lg:flex-col items-center justify-center px-2 py-1 lg:py-0">
          <span className="hidden lg:block w-px flex-1 bg-gradient-to-b from-transparent via-ink/15 to-transparent" />
          <span className="relative my-2 grid place-items-center h-10 w-10 rounded-full bg-ink text-card">
            <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping-slow" />
            <IconArrowRight size={16} className="relative rotate-90 lg:rotate-0" />
          </span>
          <span className="hidden lg:block w-px flex-1 bg-gradient-to-b from-transparent via-ink/15 to-transparent" />
        </div>

        {/* Output */}
        <div className="rounded-card bg-card border border-ink/[0.08] shadow-soft p-5 sm:p-6 flex flex-col">
          <p className="dateline mb-3">Your Neo briefing, written for</p>
          <div role="tablist" aria-label="Choose who the briefing is written for" className="flex flex-wrap gap-1.5 mb-5">
            {LENSES.map((l, k) => (
              <button key={l.who} role="tab" aria-selected={k === i} type="button"
                onClick={() => { touched.current = true; setI(k); }}
                className={`rounded-full px-3 py-1.5 text-[12px] leading-4 border transition-[background-color,color,border-color] duration-200 ease-neo ${
                  k === i ? "bg-ink text-card border-ink" : "bg-transparent text-body border-ink/10 hover:border-ink/30 hover:text-ink"}`}>
                {l.who}
              </button>
            ))}
          </div>
          <div className="dateline mb-2">Axios · 3h ago</div>
          <h3 className="font-display text-[26px] leading-[30px] tracking-[-0.01em] mb-3">A payments company cuts fees for startups</h3>
          <p className="text-[15px] leading-[24px] text-body min-h-[120px] sm:min-h-[96px]" aria-live="polite">
            {lens.text.slice(0, chars)}
            {!done && <span className="inline-block w-[2px] h-[1em] translate-y-[2px] bg-accent ml-0.5 animate-caret" />}
          </p>
          <p className={`mt-3 text-[13px] leading-[20px] text-ink flex gap-2 transition-opacity duration-300 ${done ? "opacity-100" : "opacity-0"}`}>
            <IconArrowRight size={16} className="mt-[2px] flex-shrink-0 text-accent" />{lens.act}
          </p>
        </div>
      </div>
    </div>
  );
}
