import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  IconArrowRight, IconNewspaper, IconUser, IconMail, IconRadio, IconExternal, IconCheck,
} from "@/components/Icons";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";
import { LensDemo } from "@/components/landing/LensDemo";
import { BrandMark } from "@/components/landing/BrandMark";
import { TOPICS, PUBLICATIONS as PUB_CATALOG, PODCASTS as POD_CATALOG } from "@/lib/catalog";
import { PROVIDERS, PROVIDER_ORDER } from "@/lib/providers";

// ── Content ───────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "jeettotla@gmail.com";
const GMAIL_COMPOSE =
  "https://mail.google.com/mail/?view=cm&fs=1" +
  `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
  `&su=${encodeURIComponent("Market intelligence system for our company")}` +
  `&body=${encodeURIComponent("Hi Jeet,\n\nWe'd like a market intelligence system for our team.\n\nCompany:\nWhat we want to track:\nWho should receive it:\n\n")}`;

type Brand = [name: string, domain: string];
const PUBS: Brand[] = [
  ["Bloomberg", "bloomberg.com"], ["Financial Times", "ft.com"], ["TechCrunch", "techcrunch.com"], ["The Verge", "theverge.com"],
  ["Axios", "axios.com"], ["Semafor", "semafor.com"], ["The Economist", "economist.com"], ["Wired", "wired.com"],
  ["Rest of World", "restofworld.org"], ["TechCabal", "techcabal.com"], ["Forbes", "forbes.com"], ["WSJ", "wsj.com"],
];
const SHOWS: Brand[] = [
  ["All-In", "allin.com"], ["Acquired", "acquired.fm"], ["20VC", "thetwentyminutevc.com"], ["My First Million", "mfmpod.com"],
  ["Invest Like the Best", "joincolossus.com"], ["Bankless", "bankless.com"], ["YouTube", "youtube.com"], ["Substack", "substack.com"],
  ["Hacker News", "news.ycombinator.com"], ["Reddit", "reddit.com"], ["Product Hunt", "producthunt.com"], ["X", "x.com"],
];
const X_HANDLES = ["@paulg", "@naval", "@benedictevans", "@packyM", "@sama", "@lennysan"];

const STEPS = [
  { icon: IconNewspaper, title: "Choose what you follow", body: "Topics first, then the publications, newsletters, podcasts and channels you already read. About two minutes." },
  { icon: IconUser,      title: "Say who you are",        body: "Your role, your market, what you're trying to do. Neo reads every story with that in mind." },
  { icon: IconMail,      title: "Read it every morning",  body: "One briefing in your inbox and on your dashboard, built from the last 24 hours and never repeating yesterday." },
];

const DEPTHS = [
  { name: "Scan", n: 8,  note: "Two sentences each" },
  { name: "Read", n: 12, note: "Context and implications" },
  { name: "Deep", n: 5,  note: "Full analysis per story" },
];

const FAQ = [
  { q: "Where does Neo get its stories?", a: "From sources you choose, plus open news search. That includes publications and Substack newsletters, podcasts, YouTube channels, Reddit and Hacker News. Every story in your briefing names its source and how long ago it was published." },
  { q: "How is this different from a newsletter?", a: "A newsletter is written once for everyone. Neo writes yours: it takes stories from all of your sources, drops what doesn't matter to you, and explains why the rest does, using what you told it about yourself." },
  { q: "When does the briefing arrive?", a: "Every morning by email, and you can generate one on your dashboard whenever you like, up to five a day." },
  { q: "Is it free? Do I need an API key?", a: "Neo itself is free. You bring your own AI key from Google Gemini, OpenAI or Anthropic, so the writing is billed to you. Gemini has a free tier that covers a briefing or two a day; OpenAI and Anthropic are paid, usually a few cents per briefing. Your key is verified, stored encrypted and used only to write your briefings." },
  { q: "What happens to what I tell Neo about myself?", a: "It's stored in your account and used only to write your briefings. You can change or delete it from settings. See the privacy page for details." },
];

// ── Decorative backgrounds ────────────────────────────────────────────────────

/** Dot grid and ember glows on black. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] overflow-hidden [mask-image:linear-gradient(#000_55%,transparent)]">
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(244,241,234,0.22)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000,transparent)]" />
      <div className="blob absolute -top-56 left-1/2 -translate-x-1/2 h-[620px] w-[900px] rounded-full bg-[#ff6a2c]/25 blur-[140px]" />
      <div className="blob blob-slow absolute top-40 -left-60 h-[460px] w-[460px] rounded-full bg-[#b4441a]/20 blur-[130px]" />
      <div className="blob absolute top-60 -right-60 h-[420px] w-[420px] rounded-full bg-[#7a3b1e]/20 blur-[130px]" />
    </div>
  );
}

function Ticker({ items, reverse = false }: { items: Brand[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="marquee-wrap overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className={`marquee ${reverse ? "marquee-rev" : ""}`}>
        {row.map(([name, domain], i) => (
          <span key={i} className="flex-shrink-0 inline-flex items-center gap-3 rounded-full border border-ink/10 bg-card/80 pl-2 pr-5 py-2 text-[14px] text-ink">
            <BrandMark domain={domain} name={name} />{name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="dateline mb-4 flex items-center gap-2"><span className="h-px w-6 bg-accent" />{children}</p>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const pubCount = Object.keys(PUB_CATALOG).length;
  const podCount = Array.isArray(POD_CATALOG) ? POD_CATALOG.length : Object.keys(POD_CATALOG).length;

  return (
    <div className="grain min-h-screen bg-page overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40">
        <nav className="glass mx-auto mt-3 max-w-[1080px] rounded-full h-12 px-4 sm:px-5 flex items-center justify-between w-[calc(100%-24px)]">
          <Logo />
          <div className="hidden md:flex items-center gap-7 text-[14px] text-body">
            <a href="#how" className="hover:text-ink transition-colors duration-150">How it works</a>
            <a href="#inside" className="hover:text-ink transition-colors duration-150">What&apos;s inside</a>
            <a href="#faq" className="hover:text-ink transition-colors duration-150">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] text-body hover:text-ink transition-colors duration-150">Log in</Link>
            <Link href="/signup" className="btn-primary btn-sm !h-8 !px-4 rounded-full">Get started</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <HeroBackdrop />
        <div className="relative max-w-[1120px] mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-16">
          <div className="max-w-[860px] mx-auto text-center">
            <p className="rise mx-auto inline-flex items-center gap-2 rounded-full border border-ink/10 bg-card/70 px-3.5 py-1.5 text-[13px] text-body" style={{ ["--d" as string]: "0ms" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Personal market intelligence
            </p>
            <h1 className="rise mt-6 font-display font-normal text-[40px] sm:text-[84px] leading-[1.0] tracking-[-0.035em] text-ink" style={{ ["--d" as string]: "70ms" }}>
              Everything you follow,<br />
              in <em className="italic text-accent">one briefing</em> about you
            </h1>
            <p className="rise mt-7 mx-auto text-[18px] sm:text-[20px] leading-[30px] text-body max-w-[640px]" style={{ ["--d" as string]: "140ms" }}>
              Neo combines your news, newsletters, podcasts and feeds into a single morning briefing, then writes it through your own lens: your role, your market and your goals.
            </p>
            <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ ["--d" as string]: "210ms" }}>
              <Link href="/signup" className="btn-primary h-12 px-7 rounded-full text-[15px]">Get started <IconArrowRight /></Link>
              <a href="#how" className="btn-secondary h-12 px-7 rounded-full text-[15px]">See how it works</a>
            </div>
            <p className="rise mt-4 text-[13px] text-muted" style={{ ["--d" as string]: "260ms" }}>Takes two minutes. Bring a Gemini, OpenAI or Anthropic key. Gemini&apos;s is free.</p>
          </div>

          <div className="rise mt-14 sm:mt-20" style={{ ["--d" as string]: "320ms" }}>
            <LensDemo />
          </div>
        </div>
      </section>

      {/* Logo wall */}
      <section aria-label="Sources Neo reads" className="py-12 sm:py-16">
        <p className="dateline text-center mb-8">Reads what you already read</p>
        <div className="space-y-3">
          <Ticker items={PUBS} />
          <Ticker items={SHOWS} reverse />
        </div>
        <div className="mt-8 max-w-[1120px] mx-auto px-5 sm:px-6 flex flex-wrap items-center justify-center gap-2">
          <span className="dateline mr-2">Track people on X</span>
          {X_HANDLES.map(h => (
            <span key={h} className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1.5 text-[13px] text-body">
              <span className="grid place-items-center h-5 w-5 rounded-full bg-ink text-card text-[10px] font-semibold">{h[1].toUpperCase()}</span>{h}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-[40px] sm:text-[60px] leading-[1.02] tracking-[-0.03em] max-w-[760px]">
              Set it up once. <span className="text-muted">Read it every morning.</span>
            </h2>
          </Reveal>
          <ol className="mt-14 border-t border-ink/[0.1]">
            {STEPS.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 90}>
                <div className="group grid md:grid-cols-[80px_1fr_1.2fr_40px] gap-3 md:gap-8 items-center py-8 border-b border-ink/[0.1] transition-colors duration-300 hover:bg-card/60 px-2 -mx-2">
                  <span className="dateline">0{i + 1}</span>
                  <h3 className="font-display text-[30px] sm:text-[38px] leading-[1.05] tracking-[-0.02em]">{st.title}</h3>
                  <p className="text-[15px] leading-[24px] text-body max-w-[34rem]">{st.body}</p>
                  <span className="hidden md:grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-body transition-[background-color,color,transform] duration-300 ease-neo group-hover:bg-accent group-hover:text-page group-hover:border-accent group-hover:-rotate-45"><st.icon size={16} /></span>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Bento */}
      <section id="inside" className="scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 pb-20 sm:pb-28">
          <Reveal>
            <Eyebrow>What&apos;s inside</Eyebrow>
            <h2 className="font-display text-[40px] sm:text-[60px] leading-[1.02] tracking-[-0.03em] max-w-[760px]">
              Built to be read in <em className="italic text-accent">five minutes</em>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Sources count */}
            <Reveal className="md:col-span-4">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <div className="flex items-center gap-2 text-body mb-6"><IconNewspaper /><span className="text-[14px]">Sources</span></div>
                <div className="grid grid-cols-3 gap-4">
                  {[{ n: pubCount, l: "publications" }, { n: podCount, l: "podcasts" }, { n: TOPICS.length, l: "topics" }].map(x => (
                    <div key={x.l}>
                      <div className="font-display text-[56px] sm:text-[84px] leading-none tracking-[-0.04em]"><CountUp to={x.n} /></div>
                      <div className="text-[13px] text-body mt-2">{x.l} to pick from</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-[14px] leading-[22px] text-body max-w-[34rem]">
                  Plus any Substack, any YouTube channel, Reddit and Hacker News, and open news search for everything else in your topics.
                </p>
              </div>
            </Reveal>

            {/* Fresh */}
            <Reveal delay={90} className="md:col-span-2">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <div className="flex items-center gap-2 text-body mb-6"><IconRadio /><span className="text-[14px]">Always fresh</span></div>
                <div className="font-display text-[56px] sm:text-[72px] leading-none tracking-[-0.04em]">24<span className="text-muted text-[32px] tracking-normal ml-1">hours</span></div>
                <p className="mt-4 text-[14px] leading-[22px] text-body">Only the last day, and never a story you already read yesterday.</p>
              </div>
            </Reveal>

            {/* Depth */}
            <Reveal className="md:col-span-3">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <h3 className="text-[18px] font-medium">Choose how deep</h3>
                <p className="text-[14px] text-body mb-6">Stories per briefing, set each time you generate.</p>
                <ul className="space-y-4">
                  {DEPTHS.map((d, k) => (
                    <li key={d.name}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[14px] font-medium">{d.name} <span className="font-normal text-muted ml-1">{d.note}</span></span>
                        <span className="dateline">{d.n} stories</span>
                      </div>
                      <div className="h-2 rounded-full bg-raised overflow-hidden">
                        <div className="bar h-full rounded-full bg-accent" style={{ width: `${(d.n / 12) * 100}%`, ["--d" as string]: `${k * 120}ms` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Delivery */}
            <Reveal delay={90} className="md:col-span-3">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <div className="flex items-center gap-2 text-body mb-5"><IconMail /><span className="text-[14px]">In your inbox</span></div>
                <div className="rounded-control border border-ink/[0.08] bg-page/70 p-4">
                  <div className="dateline mb-2">Neo · 7:00 AM</div>
                  <p className="text-[15px] font-medium leading-[22px]">Neo — Thursday, October 29, 2026</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 rounded bg-raised w-full" /><div className="h-2 rounded bg-raised w-11/12" /><div className="h-2 rounded bg-raised w-3/5" />
                  </div>
                </div>
                <p className="mt-4 text-[14px] leading-[22px] text-body">One email, every morning. Or open your dashboard and generate one whenever you like.</p>
              </div>
            </Reveal>

            {/* Voice */}
            <Reveal className="md:col-span-2">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <h3 className="text-[18px] font-medium mb-1">Your voice</h3>
                <p className="text-[14px] text-body mb-5">Pick how it sounds.</p>
                <ul className="space-y-2">
                  {[["Analyst", "Straight to implications"], ["Journalist", "Clear, with context"], ["Advisor", "Fewer stories, only your role"]].map(([a, b]) => (
                    <li key={a} className="rounded-control bg-raised/60 px-3.5 py-2.5">
                      <span className="text-[14px] font-medium">{a}</span>
                      <span className="block text-[12px] text-body">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Key */}
            <Reveal delay={90} className="md:col-span-4">
              <div className="surface rounded-card p-6 sm:p-8 h-full">
                <h3 className="text-[18px] font-medium">Bring your own AI key</h3>
                <p className="text-[14px] leading-[22px] text-body mt-1 mb-5 max-w-[34rem]">
                  Use the provider you already have. Your key is verified, stored encrypted, and used only to write your briefings.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {PROVIDER_ORDER.map(p => (
                    <a key={p} href={PROVIDERS[p].keyUrl} target="_blank" rel="noopener noreferrer"
                      className="group rounded-control border border-ink/10 bg-card p-4 transition-[border-color,transform] duration-200 ease-neo hover:border-ink/30 hover:-translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-medium">{PROVIDERS[p].label}</span>
                        <IconExternal size={14} className="text-muted group-hover:text-ink transition-colors" />
                      </div>
                      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 ${PROVIDERS[p].free ? "bg-good/10 text-good font-medium" : "bg-raised text-muted"}`}>
                        {PROVIDERS[p].free && <IconCheck size={11} />}{PROVIDERS[p].free ? "Free tier" : "Paid"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="relative overflow-hidden border-y border-ink/[0.08]">
        <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[820px] rounded-full bg-[#ff6a2c]/20 blur-[130px]" />
        <div className="relative max-w-[1120px] mx-auto px-5 sm:px-6 py-24 sm:py-32 text-center">
          <Reveal>
            <p className="font-display text-[36px] sm:text-[68px] leading-[1.04] tracking-[-0.03em] max-w-[960px] mx-auto">
              News is written for everyone, so it isn&apos;t about <em className="italic text-accent">anyone</em>. Neo writes it about you.
            </p>
            <div className="mt-10"><Link href="/signup" className="btn-primary h-12 px-7 rounded-full text-[15px]">Build my briefing <IconArrowRight /></Link></div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-[5fr_7fr] gap-12">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="font-display text-[40px] sm:text-[56px] leading-[1.02] tracking-[-0.03em]">Questions</h2>
          </Reveal>
          <Reveal delay={90}>
            <div className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
              {FAQ.map(f => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium">
                    {f.q}
                    <span aria-hidden className="text-muted text-[22px] leading-none transition-transform duration-200 ease-neo group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-[24px] text-body max-w-[40rem]">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Company CTA */}
      <section>
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 pb-20 sm:pb-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-panel border border-ink/[0.08] bg-card p-8 sm:p-14 grid lg:grid-cols-[7fr_5fr] gap-8 items-center">
              <div aria-hidden className="absolute -right-24 -bottom-32 h-[360px] w-[360px] rounded-full bg-[#ff6a2c]/25 blur-3xl" />
              <div className="relative">
                <p className="dateline mb-4">For teams</p>
                <h2 className="font-display text-[34px] sm:text-[52px] leading-[1.04] tracking-[-0.03em]">
                  Want a market intelligence system for your company?
                </h2>
                <p className="mt-4 text-[16px] leading-[26px] text-body max-w-[34rem]">
                  I build custom systems that track your sector, competitors and sources, and send your team a briefing on a schedule. Tell me what you need to keep an eye on.
                </p>
              </div>
              <div className="relative lg:justify-self-end">
                <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer" className="btn-primary h-12 px-7 rounded-full text-[15px]">
                  Email me <IconExternal />
                </a>
                <p className="mt-3 text-[13px] text-muted">
                  Opens Gmail, or write to{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-ink">{CONTACT_EMAIL}</a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/[0.08]">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted">
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
