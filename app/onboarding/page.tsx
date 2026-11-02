"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { IconArrowRight } from "@/components/Icons";

// ─── Topics ───────────────────────────────────────────────────────────────────

const TOPICS = [
  "Business & Markets",
  "African Tech",
  "AI & Machine Learning",
  "Startups & VC",
  "Crypto & Web3",
  "Politics & Policy",
  "Health & Science",
  "Climate & Energy",
  "Sports Business",
  "Media & Creator Economy",
  "Real Estate",
  "Personal Finance",
  "Geopolitics",
  "Culture & Society",
];

// ─── Publications ─────────────────────────────────────────────────────────────

interface Pub { domain: string; description: string }

const PUB_DETAILS: Record<string, Pub> = {
  "Bloomberg":           { domain: "bloomberg.com",          description: "Real-time financial data and global market news" },
  "Financial Times":     { domain: "ft.com",                 description: "Global business and financial reporting" },
  "Reuters":             { domain: "reuters.com",            description: "Breaking news and wire service" },
  "WSJ":                 { domain: "wsj.com",                description: "Wall Street Journal — U.S. markets and business" },
  "The Economist":       { domain: "economist.com",          description: "Rigorous global analysis and opinion" },
  "CNBC":                { domain: "cnbc.com",               description: "Real-time business and financial TV" },
  "Forbes":              { domain: "forbes.com",             description: "Business, investing, and entrepreneurship" },
  "TechCabal":           { domain: "techcabal.com",          description: "African tech startups and innovation" },
  "Semafor":             { domain: "semafor.com",            description: "Bias-transparent global news" },
  "Rest of World":       { domain: "restofworld.org",        description: "Tech reshaping the world beyond Silicon Valley" },
  "Disrupt Africa":      { domain: "disruptafrica.com",      description: "African startup funding and ecosystem" },
  "African Business":    { domain: "african.business",       description: "Business and economics across Africa" },
  "TechCrunch":          { domain: "techcrunch.com",         description: "Startup news and funding rounds" },
  "The Verge":           { domain: "theverge.com",           description: "Tech, science, and culture" },
  "Wired":               { domain: "wired.com",              description: "The future of technology and culture" },
  "MIT Tech Review":     { domain: "technologyreview.com",   description: "Deep technology analysis from MIT" },
  "Y Combinator Blog":   { domain: "ycombinator.com",        description: "Startup advice and YC announcements" },
  "Axios":               { domain: "axios.com",              description: "Smart brevity on politics, tech, and business" },
  "The Information":     { domain: "theinformation.com",     description: "Exclusive tech and Silicon Valley reporting" },
  "Politico":            { domain: "politico.com",           description: "Political news and policy analysis" },
  "The Atlantic":        { domain: "theatlantic.com",        description: "Long-form ideas and cultural reporting" },
  "Foreign Policy":      { domain: "foreignpolicy.com",      description: "International relations and global affairs" },
  "STAT News":           { domain: "statnews.com",           description: "Health, medicine, and life sciences" },
  "Fierce Healthcare":   { domain: "fiercehealthcare.com",   description: "Healthcare industry news" },
  "NEJM":                { domain: "nejm.org",               description: "New England Journal of Medicine" },
  "Bloomberg Green":     { domain: "bloomberg.com",          description: "Climate, energy, and sustainability" },
  "Carbon Brief":        { domain: "carbonbrief.org",        description: "Science and policy around climate change" },
  "Heatmap":             { domain: "heatmap.news",           description: "Climate tech and clean energy transition" },
  "E&E News":            { domain: "eenews.net",             description: "Energy and environment policy journalism" },
  "Sportico":            { domain: "sportico.com",           description: "The business side of sports" },
  "Front Office Sports": { domain: "frontofficesports.com",  description: "Sports media, money, and deals" },
  "The Athletic":        { domain: "theathletic.com",        description: "Premium in-depth sports journalism" },
  "Puck":                { domain: "puck.news",              description: "Power, money, and media insiders" },
  "Morning Brew":        { domain: "morningbrew.com",        description: "Business news for young professionals" },
  "The Motley Fool":     { domain: "fool.com",               description: "Investing news and long-term stock picks" },
  "Foreign Affairs":     { domain: "foreignaffairs.com",     description: "Foreign policy from CFR" },
  "War on the Rocks":    { domain: "warontherocks.com",      description: "National security and strategy analysis" },
  "Lawfare":             { domain: "lawfaremedia.org",       description: "Law and national security" },
  "The Block":           { domain: "theblock.co",            description: "Crypto and blockchain news" },
  "CoinDesk":            { domain: "coindesk.com",           description: "Digital assets and Web3 news" },
  "Decrypt":             { domain: "decrypt.co",             description: "Bitcoin, Ethereum, and crypto explained" },
};

const TOPIC_PUBS: Record<string, string[]> = {
  "Business & Markets":    ["Bloomberg", "Financial Times", "Reuters", "WSJ", "The Economist", "CNBC", "Forbes"],
  "African Tech":          ["TechCabal", "Semafor", "Rest of World", "Disrupt Africa", "African Business"],
  "AI & Machine Learning": ["TechCrunch", "The Verge", "Wired", "MIT Tech Review", "The Information"],
  "Startups & VC":         ["TechCrunch", "Y Combinator Blog", "Axios", "The Information", "Forbes"],
  "Crypto & Web3":         ["The Block", "CoinDesk", "Decrypt", "Bloomberg", "The Verge"],
  "Politics & Policy":     ["Politico", "The Atlantic", "Foreign Policy", "Semafor", "Axios"],
  "Health & Science":      ["STAT News", "NEJM", "Fierce Healthcare", "Reuters", "The Atlantic"],
  "Climate & Energy":      ["Bloomberg Green", "Carbon Brief", "E&E News", "Heatmap", "Reuters"],
  "Sports Business":       ["Sportico", "Front Office Sports", "The Athletic", "Bloomberg", "Forbes"],
  "Media & Creator Economy": ["Puck", "Axios", "Morning Brew", "The Information", "TechCrunch"],
  "Real Estate":           ["Bloomberg", "WSJ", "Morning Brew", "Forbes", "Reuters"],
  "Personal Finance":      ["WSJ", "Bloomberg", "Morning Brew", "The Motley Fool", "Forbes"],
  "Geopolitics":           ["Foreign Affairs", "Foreign Policy", "War on the Rocks", "Lawfare", "Reuters"],
  "Culture & Society":     ["The Atlantic", "Semafor", "Axios", "Puck", "Foreign Policy"],
};

// ─── Newsletters (Substack-style) ─────────────────────────────────────────────

interface Newsletter { name: string; url: string }

const TOPIC_NEWSLETTERS: Record<string, Newsletter[]> = {
  "AI & Machine Learning": [
    { name: "Import AI",         url: "https://importai.substack.com"   },
    { name: "The Batch",         url: "https://www.deeplearning.ai/the-batch" },
  ],
  "Startups & VC":         [
    { name: "Term Sheet",        url: "https://fortune.com/newsletter/termsheet" },
    { name: "Axios Pro Rata",    url: "https://www.axios.com/newsletters/axios-pro-rata" },
  ],
  "Crypto & Web3":         [
    { name: "Bankless",          url: "https://bankless.substack.com"   },
    { name: "Pomp Letter",       url: "https://pomp.substack.com"       },
  ],
  "Media & Creator Economy": [
    { name: "Platformer",        url: "https://www.platformer.news"     },
    { name: "The Rebooting",     url: "https://www.therebooting.com"    },
    { name: "Hot Pod",           url: "https://hotpodnews.com"          },
  ],
  "Business & Markets":    [
    { name: "Morning Brew",      url: "https://morningbrew.com"         },
    { name: "Net Interest",      url: "https://www.netinterest.co"      },
  ],
  "African Tech":          [
    { name: "TechCabal Daily",   url: "https://techcabal.com"           },
  ],
  "Politics & Policy":     [
    { name: "Tangle",            url: "https://www.readtangle.com"      },
  ],
};

// ─── X / Twitter suggestions ──────────────────────────────────────────────────

const TOPIC_X: Record<string, string[]> = {
  "African Tech":          ["TechCabal", "Olusegun", "Jason"],
  "AI & Machine Learning": ["sama", "karpathy", "benedictevans"],
  "Startups & VC":         ["paulg", "naval", "garrytan"],
  "Crypto & Web3":         ["cdixon", "VitalikButerin", "balajis"],
  "Business & Markets":    ["howardlindzon", "ReformedBroker", "mcuban"],
  "Politics & Policy":     ["karaswisher", "ezraklein"],
  "Geopolitics":           ["ian_bremmer", "elerianm"],
};

// ─── Podcasts ─────────────────────────────────────────────────────────────────

const PODCAST_OPTIONS = [
  "All-In", "Acquired", "My First Million", "How I Built This",
  "The Prof G Pod", "Unchained", "African Tech Roundup",
  "Bankless", "Invest Like The Best", "20VC",
];

const REDDIT_CHIPS = [
  "startups", "Entrepreneur", "venturecapital",
  "investing", "stocks", "personalfinance",
  "MachineLearning", "artificial", "technology",
  "CryptoCurrency", "ethereum", "Bitcoin",
  "worldnews", "geopolitics", "science",
  "africa", "realestate", "socialmedia",
];

// ─── Lens ─────────────────────────────────────────────────────────────────────

const ROLES = ["Founder", "Investor", "Student", "Executive", "Creator", "Consultant", "Researcher", "Other"];
const GOALS = [
  "Make better investment decisions",
  "Stay ahead in my industry",
  "Find content ideas",
  "Track competitors",
  "Learn something new daily",
  "All of the above",
];

// ─── Briefing styles ──────────────────────────────────────────────────────────

type BriefingStyle = "analyst" | "journalist" | "advisor";

const BRIEFING_STYLES: { id: BriefingStyle; icon: string; title: string; description: string; tag: string }[] = [
  {
    id: "analyst",
    icon: "",
    title: "Analyst",
    description: "Sharp, opinionated, assumes you know the basics. Gets straight to implications.",
    tag: "default for founders & investors",
  },
  {
    id: "journalist",
    icon: "",
    title: "Journalist",
    description: "Clear context, explains the story, balanced perspectives. Good for staying generally informed.",
    tag: "good for broad awareness",
  },
  {
    id: "advisor",
    icon: "",
    title: "Advisor",
    description: "Specific to your field only. Filters aggressively. Only tells you what directly affects your work.",
    tag: "good for specialists",
  },
];

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen({ topics, onContinue }: { topics: string[]; onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-5 py-12">
      <Logo href="/" className="mb-10" />
      <div className="rise w-full max-w-[480px]">
        <h1 className="font-display text-[44px] leading-[1.08] tracking-[-0.02em] mb-3">You&apos;re set</h1>
        <p className="text-[16px] leading-[26px] text-body mb-8">
          Your first briefing arrives tomorrow morning. You can also generate one right now from your dashboard.
        </p>
        <div className="surface rounded-card p-5 mb-6">
          <p className="dateline mb-3">Watching</p>
          <div className="flex flex-wrap gap-2">
            {topics.map(t => <span key={t} className="rounded-[6px] bg-raised px-2.5 py-1.5 text-[13px] text-body">{t}</span>)}
          </div>
        </div>
        <button onClick={onContinue} className="btn-primary w-full h-12">Go to your dashboard <IconArrowRight /></button>
      </div>
    </div>
  );
}

// ─── Logo helper ──────────────────────────────────────────────────────────────

function ClearbitLogo({ domain, size = 20 }: { domain: string; size?: number }) {
  // A letter tile: always renders, no third-party request
  const letter = domain.replace(/^www\./, "").charAt(0).toUpperCase();
  return (
    <span aria-hidden
      className="inline-grid place-items-center rounded-[6px] bg-raised font-mono text-[11px] text-body"
      style={{ width: size, height: size }}>
      {letter}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSuggestedPubs(selectedTopics: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of selectedTopics) {
    for (const p of (TOPIC_PUBS[t] ?? [])) {
      if (!seen.has(p) && PUB_DETAILS[p]) { seen.add(p); result.push(p); }
    }
  }
  return result;
}

function getSuggestedNewsletters(selectedTopics: string[]): Newsletter[] {
  const seen = new Set<string>();
  const result: Newsletter[] = [];
  for (const t of selectedTopics) {
    for (const n of (TOPIC_NEWSLETTERS[t] ?? [])) {
      if (!seen.has(n.name)) { seen.add(n.name); result.push(n); }
    }
  }
  return result;
}

function getSuggestedX(selectedTopics: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of selectedTopics) {
    for (const h of (TOPIC_X[t] ?? [])) {
      if (!seen.has(h)) { seen.add(h); result.push(h); }
    }
  }
  return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // ── Step 1: Topics ──────────────────────────────────────────────────────────
  const [topics, setTopics] = useState<string[]>([]);

  // ── Step 2: Sources ─────────────────────────────────────────────────────────
  const [publications, setPublications]         = useState<string[]>([]);
  const [substacks, setSubstacks]               = useState<string[]>([]);   // URLs
  const [subInput, setSubInput]                 = useState("");
  const [xHandles, setXHandles]                 = useState<string[]>([]);
  const [xInput, setXInput]                     = useState("");
  const [podcasts, setPodcasts]                 = useState<string[]>([]);
  const [youtubeChannels, setYoutubeChannels]   = useState<string[]>([]);
  const [ytInput, setYtInput]                   = useState("");
  const [redditCommunities, setRedditCommunities] = useState<string[]>([]);

  // Track publications user explicitly removed so auto-select doesn't re-add them
  const manuallyRemovedRef = useRef(new Set<string>());

  // Auto-select top 3 pubs per topic when topics change
  useEffect(() => {
    if (topics.length === 0) { setPublications([]); return; }
    const top3: string[] = [];
    const seen = new Set<string>();
    for (const t of topics) {
      for (const p of (TOPIC_PUBS[t] ?? []).slice(0, 3)) {
        if (!seen.has(p) && PUB_DETAILS[p]) { seen.add(p); top3.push(p); }
      }
    }
    setPublications(prev => {
      const next = new Set(prev);
      top3.forEach(p => { if (!manuallyRemovedRef.current.has(p)) next.add(p); });
      return Array.from(next);
    });
  }, [topics]);

  function togglePub(name: string) {
    setPublications(prev => {
      if (prev.includes(name)) {
        manuallyRemovedRef.current.add(name);
        return prev.filter(p => p !== name);
      }
      manuallyRemovedRef.current.delete(name);
      return [...prev, name];
    });
  }

  function addSubstack(url?: string) {
    let val = (url ?? subInput).trim();
    if (!val) return;
    if (!val.startsWith("http")) val = `https://${val}`;
    if (!substacks.includes(val)) setSubstacks(prev => [...prev, val]);
    if (!url) setSubInput("");
  }

  function addXHandle(handle?: string) {
    const h = (handle ?? xInput).trim().replace(/^@/, "");
    if (!h || xHandles.includes(h)) return;
    setXHandles(prev => [...prev, h]);
    if (!handle) setXInput("");
  }

  function addYouTube() {
    const val = ytInput.trim();
    if (!val || youtubeChannels.includes(val)) return;
    setYoutubeChannels(prev => [...prev, val]);
    setYtInput("");
  }

  // ── Step 3: Lens ────────────────────────────────────────────────────────────
  const [role, setRole]         = useState("");
  const [location, setLocation] = useState("");
  const [caring, setCaring]     = useState("");
  const [caringTouched, setCaringTouched] = useState(false);
  const [goal, setGoal]         = useState("");
  const [lens, setLens]         = useState("");

  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [apiKey, setApiKey]               = useState("");
  const [deliveryTime] = useState("07:00");
  const [briefingStyle, setBriefingStyle] = useState<BriefingStyle>("analyst");
  const [expertiseLevel, setExpertiseLevel] = useState<"expert" | "beginner">("expert");

  useEffect(() => {
    createBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setDeliveryEmail(data.user.email);
    });
  }, []);

  // Update "caring" when topics change (unless user has edited it)
  useEffect(() => {
    if (!caringTouched) setCaring(topics.slice(0, 3).join(", "));
  }, [topics, caringTouched]);

  // Auto-generate lens from structured fields
  const generatedLens = useMemo(() => {
    const parts: string[] = [];
    if (role) {
      let who = `I am a ${role}`;
      if (location) who += ` based in ${location}`;
      parts.push(who);
    } else if (location) {
      parts.push(`Based in ${location}`);
    }
    if (caring) parts.push(`I care most about ${caring}`);
    if (goal) parts.push(`I want my briefing to help me ${goal.toLowerCase()}`);
    return parts.length ? parts.join(". ") + "." : "";
  }, [role, location, caring, goal]);

  useEffect(() => {
    if (generatedLens) setLens(generatedLens);
  }, [generatedLens]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [step, setStep]             = useState(1);
  const [direction, setDirection]   = useState<"fwd" | "bwd">("fwd");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function advance() {
    if (step === 1 && topics.length === 0) { setError("Pick at least one topic to continue."); return; }
    setError(null);
    setDirection("fwd");
    setStep(s => s + 1);
  }
  function back() {
    setError(null);
    setDirection("bwd");
    setStep(s => s - 1);
  }

  async function handleComplete() {
    if (!lens.trim()) { setError("Fill in a bit about yourself so Neo can personalise your briefing."); return; }
    if (!apiKey.trim()) { setError("Add your Anthropic API key so Neo can write your briefings."); return; }
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const coreData = {
        id:            user.id,
        email:         user.email,
        topics,
        sources: {
          publications,
          substacks,
          x_handles:          xHandles,
          podcasts,
          youtube_channels:   youtubeChannels,
          reddit_communities: redditCommunities,
        },
        lens,
        delivery_time:  deliveryTime,
        delivery_email: deliveryEmail || user.email,
        updated_at:     new Date().toISOString(),
      };

      // Try with style/expertise columns; fall back without them if they don't exist yet
      let { error: err } = await supabase.from("profiles").upsert({
        ...coreData,
        briefing_style:  briefingStyle,
        expertise_level: expertiseLevel,
      });

      if (err && (err.code === "42703" || err.message?.includes("schema cache") || err.message?.includes("briefing_style") || err.message?.includes("expertise_level"))) {
        // Columns not yet added to DB — save core profile and continue
        const retry = await supabase.from("profiles").upsert(coreData);
        err = retry.error;
      }

      if (err) {
        console.error("[onboarding] save error:", err);
        throw new Error(err.message ?? "Database save failed");
      }

      // Verify, encrypt and store the user's own Anthropic key (server side)
      const keyRes = await fetch("/api/anthropic-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey.trim() }),
      });
      if (!keyRes.ok) {
        const j = await keyRes.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't save your Anthropic key.");
      }

      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed — please try again.");
      setLoading(false);
    }
  }

  // ── Confirmation ─────────────────────────────────────────────────────────────
  if (step === 4) {
    return <ConfirmationScreen topics={topics} onContinue={() => router.push("/dashboard")} />;
  }

  // ── Derived data for step 2 ───────────────────────────────────────────────
  const suggestedPubs        = getSuggestedPubs(topics);
  const suggestedNewsletters = getSuggestedNewsletters(topics);
  const suggestedX           = getSuggestedX(topics);

  // ── Animation ───────────────────────────────────────────────────────────────
  const slideAnim = direction === "fwd" ? "slideInRight 0.28s ease both" : "slideInLeft 0.28s ease both";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Logo href="/" className="mb-8" />

      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted ">
              Step {step} of 3
            </span>
            <span className="text-[11px] text-muted">
              {step === 1 ? "Interests" : step === 2 ? "Sources" : "Your lens"}
            </span>
          </div>
          <div className="h-[2px] bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%`, background: "#1f1b16" }} />
          </div>
        </div>

        {/* Step card */}
        <div className="bg-card rounded-card border border-ink/10 shadow-soft overflow-hidden">

          {/* Step content — slides in on change */}
          <div key={step} style={{ animation: slideAnim }}>

            {/* ─────────────────── STEP 1: TOPICS ─────────────────────── */}
            {step === 1 && (
              <div className="px-7 py-8">
                <h2 className="text-2xl font-medium tracking-tight text-ink mb-1.5">
                  What moves your world?
                </h2>
                <p className="text-[13px] text-muted mb-7">
                  Pick your interests. Neo will watch these for you.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {TOPICS.map((t, i) => {
                    const on = topics.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => setTopics(prev =>
                        prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                      )}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                          on
                            ? "text-card border-transparent shadow-soft scale-[1.02]"
                            : "bg-raised text-body border-ink/10 hover:border-ink/30 hover:bg-card"
                        }`}
                        style={{
                          animation: `fadeInUp 0.4s ease both ${0.05 + i * 0.035}s`,
                          ...(on ? { background: "#1f1b16" } : {}),
                        }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
                {topics.length > 0 && (
                  <p className="text-xs text-muted mt-5">
                    {topics.length} topic{topics.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            {/* ─────────────────── STEP 2: SOURCES ─────────────────────── */}
            {step === 2 && (
              <div className="px-7 py-8">
                <h2 className="text-2xl font-medium tracking-tight text-ink mb-1.5">
                  Where does your world live?
                </h2>
                <p className="text-[13px] text-muted mb-7">
                  Neo auto-selected the best sources for your topics. Customise below.
                </p>

                {/* ── Publications ── */}
                <div className="mb-8">
                  <p className="text-[11px] font-medium text-muted mb-4">
                    Publications
                  </p>
                  {suggestedPubs.length === 0 ? (
                    <p className="text-sm text-muted">Select topics in step 1 to see suggestions.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {suggestedPubs.map(name => {
                        const pub    = PUB_DETAILS[name];
                        const on     = publications.includes(name);
                        return (
                          <button key={name} type="button" onClick={() => togglePub(name)}
                            className={`flex items-start gap-3 p-3.5 rounded-control border text-left w-full transition-all duration-150 ${
                              on
                                ? "border-neutral-900 bg-ink/[0.03] shadow-soft"
                                : "border-ink/10 bg-card hover:border-ink/20 hover:bg-raised"
                            }`}>
                            <div className="w-7 h-7 rounded-lg bg-card border border-ink/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                              <ClearbitLogo domain={pub.domain} size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-ink truncate">{name}</span>
                                <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                                  on ? "bg-ink border-neutral-900" : "border-ink/20"
                                }`}>
                                  {on && <span className="text-card text-[9px] leading-none">✓</span>}
                                </div>
                              </div>
                              <p className="text-[11px] text-muted mt-0.5 leading-snug line-clamp-1">
                                {pub.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Newsletters ── */}
                <div className="mb-8">
                  <p className="text-[11px] font-medium text-muted mb-3">
                    Newsletters & Substacks
                  </p>
                  {suggestedNewsletters.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestedNewsletters.map(n => {
                        const on = substacks.includes(n.url);
                        return (
                          <button key={n.name} type="button"
                            onClick={() => on
                              ? setSubstacks(prev => prev.filter(s => s !== n.url))
                              : addSubstack(n.url)}
                            className={`text-sm px-3.5 py-2 rounded-full border font-medium transition-all ${
                              on
                                ? "text-card border-transparent"
                                : "bg-card text-body border-ink/10 hover:border-ink/30"
                            }`}
                            style={on ? { background: "#1f1b16" } : {}}>
                            {n.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubstack())}
                      placeholder="https://newsletter.substack.com"
                      className="flex-1 h-10 px-3.5 rounded-control border border-ink/10 text-sm bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                    <button type="button" onClick={() => addSubstack()}
                      className="h-10 px-4 bg-ink hover:bg-[#35302a] text-card text-sm font-medium rounded-control transition-colors flex-shrink-0">
                      Add
                    </button>
                  </div>
                  {substacks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {substacks.map(url => (
                        <span key={url} className="flex items-center gap-1.5 bg-raised text-body text-xs px-3 py-1.5 rounded-full">
                          {url.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 35)}
                          <button type="button" onClick={() => setSubstacks(prev => prev.filter(s => s !== url))}
                            className="text-muted hover:text-body leading-none ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── X Accounts ── */}
                <div className="mb-8">
                  <p className="text-[11px] font-medium text-muted mb-3">
                    X / Twitter accounts
                  </p>
                  {suggestedX.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestedX.map(h => {
                        const on = xHandles.includes(h);
                        return (
                          <button key={h} type="button"
                            onClick={() => on
                              ? setXHandles(prev => prev.filter(x => x !== h))
                              : addXHandle(h)}
                            className={`text-sm px-3.5 py-2 rounded-full border font-medium transition-all ${
                              on
                                ? "text-card border-transparent"
                                : "bg-card text-body border-ink/10 hover:border-ink/30"
                            }`}
                            style={on ? { background: "#1f1b16" } : {}}>
                            @{h}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={xInput} onChange={e => setXInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addXHandle())}
                      placeholder="@handle"
                      className="flex-1 h-10 px-3.5 rounded-control border border-ink/10 text-sm bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                    <button type="button" onClick={() => addXHandle()}
                      className="h-10 px-4 bg-ink hover:bg-[#35302a] text-card text-sm font-medium rounded-control transition-colors flex-shrink-0">
                      Add
                    </button>
                  </div>
                  {xHandles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {xHandles.map(h => (
                        <span key={h} className="flex items-center gap-1.5 bg-raised text-body text-xs px-3 py-1.5 rounded-full">
                          @{h}
                          <button type="button" onClick={() => setXHandles(prev => prev.filter(x => x !== h))}
                            className="text-muted hover:text-body leading-none ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Podcasts ── */}
                <div className="mb-8">
                  <p className="text-[11px] font-medium text-muted mb-3">
                    Podcasts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PODCAST_OPTIONS.map(p => {
                      const on = podcasts.includes(p);
                      return (
                        <button key={p} type="button"
                          onClick={() => setPodcasts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                          className={`text-sm px-3.5 py-2 rounded-full border font-medium transition-all ${
                            on
                              ? "text-card border-transparent"
                              : "bg-card text-body border-ink/10 hover:border-ink/30"
                          }`}
                          style={on ? { background: "#1f1b16" } : {}}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── YouTube ── */}
                <div className="mb-8">
                  <p className="text-[11px] font-medium text-muted mb-3">
                    YouTube channels
                  </p>
                  <div className="flex gap-2">
                    <input type="text" value={ytInput} onChange={e => setYtInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addYouTube())}
                      placeholder="Channel URL or ID (e.g. UCBcRF18a7Qf58cCRy5xuWwQ)"
                      className="flex-1 h-10 px-3.5 rounded-control border border-ink/10 text-sm bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                    <button type="button" onClick={addYouTube}
                      className="h-10 px-4 bg-ink hover:bg-[#35302a] text-card text-sm font-medium rounded-control transition-colors flex-shrink-0">
                      Add
                    </button>
                  </div>
                  {youtubeChannels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {youtubeChannels.map(ch => (
                        <span key={ch} className="flex items-center gap-1.5 bg-raised text-body text-xs px-3 py-1.5 rounded-full">
                          🎬 {ch.length > 30 ? ch.slice(0, 30) + "…" : ch}
                          <button type="button" onClick={() => setYoutubeChannels(prev => prev.filter(c => c !== ch))}
                            className="text-muted hover:text-body leading-none ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Reddit Communities ── */}
                <div>
                  <p className="text-[11px] font-medium text-muted mb-3">
                    Reddit communities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REDDIT_CHIPS.map(sub => {
                      const on = redditCommunities.includes(sub);
                      return (
                        <button key={sub} type="button"
                          onClick={() => setRedditCommunities(prev =>
                            prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                          )}
                          className={`text-sm px-3.5 py-2 rounded-full border font-medium transition-all ${
                            on
                              ? "text-card border-transparent"
                              : "bg-card text-body border-ink/10 hover:border-ink/30"
                          }`}
                          style={on ? { background: "#1f1b16" } : {}}>
                          r/{sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────── STEP 3: LENS ────────────────────────── */}
            {step === 3 && (
              <div className="px-7 py-8">
                <h2 className="text-2xl font-medium tracking-tight text-ink mb-1.5">
                  Tell Neo who you are
                </h2>
                <p className="text-[13px] text-muted mb-7">
                  Answer four quick questions — Neo builds your lens automatically.
                </p>

                <div className="space-y-5">
                  {/* Row 1: Role */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-medium text-body whitespace-nowrap">I am a</span>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      className="flex-1 min-w-[160px] h-10 px-3.5 pr-8 rounded-control border border-ink/10 text-sm font-medium text-ink bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all appearance-none">
                      <option value="">select your role…</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Row 2: Location */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-medium text-body whitespace-nowrap">based in</span>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Lagos, London, Nairobi…"
                      className="flex-1 min-w-[200px] h-10 px-3.5 rounded-control border border-ink/10 text-sm font-medium text-ink bg-raised placeholder:text-muted placeholder:font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                  </div>

                  {/* Row 3: Caring */}
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-base font-medium text-body whitespace-nowrap pt-2">I care most about</span>
                    <textarea value={caring}
                      onChange={e => { setCaring(e.target.value); setCaringTouched(true); }}
                      rows={2}
                      placeholder="AI, African startups, climate tech…"
                      className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-control border border-ink/10 text-sm font-medium text-ink bg-raised placeholder:text-muted placeholder:font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all resize-none leading-relaxed" />
                  </div>

                  {/* Row 4: Goal */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-medium text-body whitespace-nowrap">I want Neo to help me</span>
                    <select value={goal} onChange={e => setGoal(e.target.value)}
                      className="flex-1 min-w-[200px] h-10 px-3.5 pr-8 rounded-control border border-ink/10 text-sm font-medium text-ink bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all appearance-none">
                      <option value="">select your goal…</option>
                      {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {/* Generated lens */}
                <div className="mt-7">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium text-muted">
                      Your lens — edit freely
                    </p>
                    {generatedLens && lens !== generatedLens && (
                      <button type="button" onClick={() => setLens(generatedLens)}
                        className="text-[11px] text-muted hover:text-body transition-colors">
                        Reset ↺
                      </button>
                    )}
                  </div>
                  <textarea value={lens} onChange={e => setLens(e.target.value)} rows={3}
                    placeholder="Neo will build this from your answers above…"
                    className="w-full px-4 py-3 rounded-control border border-ink/10 text-sm text-ink placeholder:text-muted bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 resize-none leading-relaxed transition-all"
                    style={{ minHeight: 88 }} />
                </div>

                {/* Briefing style */}
                <div className="mt-8 pt-7 border-t border-ink/[0.08]">
                  <p className="text-[11px] font-medium text-muted mb-1">
                    How should Neo write for you?
                  </p>
                  <p className="text-[12px] text-muted mb-4">Pick one writing style.</p>
                  <div className="space-y-2.5">
                    {BRIEFING_STYLES.map(s => {
                      const on = briefingStyle === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => setBriefingStyle(s.id)}
                          className={`w-full flex items-start gap-4 p-4 rounded-control border text-left transition-all duration-150 ${
                            on
                              ? "border-neutral-900 bg-ink/[0.03] shadow-soft"
                              : "border-ink/10 bg-card hover:border-ink/20 hover:bg-raised"
                          }`}>
                          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-medium text-ink">{s.title}</span>
                              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                                on ? "bg-ink border-neutral-900" : "border-ink/20"
                              }`}>
                                {on && <span className="text-card text-[9px] leading-none">✓</span>}
                              </div>
                            </div>
                            <p className="text-[12px] text-body leading-snug">{s.description}</p>
                            <p className="text-[10px] text-muted mt-1 italic">{s.tag}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Expertise toggle */}
                  <div className="mt-5">
                    <p className="text-[11px] font-medium text-muted mb-3">
                      Your familiarity with the topics
                    </p>
                    <div className="flex gap-2">
                      {(["expert", "beginner"] as const).map(lvl => (
                        <button key={lvl} type="button" onClick={() => setExpertiseLevel(lvl)}
                          className={`flex-1 py-2.5 rounded-control border text-sm font-medium transition-all ${
                            expertiseLevel === lvl
                              ? "text-card border-transparent"
                              : "bg-card text-body border-ink/10 hover:border-ink/20"
                          }`}
                          style={expertiseLevel === lvl ? { background: "#1f1b16" } : {}}>
                          {lvl === "expert" ? "Expert — use jargon freely" : "Beginner — explain terms"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Anthropic key */}
                <div className="mt-6">
                  <label htmlFor="anthropic-key" className="block text-[13px] font-medium text-ink mb-1">Your Anthropic API key</label>
                  <p className="text-[12px] leading-[18px] text-body mb-2">
                    Neo writes your briefings with your own key, so you pay Anthropic directly, usually a few cents per briefing.
                    Create one at{" "}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">console.anthropic.com</a>.
                    It is verified, then stored encrypted and never shown again.
                  </p>
                  <input id="anthropic-key" type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full h-10 px-3.5 rounded-control border border-ink/10 font-mono text-[13px] bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                </div>

                {/* Delivery email (quiet) */}
                {!deliveryEmail && (
                  <div className="mt-5">
                    <p className="text-[11px] font-medium text-muted mb-2">
                      Briefing delivery email
                    </p>
                    <input type="email" value={deliveryEmail} onChange={e => setDeliveryEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-10 px-3.5 rounded-control border border-ink/10 text-sm bg-raised focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all" />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation footer */}
          <div className="px-7 pb-7 pt-5 border-t border-ink/[0.08]">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-control px-3.5 py-2.5 mb-4">
                <span className="text-red-400 mt-px flex-shrink-0 text-xs">✕</span>
                <p className="text-xs text-red-600 leading-snug">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              {step > 1 ? (
                <button type="button" onClick={back}
                  className="h-10 px-4 text-sm font-medium text-body hover:text-ink hover:bg-raised rounded-control transition-colors">
                  ← Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={advance}
                  className="h-10 px-6 text-card text-sm font-medium rounded-control transition-all hover:opacity-90"
                  style={{ background: "#1f1b16" }}>
                  Continue
                </button>
              ) : (
                <button type="button" onClick={handleComplete} disabled={loading}
                  className="h-10 px-6 text-card text-sm font-medium rounded-control transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#1f1b16" }}>
                  {loading ? "Saving…" : "Complete setup"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
