import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  IconArrowRight, IconNewspaper, IconUser, IconMail, IconMic, IconVideo, IconRadio, IconExternal,
} from "@/components/Icons";

// ── Content ───────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "jeettotla@gmail.com";
const GMAIL_COMPOSE =
  "https://mail.google.com/mail/?view=cm&fs=1" +
  `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
  `&su=${encodeURIComponent("Market intelligence system for our company")}` +
  `&body=${encodeURIComponent("Hi Jeet,\n\nWe'd like a market intelligence system for our team.\n\nCompany:\nWhat we want to track:\nWho should receive it:\n\n")}`;

const STEPS = [
  {
    icon: IconNewspaper,
    title: "Choose what you follow",
    body: "Pick your topics, then the publications, newsletters, podcasts and channels you already read. Setup takes about two minutes, plus your own Anthropic key.",
  },
  {
    icon: IconUser,
    title: "Say who you are",
    body: "Your role, your market and what you're trying to do. Neo uses this as a lens on every story it reads for you.",
  },
  {
    icon: IconMail,
    title: "Read it every morning",
    body: "One briefing in your inbox and on your dashboard, built from the last 24 hours and never repeating yesterday.",
  },
];

const PUBLICATIONS = [
  "TechCrunch", "The Verge", "Wired", "Axios", "Semafor", "MIT Technology Review",
  "The Atlantic", "Foreign Policy", "Rest of World", "The Economist", "TechCabal", "Product Hunt",
];
const PODCASTS = ["All-In", "Acquired", "20VC", "My First Million", "Invest Like the Best", "Bankless"];

const DEPTHS = [
  { name: "Scan",  stat: "8 stories",  body: "Two sentences each. Read it over coffee." },
  { name: "Read",  stat: "12 stories", body: "Context and implications for each story." },
  { name: "Deep",  stat: "5 stories",  body: "A full analysis of each: second-order effects and what to do." },
];
const VOICES = [
  { name: "Analyst",    body: "Straight to implications, with a point of view." },
  { name: "Journalist", body: "Clear context, balanced and easy to follow." },
  { name: "Advisor",    body: "Fewer stories, only what affects your role." },
];

const FAQ = [
  {
    q: "Where does Neo get its stories?",
    a: "From sources you choose, plus open news search. That includes publications and Substack newsletters, podcasts, YouTube channels, Reddit and Hacker News. Every story in your briefing names its source and how long ago it was published.",
  },
  {
    q: "How is this different from a newsletter?",
    a: "A newsletter is written once for everyone. Neo writes yours: it takes stories from all of your sources, drops what doesn't matter to you, and explains why the rest does, using what you told it about yourself.",
  },
  {
    q: "When does the briefing arrive?",
    a: "Every morning by email, and you can generate one on your dashboard whenever you like, up to five a day.",
  },
  {
    q: "Is it free? Do I need an API key?",
    a: "Neo itself is free. You bring your own Anthropic API key, so you pay Anthropic directly for the writing, usually a few cents per briefing. Your key is verified, stored encrypted and used only to write your briefings.",
  },
  {
    q: "What happens to what I tell Neo about myself?",
    a: "It's stored in your account and used only to write your briefings. You can change or delete it from settings. See the privacy page for details.",
  },
];

// ── Hero preview ──────────────────────────────────────────────────────────────

function SourceBackdrop() {
  // Three source cards fanned out behind the briefing: many inputs, one output
  const cards = [
    { name: "Axios",        style: { top: "2%",  left: "0%",   transform: "rotate(-4deg)" } },
    { name: "Hacker News",  style: { top: "10%", right: "-2%", transform: "rotate(3deg)" } },
    { name: "Substack",     style: { bottom: "2%", left: "4%", transform: "rotate(2deg)" } },
  ];
  return (
    <div aria-hidden className="absolute inset-0">
      {cards.map(c => (
        <div key={c.name} className="absolute w-[220px] rounded-card bg-card border border-ink/[0.08] p-4 shadow-soft" style={c.style}>
          <div className="dateline mb-3">{c.name}</div>
          <div className="h-2 w-full rounded bg-raised mb-2" />
          <div className="h-2 w-4/5 rounded bg-raised mb-2" />
          <div className="h-2 w-3/5 rounded bg-raised" />
        </div>
      ))}
    </div>
  );
}

function BriefingPreview() {
  return (
    <div className="glass relative rounded-panel p-6 sm:p-8 w-full max-w-[460px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span className="dateline">Thursday, October 29</span>
        <span className="dateline rounded-[6px] bg-raised px-2 py-1">Sample</span>
      </div>
      <p className="text-[13px] text-body mb-5">
        Written for: <span className="text-ink">seed-stage investor, New York</span>
      </p>

      <div className="space-y-5">
        <article>
          <div className="dateline mb-2">Axios · 3h ago</div>
          <h3 className="text-[16px] font-medium leading-[22px] mb-1.5">A fintech raises at a flat valuation</h3>
          <p className="text-[14px] leading-[20px] text-body">
            Flat rounds are becoming the norm at Series B. For your portfolio, that means
            bridge terms matter more than headline price.
          </p>
          <p className="text-[13px] leading-[20px] text-ink mt-2 flex gap-2">
            <IconArrowRight size={16} className="mt-[2px] flex-shrink-0 text-accent" />
            Ask your fintech companies how many months of runway they have.
          </p>
        </article>
        <div className="h-px bg-ink/[0.08]" />
        <article>
          <div className="dateline mb-2">Hacker News · 5h ago</div>
          <h3 className="text-[16px] font-medium leading-[22px] mb-1.5">An open-source model closes the gap on coding</h3>
          <p className="text-[14px] leading-[20px] text-body">
            Cheaper models pressure the margins of startups that resell API access.
          </p>
        </article>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-page overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-x-0 border-t-0 rounded-none">
        <nav className="max-w-[1120px] mx-auto h-14 px-5 sm:px-6 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-[14px] text-body">
            <a href="#how" className="hover:text-ink transition-colors duration-150">How it works</a>
            <a href="#sources" className="hover:text-ink transition-colors duration-150">Sources</a>
            <a href="#faq" className="hover:text-ink transition-colors duration-150">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] text-body hover:text-ink transition-colors duration-150">Log in</Link>
            <Link href="/signup" className="btn-primary btn-sm">Get started</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-5 sm:px-6 pt-12 sm:pt-20 lg:pt-24 pb-20 sm:pb-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-8 items-center">
          <div className="max-w-[560px]">
            <p className="rise dateline mb-5" style={{ ["--d" as string]: "0ms" }}>Personal market intelligence</p>
            <h1 className="rise font-display font-normal text-[44px] sm:text-[64px] leading-[1.04] tracking-[-0.03em] text-ink"
              style={{ ["--d" as string]: "60ms" }}>
              One morning briefing from everything you follow
            </h1>
            <p className="rise mt-6 text-[18px] leading-[28px] text-body max-w-[36rem]"
              style={{ ["--d" as string]: "120ms" }}>
              Neo reads your news, newsletters, podcasts and feeds, then writes what happened through your own lens: your role, your market and your goals.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "180ms" }}>
              <Link href="/signup" className="btn-primary">Get started <IconArrowRight /></Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
          </div>

          <div className="rise relative min-h-[420px] sm:min-h-[520px] flex items-center" style={{ ["--d" as string]: "240ms" }}>
            <div className="hidden sm:block"><SourceBackdrop /></div>
            <div className="relative w-full px-0 sm:px-10 py-0 sm:py-12"><BriefingPreview /></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-ink/[0.08] scroll-mt-14">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <h2 className="font-display text-[36px] sm:text-[44px] leading-[1.1] tracking-[-0.02em] max-w-[640px]">
            Everything you read, summarized for what you do
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="surface rounded-card p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="h-9 w-9 rounded-control bg-raised grid place-items-center text-body"><s.icon size={18} /></span>
                  <span className="dateline">0{i + 1}</span>
                </div>
                <h3 className="text-[18px] font-medium leading-[24px] mb-2">{s.title}</h3>
                <p className="text-[14px] leading-[22px] text-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lens */}
      <section className="border-t border-ink/[0.08]">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 items-start">
            <div>
              <h2 className="font-display text-[36px] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">
                The same story, written for you
              </h2>
              <p className="mt-5 text-[16px] leading-[26px] text-body max-w-[28rem]">
                Most news is written for everyone, so it isn&apos;t about anyone. You tell Neo who you are once, and every story is explained in terms of your situation.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { who: "Founder, B2B software", body: "A competitor cuts prices by 30 percent. Expect your next three deals to ask for a discount. Decide now what you will give up and what you won't." },
                { who: "Investor, early stage", body: "A competitor cuts prices by 30 percent. That's a sign of weak retention. Ask the portfolio companies in this space about churn this quarter." },
              ].map(c => (
                <div key={c.who} className="surface rounded-card p-6">
                  <div className="dateline mb-3">For: {c.who}</div>
                  <p className="text-[15px] leading-[24px]">{c.body}</p>
                </div>
              ))}
              <p className="dateline sm:col-span-2">Sample output, written for illustration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sources */}
      <section id="sources" className="border-t border-ink/[0.08] scroll-mt-14">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <h2 className="font-display text-[36px] sm:text-[44px] leading-[1.1] tracking-[-0.02em] max-w-[640px]">
            Reads what you already read
          </h2>
          <p className="mt-5 text-[16px] leading-[26px] text-body max-w-[36rem]">
            Add your own newsletters, channels and communities, or start from the ones below. Each story in your briefing shows where it came from and how fresh it is.
          </p>

          <div className="mt-12 grid lg:grid-cols-3 gap-4">
            <div className="surface rounded-card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 text-body mb-4"><IconNewspaper /> <span className="text-[14px]">Publications and newsletters</span></div>
              <div className="flex flex-wrap gap-2">
                {PUBLICATIONS.map(p => <span key={p} className="font-mono text-[12px] leading-4 rounded-[6px] bg-raised px-2.5 py-1.5 text-body">{p}</span>)}
                <span className="font-mono text-[12px] leading-4 rounded-[6px] border border-ink/10 px-2.5 py-1.5 text-muted">Any Substack</span>
              </div>
            </div>
            <div className="surface rounded-card p-6">
              <div className="flex items-center gap-2 text-body mb-4"><IconMic /> <span className="text-[14px]">Podcasts</span></div>
              <div className="flex flex-wrap gap-2">
                {PODCASTS.map(p => <span key={p} className="font-mono text-[12px] leading-4 rounded-[6px] bg-raised px-2.5 py-1.5 text-body">{p}</span>)}
              </div>
            </div>
            <div className="surface rounded-card p-6">
              <div className="flex items-center gap-2 text-body mb-4"><IconVideo /> <span className="text-[14px]">YouTube</span></div>
              <p className="text-[14px] leading-[22px] text-body">Add any channel and Neo reads its latest uploads.</p>
            </div>
            <div className="surface rounded-card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 text-body mb-4"><IconRadio /> <span className="text-[14px]">Communities and open news</span></div>
              <p className="text-[14px] leading-[22px] text-body">Reddit and Hacker News for what people are discussing, and Google News and GDELT for everything else in your topics.</p>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-4">
            <div className="surface rounded-card p-6">
              <h3 className="text-[18px] font-medium mb-1">How deep</h3>
              <p className="text-[14px] text-body mb-5">Choose it each time you generate.</p>
              <ul className="divide-y divide-ink/[0.08]">
                {DEPTHS.map(d => (
                  <li key={d.name} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="w-14 text-[14px] font-medium">{d.name}</span>
                    <span className="dateline w-20">{d.stat}</span>
                    <span className="text-[14px] leading-[20px] text-body">{d.body}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface rounded-card p-6">
              <h3 className="text-[18px] font-medium mb-1">How it sounds</h3>
              <p className="text-[14px] text-body mb-5">Pick a voice in settings.</p>
              <ul className="divide-y divide-ink/[0.08]">
                {VOICES.map(v => (
                  <li key={v.name} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="w-24 text-[14px] font-medium">{v.name}</span>
                    <span className="text-[14px] leading-[20px] text-body">{v.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-ink/[0.08] scroll-mt-14">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-[5fr_7fr] gap-12">
          <h2 className="font-display text-[36px] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">Questions</h2>
          <div className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {FAQ.map(f => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium">
                  {f.q}
                  <span aria-hidden className="text-muted text-[20px] leading-none transition-transform duration-200 ease-neo group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-[24px] text-body max-w-[40rem]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Company CTA */}
      <section className="border-t border-ink/[0.08]">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <div className="rounded-panel bg-ink text-card p-8 sm:p-12 grid lg:grid-cols-[7fr_5fr] gap-8 items-center">
            <div>
              <h2 className="font-display text-[32px] sm:text-[44px] leading-[1.1] tracking-[-0.02em]">
                Want a market intelligence system for your company?
              </h2>
              <p className="mt-4 text-[16px] leading-[26px] text-card/70 max-w-[34rem]">
                I build custom systems that track your sector, competitors and sources, and send your team a briefing on a schedule. Tell me what you need to keep an eye on.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer"
                className="btn h-12 px-6 bg-card text-ink hover:bg-raised">
                Email me <IconExternal />
              </a>
              <p className="mt-3 text-[13px] text-card/60">
                Opens Gmail, or write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-card">{CONTACT_EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/[0.08]">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted">
          <Logo />
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ink transition-colors duration-150">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors duration-150">Terms</Link>
            <Link href="/login" className="hover:text-ink transition-colors duration-150">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
