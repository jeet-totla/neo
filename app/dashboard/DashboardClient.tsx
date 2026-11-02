"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import {
  IconNewspaper, IconMic, IconVideo, IconHistory, IconSettings, IconLogOut, IconRefresh,
  IconCopy, IconCheck, IconArrowRight, IconExternal, IconPlus, IconX, IconClock,
} from "@/components/Icons";
import { ApiKeyField } from "@/components/ApiKeyField";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { TOPICS, PUBLICATIONS, PODCASTS } from "@/lib/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

type View  = "today" | "history" | "settings";
type Depth = "scan" | "read" | "deep";

interface Article { title: string; source: string; url: string; type?: string }
interface Sources {
  publications?: string[]; substacks?: string[]; x_handles?: string[];
  podcasts?: string[]; youtube_channels?: string[]; reddit_communities?: string[];
}
interface Profile {
  topics: string[]; sources: Sources; lens: string; delivery_email: string;
  briefing_style?: string; expertise_level?: string;
}
interface Briefing { id: string; content: string; created_at: string; articles_used?: Article[] }
interface Props {
  userEmail: string; profile: Profile | null;
  pastBriefings: Briefing[]; latestBriefing: Briefing | null;
  keyStatus: KeyStatus | null;
}

const DEPTHS: { key: Depth; label: string; hint: string }[] = [
  { key: "scan", label: "Scan", hint: "8 stories, two sentences each" },
  { key: "read", label: "Read", hint: "12 stories with context" },
  { key: "deep", label: "Deep", hint: "5 stories, full analysis" },
];

const VOICES = [
  { id: "analyst",    label: "Analyst",    hint: "Straight to implications" },
  { id: "journalist", label: "Journalist", hint: "Clear context, balanced" },
  { id: "advisor",    label: "Advisor",    hint: "Fewer stories, your field only" },
];

const STAGES = ["Collecting your sources", "Reading the last 24 hours", "Writing your briefing"];

// ─── Parsing ──────────────────────────────────────────────────────────────────

interface Story { kind: "article" | "podcast" | "video"; source: string; ago: string; paragraphs: string[] }
interface Section { header: string; stories: Story[] }

const ATTR = /^(?:📰|🎙️?|🎬)\s*(SOURCE|PODCAST|VIDEO):\s*(.+?)\s*[·•|-]\s*(.+)$/i;

function parseBriefing(raw: string) {
  let text = raw.trim();
  let takeaway = "";
  const tk = text.match(/\*{0,2}Today['’]?s signal:?\*{0,2}:?\s*([\s\S]+)$/i);
  if (tk) { takeaway = tk[1].replace(/\*\*/g, "").trim(); text = text.slice(0, tk.index).trim(); }

  const parts = text.split(/\n(?=## )/);
  const first = parts[0].startsWith("## ") ? "" : parts[0];
  const intro = first.trim();
  const rest  = parts[0].startsWith("## ") ? parts : parts.slice(1);

  const sections: Section[] = rest.map(part => {
    const nl = part.indexOf("\n");
    const header = (nl === -1 ? part : part.slice(0, nl)).replace(/^##\s*/, "").trim();
    const body = nl === -1 ? "" : part.slice(nl + 1).trim();
    const stories: Story[] = [];
    for (const para of body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)) {
      const lines = para.split("\n");
      const m = lines[0].replace(/\*\*/g, "").trim().match(ATTR);
      if (m) {
        const kind = /PODCAST/i.test(m[1]) ? "podcast" : /VIDEO/i.test(m[1]) ? "video" : "article";
        const remainder = lines.slice(1).join(" ").trim();
        stories.push({ kind, source: m[2].trim(), ago: m[3].trim(), paragraphs: remainder ? [remainder] : [] });
      } else if (stories.length) {
        stories[stories.length - 1].paragraphs.push(para);
      } else {
        stories.push({ kind: "article", source: "", ago: "", paragraphs: [para] });
      }
    }
    return { header, stories };
  }).filter(s => s.stories.length);

  return { intro, sections, takeaway };
}

function splitAction(text: string): { body: string; action: string | null } {
  const sentences = text.trim().split(/\. (?=[A-Z])/);
  if (sentences.length < 2) return { body: text.trim(), action: null };
  const last = sentences[sentences.length - 1].trim();
  if (last.length >= 15 && last.length <= 280) {
    return { body: sentences.slice(0, -1).join(". ") + ".", action: last.endsWith(".") ? last : last + "." };
  }
  return { body: text.trim(), action: null };
}

function bold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-medium text-ink">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

const fmtLong  = (d = new Date()) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const fmtShort = (iso: string)   => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime  = (iso: string)   => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
function plain(raw: string) { return raw.replace(/\*\*/g, "").replace(/^## /gm, ""); }

// ─── Small pieces ─────────────────────────────────────────────────────────────

function KindIcon({ kind }: { kind: Story["kind"] }) {
  return kind === "podcast" ? <IconMic size={14} /> : kind === "video" ? <IconVideo size={14} /> : <IconNewspaper size={14} />;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`h-8 rounded-[8px] px-3 text-[13px] border transition-[background-color,border-color,color] duration-150 ease-neo ${
        active ? "bg-ink text-card border-ink" : "bg-card text-body border-ink/10 hover:border-ink/30"
      }`}>
      {children}
    </button>
  );
}

function BriefingView({ briefing, lens }: { briefing: Briefing; lens: string }) {
  const { intro, sections, takeaway } = useMemo(() => parseBriefing(briefing.content), [briefing.content]);
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const articles = briefing.articles_used ?? [];
  let n = 0;

  async function copy() {
    try { await navigator.clipboard.writeText(plain(briefing.content)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="dateline">{fmtShort(briefing.created_at)} · {fmtTime(briefing.created_at)}{articles.length ? ` · ${articles.length} ${articles.length === 1 ? "story" : "stories"}` : ""}</p>
        <button onClick={copy} className="btn-secondary btn-sm">
          {copied ? <><IconCheck /> Copied</> : <><IconCopy /> Copy</>}
        </button>
      </div>

      {lens && <p className="text-[13px] leading-[20px] text-muted mb-4">Written for: <span className="text-body">{lens}</span></p>}
      {intro && <p className="font-display text-[26px] leading-[32px] tracking-[-0.01em] text-ink mb-10">{bold(intro)}</p>}

      <div className="space-y-12">
        {sections.map(sec => (
          <section key={sec.header}>
            <h2 className="text-[13px] leading-[16px] text-muted mb-4 pb-3 border-b border-ink/[0.08]">{sec.header}</h2>
            <div className="space-y-3">
              {sec.stories.map((st, i) => {
                n += 1;
                const last = st.paragraphs.length - 1;
                const { body: lastBody, action } = last >= 0 ? splitAction(st.paragraphs[last]) : { body: "", action: null };
                const paras = st.paragraphs.map((p, j) => (j === last ? lastBody : p));
                return (
                  <div key={i} className="surface rounded-card p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-muted mb-3">
                      <span className="dateline w-5">{String(n).padStart(2, "0")}</span>
                      {st.source && (
                        <span className="dateline inline-flex items-center gap-1.5">
                          <KindIcon kind={st.kind} /> {st.source}{st.ago ? ` · ${st.ago}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 text-[15px] leading-[24px] text-body">
                      {paras.map((p, j) => <p key={j}>{bold(p)}</p>)}
                    </div>
                    {action && (
                      <p className="mt-4 pt-4 border-t border-ink/[0.08] text-[14px] leading-[22px] text-ink flex gap-2">
                        <IconArrowRight className="mt-[3px] flex-shrink-0 text-accent" /> <span>{bold(action)}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {takeaway && (
        <div className="mt-12 rounded-panel bg-ink text-card p-6 sm:p-8">
          <p className="dateline !text-card/50 mb-3">Today&apos;s signal</p>
          <p className="font-display text-[24px] sm:text-[28px] leading-[1.25] tracking-[-0.01em]">{bold(takeaway)}</p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowSources(s => !s)} className="text-[13px] text-body hover:text-ink transition-colors duration-150">
            {showSources ? "Hide" : "Show"} the {articles.length} sources behind this briefing
          </button>
          {showSources && (
            <ul className="mt-4 divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
              {articles.map((a, i) => (
                <li key={i}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 py-3 text-[14px] leading-[20px] text-body hover:text-ink transition-colors duration-150">
                    <span><span className="dateline mr-2">{a.source}</span>{a.title}</span>
                    <IconExternal className="mt-[3px] flex-shrink-0 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

function Generating() {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const stage = Math.min(STAGES.length - 1, Math.floor(t / 12));
  const pct = Math.min(0.94, t / 48);
  return (
    <div className="surface rounded-card p-6" role="status" aria-live="polite">
      <p className="text-[15px] text-ink mb-4">{STAGES[stage]}</p>
      <div className="h-1 rounded-full bg-raised overflow-hidden">
        <div className="h-full w-full origin-left bg-ink transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <p className="dateline mt-3">This takes about 40 seconds</p>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsCard({ title, hint, onSave, saving, saved, children }: {
  title: string; hint?: string; onSave: () => void; saving: boolean; saved: boolean; children: React.ReactNode;
}) {
  return (
    <section className="surface rounded-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[16px] font-medium leading-[24px]">{title}</h2>
          {hint && <p className="text-[13px] leading-[20px] text-body">{hint}</p>}
        </div>
        <button onClick={onSave} disabled={saving} className="btn-primary btn-sm flex-shrink-0">
          {saving ? "Saving" : saved ? <><IconCheck /> Saved</> : "Save"}
        </button>
      </div>
      {children}
    </section>
  );
}

type KeyStatus = { provider: ProviderId; last4: string };

function Settings({ profile, onProfile, keyStatus, onKey }: { profile: Profile; onProfile: (p: Profile) => void; keyStatus: KeyStatus | null; onKey: (k: KeyStatus | null) => void }) {
  const [topics, setTopics] = useState<string[]>(profile.topics ?? []);
  const [pubs, setPubs]     = useState<string[]>(profile.sources?.publications ?? []);
  const [pods, setPods]     = useState<string[]>(profile.sources?.podcasts ?? []);
  const [subs, setSubs]     = useState<string[]>(profile.sources?.substacks ?? []);
  const [subInput, setSubInput] = useState("");
  const [lens, setLens]     = useState(profile.lens ?? "");
  const [voice, setVoice]   = useState(profile.briefing_style ?? "analyst");
  const [level, setLevel]   = useState(profile.expertise_level ?? "expert");
  const [email, setEmail]   = useState(profile.delivery_email ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved]   = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyProvider, setKeyProvider] = useState<ProviderId>(keyStatus?.provider ?? "gemini");
  const [keyBusy, setKeyBusy]   = useState(false);
  const [keyMsg, setKeyMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  async function saveKey() {
    setKeyBusy(true); setKeyMsg(null);
    try {
      const res = await fetch("/api/api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: keyInput, provider: keyProvider }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Couldn't save the key.");
      onKey({ provider: json.provider, last4: json.last4 }); setKeyInput(""); setKeyMsg({ ok: true, text: "Key saved." });
    } catch (e) { setKeyMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save the key." }); }
    finally { setKeyBusy(false); }
  }
  async function removeKey() {
    setKeyBusy(true); setKeyMsg(null);
    try {
      const res = await fetch("/api/api-key", { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't remove the key.");
      onKey(null); setKeyMsg({ ok: true, text: "Key removed." });
    } catch (e) { setKeyMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't remove the key." }); }
    finally { setKeyBusy(false); }
  }

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  async function save(section: string, fields: Partial<Profile>) {
    setSaving(section); setError(null); setSaved(null);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again.");
      const { error: err } = await supabase.from("profiles").update(fields).eq("id", user.id);
      if (err) throw new Error(err.message);
      onProfile({ ...profile, ...fields });
      setSaved(section);
      setTimeout(() => setSaved(s => (s === section ? null : s)), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  function addSub() {
    let v = subInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) v = v.includes(".") ? `https://${v}` : `https://${v}.substack.com`;
    if (!subs.includes(v)) setSubs([...subs, v]);
    setSubInput("");
  }

  const src = (extra: Partial<Sources>): Partial<Profile> => ({ sources: { ...profile.sources, ...extra } });

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-control border border-bad/20 bg-bad/[0.05] px-3.5 py-2.5 text-[13px] text-bad">{error}</p>}

      <section className="surface rounded-card p-5 sm:p-6">
        <h2 className="text-[16px] font-medium leading-[24px]">AI provider key</h2>
        <p className="text-[13px] leading-[20px] text-body mb-4">
          Neo writes your briefings with your own key, so the AI cost is yours. Pick the provider you already use.
        </p>
        {keyStatus && <p className="dateline mb-3">Using {PROVIDERS[keyStatus.provider].label}, key ending in {keyStatus.last4}</p>}
        <ApiKeyField id="settings-key" provider={keyProvider} onProvider={setKeyProvider} value={keyInput} onValue={setKeyInput} />
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={saveKey} disabled={keyBusy || !keyInput.trim()} className="btn-primary">{keyBusy ? "Checking" : keyStatus ? "Replace key" : "Save key"}</button>
          {keyStatus && <button type="button" onClick={removeKey} disabled={keyBusy} className="text-[13px] text-body hover:text-ink underline underline-offset-2 transition-colors duration-150">Remove key</button>}
        </div>
        {keyMsg && <p role="status" className={`mt-3 text-[13px] ${keyMsg.ok ? "text-good" : "text-bad"}`}>{keyMsg.text}</p>}
      </section>

      <SettingsCard title="Who you are" hint="Neo reads every story through this. The more specific, the sharper it gets."
        onSave={() => save("lens", { lens })} saving={saving === "lens"} saved={saved === "lens"}>
        <textarea value={lens} onChange={e => setLens(e.target.value)} rows={4} className="field !h-auto py-3 leading-[22px]"
          placeholder="Founder of a seed-stage fintech in Lagos, raising a Series A next year" />
      </SettingsCard>

      <SettingsCard title="Topics" onSave={() => save("topics", { topics })} saving={saving === "topics"} saved={saved === "topics"}>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => <Chip key={t} active={topics.includes(t)} onClick={() => toggle(topics, setTopics, t)}>{t}</Chip>)}
        </div>
      </SettingsCard>

      <SettingsCard title="Publications" hint="Neo reads the latest from each one."
        onSave={() => save("pubs", src({ publications: pubs }))} saving={saving === "pubs"} saved={saved === "pubs"}>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PUBLICATIONS).map(p => <Chip key={p} active={pubs.includes(p)} onClick={() => toggle(pubs, setPubs, p)}>{p}</Chip>)}
        </div>
      </SettingsCard>

      <SettingsCard title="Newsletters" hint="Any Substack works. Paste its name or address."
        onSave={() => save("subs", src({ substacks: subs }))} saving={saving === "subs"} saved={saved === "subs"}>
        <div className="flex gap-2 mb-3">
          <input value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }}
            placeholder="importai.substack.com" className="field" />
          <button type="button" onClick={addSub} className="btn-secondary flex-shrink-0" aria-label="Add newsletter"><IconPlus /></button>
        </div>
        {subs.length === 0 ? <p className="text-[13px] text-muted">No newsletters yet.</p> : (
          <ul className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {subs.map(s => (
              <li key={s} className="flex items-center justify-between gap-3 py-2.5 text-[14px] text-body">
                <span className="truncate font-mono text-[12px]">{s.replace(/^https?:\/\//, "")}</span>
                <button onClick={() => setSubs(subs.filter(x => x !== s))} aria-label={`Remove ${s}`} className="text-muted hover:text-ink transition-colors duration-150"><IconX /></button>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Podcasts" onSave={() => save("pods", src({ podcasts: pods }))} saving={saving === "pods"} saved={saved === "pods"}>
        <div className="flex flex-wrap gap-2">
          {PODCASTS.map(p => <Chip key={p} active={pods.includes(p)} onClick={() => toggle(pods, setPods, p)}>{p}</Chip>)}
        </div>
      </SettingsCard>

      <SettingsCard title="Voice" onSave={() => save("voice", { briefing_style: voice, expertise_level: level })} saving={saving === "voice"} saved={saved === "voice"}>
        <div className="grid sm:grid-cols-3 gap-2 mb-4">
          {VOICES.map(v => (
            <button key={v.id} type="button" onClick={() => setVoice(v.id)} aria-pressed={voice === v.id}
              className={`text-left rounded-control border p-3 transition-[background-color,border-color] duration-150 ease-neo ${voice === v.id ? "border-ink bg-raised" : "border-ink/10 hover:border-ink/30"}`}>
              <span className="block text-[14px] font-medium">{v.label}</span>
              <span className="block text-[13px] leading-[18px] text-body">{v.hint}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Chip active={level === "expert"} onClick={() => setLevel("expert")}>I know the industry</Chip>
          <Chip active={level === "beginner"} onClick={() => setLevel("beginner")}>Explain the terms</Chip>
        </div>
      </SettingsCard>

      <SettingsCard title="Delivery" hint="Your briefing is emailed here every morning."
        onSave={() => save("email", { delivery_email: email })} saving={saving === "email"} saved={saved === "email"}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" placeholder="you@example.com" />
      </SettingsCard>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardClient({ userEmail, profile: init, latestBriefing, pastBriefings, keyStatus: initKey }: Props) {
  const router = useRouter();
  const [view, setView]             = useState<View>("today");
  const [depth, setDepth]           = useState<Depth>("read");
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [notice, setNotice]         = useState<string | null>(null);
  const [profile, setProfile]       = useState<Profile | null>(init);
  const [keyStatus, setKeyStatus]   = useState<KeyStatus | null>(initKey);
  const [current, setCurrent]       = useState<Briefing | null>(latestBriefing);
  const [history, setHistory]       = useState<Briefing[]>(latestBriefing ? [latestBriefing, ...pastBriefings] : pastBriefings);
  const topRef = useRef<HTMLDivElement>(null);

  async function generate() {
    setGenerating(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/generate-briefing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depth_mode: depth }),
      });
      // A timeout returns an HTML page, not JSON
      const json = await res.json().catch(() => null);
      if (!json) throw new Error("That took too long. Try the Scan depth, or try again in a moment.");
      if (!res.ok) throw new Error(json.error ?? "Could not generate a briefing.");
      const b: Briefing = json.briefing;
      setCurrent(b);
      setHistory(h => [b, ...h.filter(x => x.id !== b.id)].slice(0, 30));
      setView("today");
      if (json.emailError) setNotice("Your briefing is ready here, but the email didn't send. Check your delivery address in settings.");
      else if (json.emailed) setNotice(`Also sent to ${profile?.delivery_email ?? userEmail}.`);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function signOut() {
    await createBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const NAV: { key: View; label: string; icon: typeof IconHistory }[] = [
    { key: "today",    label: "Today",    icon: IconNewspaper },
    { key: "history",  label: "History",  icon: IconHistory },
    { key: "settings", label: "Settings", icon: IconSettings },
  ];

  const navButton = (n: typeof NAV[number], compact = false) => (
    <button key={n.key} onClick={() => setView(n.key)} aria-current={view === n.key ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-control text-[14px] transition-[background-color,color] duration-150 ease-neo ${compact ? "h-9 px-3" : "h-9 px-3 w-full"} ${
        view === n.key ? "bg-ink/[0.07] text-ink font-medium" : "text-body hover:bg-ink/[0.04] hover:text-ink"}`}>
      <n.icon size={16} /> {n.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-page">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-3 top-3 bottom-3 w-[240px] glass rounded-panel flex-col p-3 z-20">
        <div className="px-3 pt-3 pb-6"><Logo href="/dashboard" /></div>
        <nav className="space-y-0.5" aria-label="Main">{NAV.map(n => navButton(n))}</nav>
        <div className="mt-auto px-3 pt-4 border-t border-ink/[0.08]">
          <p className="dateline truncate mb-2" title={userEmail}>{userEmail}</p>
          <button onClick={signOut} className="flex items-center gap-2 text-[13px] text-body hover:text-ink transition-colors duration-150">
            <IconLogOut /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-20 glass rounded-none border-x-0 border-t-0">
        <div className="h-14 px-5 flex items-center justify-between">
          <Logo href="/dashboard" />
          <button onClick={signOut} className="text-[13px] text-body hover:text-ink transition-colors duration-150">Log out</button>
        </div>
        <nav className="px-4 pb-2 flex gap-1" aria-label="Main">{NAV.map(n => navButton(n, true))}</nav>
      </header>

      <main className="md:pl-[264px]">
        <div ref={topRef} className="max-w-[760px] mx-auto px-5 sm:px-8 pt-8 md:pt-12 pb-24">
          {view === "today" && (
            <div className="rise">
              <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.08] tracking-[-0.02em]">{fmtLong()}</h1>

              <div className="mt-8 mb-8 flex flex-wrap items-center justify-between gap-4">
                <div role="radiogroup" aria-label="Depth" className="inline-flex rounded-control bg-raised p-1">
                  {DEPTHS.map(d => (
                    <button key={d.key} role="radio" aria-checked={depth === d.key} onClick={() => setDepth(d.key)} title={d.hint}
                      className={`h-8 px-4 rounded-[8px] text-[13px] transition-[background-color,color] duration-150 ease-neo ${
                        depth === d.key ? "bg-card text-ink shadow-soft font-medium" : "text-body hover:text-ink"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <button onClick={generate} disabled={generating || !keyStatus} className="btn-primary">
                  <IconRefresh /> {current ? "Generate a new briefing" : "Generate your first briefing"}
                </button>
              </div>

              {!keyStatus && (
                <div className="mb-6 rounded-card border border-accent/25 bg-accent-soft p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[14px] leading-[22px] text-ink max-w-[34rem]">
                    Add an AI API key in Settings to start generating briefings. Gemini has a free tier.
                  </p>
                  <button onClick={() => setView("settings")} className="btn-primary btn-sm">Add key</button>
                </div>
              )}

              {error && <p role="alert" className="mb-6 rounded-control border border-bad/20 bg-bad/[0.05] px-3.5 py-2.5 text-[13px] leading-[18px] text-bad">{error}</p>}
              {notice && !generating && <p role="status" className="mb-6 rounded-control border border-ink/10 bg-card px-3.5 py-2.5 text-[13px] leading-[18px] text-body">{notice}</p>}

              {generating ? <Generating /> : current ? (
                <BriefingView briefing={current} lens={profile?.lens ?? ""} />
              ) : (
                <div className="surface rounded-panel p-8 sm:p-12 text-center">
                  <IconClock size={20} className="mx-auto text-muted mb-4" />
                  <h2 className="font-display text-[28px] leading-[1.15] mb-2">No briefing yet</h2>
                  <p className="text-[15px] leading-[24px] text-body max-w-[26rem] mx-auto">
                    Generate one now and see what Neo writes for you. After that it arrives in your inbox every morning.
                  </p>
                </div>
              )}
            </div>
          )}

          {view === "history" && (
            <div className="rise">
              <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.08] tracking-[-0.02em] mb-8">History</h1>
              {history.length === 0 ? (
                <p className="text-[15px] text-body">Your past briefings will show up here.</p>
              ) : (
                <ul className="surface rounded-card divide-y divide-ink/[0.08]">
                  {history.map(b => {
                    const first = parseBriefing(b.content).sections.map(s => s.header).slice(0, 3).join(" · ");
                    return (
                      <li key={b.id}>
                        <button onClick={() => { setCurrent(b); setNotice(null); setView("today"); }}
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-raised/60 transition-colors duration-150 first:rounded-t-card last:rounded-b-card">
                          <span className="min-w-0">
                            <span className="block text-[15px] font-medium">{new Date(b.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                            <span className="block text-[13px] leading-[20px] text-body truncate">{first || "Briefing"}</span>
                          </span>
                          <span className="dateline flex-shrink-0">{fmtTime(b.created_at)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {view === "settings" && profile && (
            <div className="rise">
              <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.08] tracking-[-0.02em] mb-8">Settings</h1>
              <Settings profile={profile} onProfile={setProfile} keyStatus={keyStatus} onKey={setKeyStatus} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
