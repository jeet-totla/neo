import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { sendBriefingEmail } from "@/lib/mailer";
import { PUBLICATIONS } from "@/lib/catalog";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Depth      = "scan" | "read" | "deep";
type StoryType  = "article" | "podcast" | "video";

export interface Story {
  title:         string;
  description:   string;
  source:        string;
  url:           string;
  type:          StoryType;
  published_at?: string;
  topic?:        string;    // user-topic this was fetched for
  hn_score?:     number;
  reddit_score?: number;
  is_user_pub?:  boolean;   // from user's explicitly selected publications
  listen_url?:   string;
}

interface ScoredStory extends Story { rank_score: number }

// ── Config ────────────────────────────────────────────────────────────────────

export const DEPTH_CFG: Record<Depth, { stories: number; instruction: string }> = {
  scan: { stories: 8,  instruction: "2 punchy sentences per story. No padding." },
  read: { stories: 12, instruction: "3–4 sentences per story with context and implications." },
  deep: { stories: 5,  instruction: "A full analytical paragraph per story — second-order effects, what this means for this specific person." },
};

// ── RSS Library (publications) ────────────────────────────────────────────────

const RSS_LIBRARY: Record<string, string> = {
  "TechCrunch":     "https://techcrunch.com/feed/",
  "The Verge":      "https://www.theverge.com/rss/index.xml",
  "Wired":          "https://www.wired.com/feed/rss",
  "Reuters":        "https://feeds.reuters.com/reuters/businessNews",
  "BBC":            "http://feeds.bbci.co.uk/news/business/rss.xml",
  "Axios":          "https://api.axios.com/feed/",
  "Semafor":        "https://www.semafor.com/feed",
  "TechCabal":      "https://techcabal.com/feed/",
  "Rest of World":  "https://restofworld.org/feed/",
  "Hacker News":    "https://hnrss.org/frontpage",
  "Product Hunt":   "https://www.producthunt.com/feed",
  "MIT Tech Review":"https://www.technologyreview.com/feed/",
  "The Atlantic":   "https://www.theatlantic.com/feed/all/",
  "Foreign Policy": "https://foreignpolicy.com/feed/",
  "Disrupt Africa": "https://disrupt-africa.com/feed/",
  "African Business":"https://african.business/feed",
  "The Economist":  "https://www.economist.com/rss/the_world_this_week_rss.xml",
};

// ── Podcast RSS ───────────────────────────────────────────────────────────────

const PODCAST_RSS: Record<string, string> = {
  "All-In":               "https://feeds.megaphone.fm/all-in-with-chamath-jason-sacks-friedberg",
  "My First Million":     "https://feeds.megaphone.fm/my-first-million",
  "Acquired":             "https://acquired.fm/rss",
  "How I Built This":     "https://feeds.npr.org/510313/podcast.xml",
  "The Prof G Pod":       "https://feeds.megaphone.fm/prof-g-markets",
  "Unchained":            "https://unchained.libsyn.com/rss",
  "African Tech Roundup": "https://feeds.buzzsprout.com/1097978.rss",
  "Bankless":             "https://feeds.megaphone.fm/bankless",
  "Invest Like The Best": "https://feeds.megaphone.fm/invest-like-the-best",
  "20VC":                 "https://feeds.megaphone.fm/twenty-minute-vc",
};

// ── Topic → Subreddits ────────────────────────────────────────────────────────

const TOPIC_SUBREDDITS: Record<string, string[]> = {
  "AI & Machine Learning":   ["artificial", "MachineLearning", "technology"],
  "Startups & VC":           ["startups", "Entrepreneur", "venturecapital"],
  "African Tech":            ["africa", "technology"],
  "Crypto & Web3":           ["CryptoCurrency", "ethereum", "Bitcoin"],
  "Business & Markets":      ["investing", "stocks", "SecurityAnalysis"],
  "Climate & Energy":        ["ClimateActionPlan", "renewable"],
  "Health & Science":        ["medicine", "science"],
  "Geopolitics":             ["geopolitics", "worldnews"],
  "Sports Business":         ["sports", "nba", "soccer"],
  "Media & Creator Economy": ["marketing", "socialmedia"],
  "Personal Finance":        ["personalfinance", "investing"],
  "Real Estate":             ["realestate"],
  "Politics & Policy":       ["politics", "worldnews"],
  "Culture & Society":       ["OutOfTheLoop", "worldnews"],
};

const HN_TOPICS = new Set([
  "AI & Machine Learning", "Startups & VC",
  "Media & Creator Economy", "Business & Markets", "Crypto & Web3",
]);

// ── XML parser (shared, handles RSS 2.0 + Atom) ───────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes:    false,
  attributeNamePrefix: "@_",
  isArray:             (name) => name === "item" || name === "entry",
});

interface FeedItem {
  title:         string;
  link:          string;
  pubDate?:      string;
  description?:  string;
  sourceName?:   string;
  enclosureUrl?: string;
  author?:       string;
}

function parseFeed(xml: string): FeedItem[] {
  try {
    const p = xmlParser.parse(xml);
    // RSS 2.0
    const rssChannel = p?.rss?.channel;
    if (rssChannel) {
      const items: unknown[] = rssChannel.item ?? [];
      return items.map(normaliseRssItem);
    }
    // Atom
    const atomFeed = p?.feed;
    if (atomFeed) {
      const entries: unknown[] = atomFeed.entry ?? [];
      return entries.map(normaliseAtomEntry);
    }
    return [];
  } catch {
    return [];
  }
}

function normaliseRssItem(raw: unknown): FeedItem {
  const i = raw as Record<string, unknown>;
  const title    = sv(i.title);
  const link     = sv(i.link) || (obj(i.link) ? sv((i.link as Record<string, unknown>)["@_href"]) : "");
  const pubDate  = sv(i.pubDate) || sv(i.published);
  const desc     = stripHtml(sv(i.description) || sv(i.summary) || sv(i["content:encoded"]));
  const srcName  = obj(i.source) ? sv((i.source as Record<string, unknown>)["#text"]) : sv(i.source);
  const encUrl   = obj(i.enclosure) ? sv((i.enclosure as Record<string, unknown>)["@_url"]) : undefined;
  return { title, link, pubDate: pubDate || undefined, description: desc.slice(0, 300), sourceName: srcName || undefined, enclosureUrl: encUrl };
}

function normaliseAtomEntry(raw: unknown): FeedItem {
  const e = raw as Record<string, unknown>;
  const title = sv(e.title) || (obj(e.title) ? sv((e.title as Record<string, unknown>)["#text"]) : "");

  let link = "";
  if (typeof e.link === "string") {
    link = e.link;
  } else if (Array.isArray(e.link)) {
    const alt = (e.link as Array<Record<string, unknown>>).find(l => !l["@_rel"] || l["@_rel"] === "alternate");
    link = alt ? sv(alt["@_href"]) : "";
  } else if (obj(e.link)) {
    link = sv((e.link as Record<string, unknown>)["@_href"]);
  }

  const pubDate = sv(e.published) || sv(e.updated);
  const desc    = stripHtml(sv(e.summary) || (obj(e.content) ? sv((e.content as Record<string, unknown>)["#text"]) : sv(e.content)));
  const author  = obj(e.author) ? sv((e.author as Record<string, unknown>).name) : sv(e.author);

  return { title, link, pubDate: pubDate || undefined, description: desc.slice(0, 300), author: author || undefined };
}

function sv(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}
function obj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .trim();
}

// ── Source 1: Google News RSS ─────────────────────────────────────────────────

async function fetchGoogleNews(topics: string[]): Promise<Story[]> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const settled = await Promise.allSettled(
    topics.map(async (topic): Promise<Story[]> => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const items = parseFeed(await res.text());
      return items
        .filter(it => it.pubDate && withinCutoff(it.pubDate, cutoff))
        .slice(0, 5)
        .map(it => ({
          title:        it.title,
          description:  it.description ?? "",
          source:       it.sourceName ?? "Google News",
          url:          it.link,
          type:         "article" as StoryType,
          published_at: toIso(it.pubDate),
          topic,
        }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 2: NewsAPI (when key available) ────────────────────────────────────

async function fetchNewsAPI(topics: string[]): Promise<Story[]> {
  if (!process.env.NEWSAPI_KEY || !topics.length) return [];
  const from24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const settled = await Promise.allSettled(
    topics.map(async (topic): Promise<Story[]> => {
      const url =
        `https://newsapi.org/v2/everything` +
        `?q=${encodeURIComponent(topic)}` +
        `&from=${encodeURIComponent(from24h)}` +
        `&sortBy=publishedAt&pageSize=5&language=en` +
        `&apiKey=${process.env.NEWSAPI_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as { articles?: any[] };
      return (json.articles ?? []).map((a: Record<string, unknown>) => ({
        title:        String(a.title ?? "").trim(),
        description:  String(a.description ?? "").slice(0, 250).trim(),
        source:       (a.source as Record<string, string>)?.name ?? "News",
        url:          String(a.url ?? ""),
        type:         "article" as StoryType,
        published_at: String(a.publishedAt ?? "") || undefined,
        topic,
      }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 3: GDELT ───────────────────────────────────────────────────────────

async function fetchGDELT(topics: string[]): Promise<Story[]> {
  const settled = await Promise.allSettled(
    topics.map(async (topic): Promise<Story[]> => {
      const url =
        `https://api.gdeltproject.org/api/v2/doc/doc` +
        `?query=${encodeURIComponent(topic)}&mode=artlist&maxrecords=5&format=json&timespan=1440&sourcelang=english`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as { articles?: any[] };
      return (json.articles ?? []).map((a: Record<string, string>) => ({
        title:        a.title ?? "",
        description:  a.title ?? "",
        source:       a.domain ?? "GDELT",
        url:          a.url ?? "",
        type:         "article" as StoryType,
        published_at: parseGdeltDate(a.seendate),
        topic,
      }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

function parseGdeltDate(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return undefined;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).toISOString();
}

// ── Source 4: Hacker News ─────────────────────────────────────────────────────

async function fetchHackerNews(topics: string[]): Promise<Story[]> {
  if (!topics.some(t => HN_TOPICS.has(t))) return [];
  const cutoffSec = (Date.now() - 24 * 60 * 60 * 1000) / 1000;

  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!idsRes.ok) return [];
    const ids: number[] = await idsRes.json();

    const results = await Promise.allSettled(
      ids.slice(0, 20).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) })
          .then(r => r.json())
      )
    );

    return results
      .filter(r => r.status === "fulfilled")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(r => (r as PromiseFulfilledResult<any>).value)
      .filter(it => it?.time > cutoffSec && (it.score ?? 0) > 100)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(it => ({
        title:        String(it.title ?? ""),
        description:  `Score: ${it.score} · by ${it.by}`,
        source:       "Hacker News",
        url:          it.url ?? `https://news.ycombinator.com/item?id=${it.id}`,
        type:         "article" as StoryType,
        published_at: new Date(it.time * 1000).toISOString(),
        hn_score:     it.score as number,
        topic:        topics.find(t => HN_TOPICS.has(t)),
      }));
  } catch {
    return [];
  }
}

// ── Source 5: Reddit ──────────────────────────────────────────────────────────

async function fetchReddit(topics: string[], userCommunities: string[] = []): Promise<Story[]> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const subreddits = new Set<string>(userCommunities);
  for (const t of topics) {
    for (const s of (TOPIC_SUBREDDITS[t] ?? [])) subreddits.add(s);
  }

  const settled = await Promise.allSettled(
    Array.from(subreddits).map(async (sub): Promise<Story[]> => {
      const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=5`, {
        headers: { "User-Agent": "Neo-Briefing/1.0" },
        signal:  AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as { data?: { children?: any[] } };
      return (json.data?.children ?? [])
        .map((p: { data: Record<string, unknown> }) => p.data)
        .filter(d => (d.score as number) > 200 && (d.created_utc as number) * 1000 > cutoff)
        .slice(0, 2)
        .map(d => ({
          title:        String(d.title ?? ""),
          description:  `${d.score} upvotes · ${d.num_comments} comments`,
          source:       `r/${sub}`,
          url:          `https://reddit.com${d.permalink}`,
          type:         "article" as StoryType,
          published_at: new Date((d.created_utc as number) * 1000).toISOString(),
          reddit_score: d.score as number,
          topic:        topics.find(t => (TOPIC_SUBREDDITS[t] ?? []).includes(sub)),
        }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 6: RSS feeds (publications + substacks) ────────────────────────────

async function fetchRSSAndSubstacks(publications: string[], substacks: string[]): Promise<Story[]> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const feeds: [string, string, boolean][] = [];
  for (const pub of publications) {
    // Use the publication's own feed when we have one, otherwise search news for that site
    const domain = PUBLICATIONS[pub];
    const url = RSS_LIBRARY[pub] ?? (domain
      ? `https://news.google.com/rss/search?q=${encodeURIComponent(`site:${domain} when:1d`)}&hl=en-US&gl=US&ceid=US:en`
      : undefined);
    if (url) feeds.push([url, pub, true]);
  }
  for (const sub of substacks) {
    const feedUrl  = sub.replace(/\/$/, "") + "/feed";
    const host     = (() => { try { return new URL(sub).hostname; } catch { return sub; } })();
    feeds.push([feedUrl, host, false]);
  }

  const settled = await Promise.allSettled(
    feeds.map(async ([feedUrl, sourceName, isUserPub]): Promise<Story[]> => {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const items = parseFeed(await res.text());
      return items
        .filter(it => it.pubDate && withinCutoff(it.pubDate, cutoff))
        .slice(0, 3)
        .map(it => ({
          title:        it.title,
          description:  it.description ?? "",
          source:       sourceName,
          url:          it.link,
          type:         "article" as StoryType,
          published_at: toIso(it.pubDate),
          is_user_pub:  isUserPub,
        }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 7: Podcasts ────────────────────────────────────────────────────────

async function fetchPodcasts(selectedPodcasts: string[]): Promise<Story[]> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const settled = await Promise.allSettled(
    selectedPodcasts
      .filter(p => PODCAST_RSS[p])
      .map(async (name): Promise<Story[]> => {
        const res = await fetch(PODCAST_RSS[name], { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return [];
        const items = parseFeed(await res.text());
        const recent = items.filter(it => it.pubDate && withinCutoff(it.pubDate, cutoff)).slice(0, 1);
        return recent.map(it => {
          const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(name + " " + it.title)}`;
          return {
            title:        it.title,
            description:  it.description?.slice(0, 150) ?? "",
            source:       name,
            url:          it.link || it.enclosureUrl || spotifyUrl,
            type:         "podcast" as StoryType,
            published_at: toIso(it.pubDate),
            listen_url:   spotifyUrl,
          };
        });
      })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 8: YouTube ─────────────────────────────────────────────────────────

async function fetchYouTube(channels: string[]): Promise<Story[]> {
  if (!channels.length) return [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const settled = await Promise.allSettled(
    channels.map(async (input): Promise<Story[]> => {
      const idMatch = input.match(/channel\/([A-Za-z0-9_-]+)/);
      const channelId = idMatch ? idMatch[1] : input.trim();
      const res = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return [];
      const items = parseFeed(await res.text());
      return items
        .filter(it => it.pubDate && withinCutoff(it.pubDate, cutoff))
        .slice(0, 2)
        .map(it => ({
          title:        it.title,
          description:  it.description ?? "",
          source:       it.author ?? "YouTube",
          url:          it.link,
          type:         "video" as StoryType,
          published_at: toIso(it.pubDate),
        }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Source 9: X/Twitter mentions via Google News ──────────────────────────────

async function fetchXMentions(handles: string[]): Promise<Story[]> {
  if (!handles.length) return [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const settled = await Promise.allSettled(
    handles.slice(0, 5).map(async (handle): Promise<Story[]> => {
      const q = `"@${handle}"`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const items = parseFeed(await res.text());
      return items
        .filter(it => it.pubDate && withinCutoff(it.pubDate, cutoff))
        .slice(0, 2)
        .map(it => ({
          title:        it.title,
          description:  `Mention of @${handle}: ${it.description ?? ""}`,
          source:       it.sourceName ?? "Google News",
          url:          it.link,
          type:         "article" as StoryType,
          published_at: toIso(it.pubDate),
        }));
    })
  );
  return settled.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Dedup ─────────────────────────────────────────────────────────────────────

function titleSimilarity(a: string, b: string): number {
  const words = (s: string) => new Set(
    s.toLowerCase().replace(/\W+/g, " ").trim().split(/\s+/).filter(w => w.length > 3)
  );
  const wa = words(a), wb = words(b);
  if (!wa.size || !wb.size) return 0;
  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return overlap / Math.min(wa.size, wb.size);
}

function dedup(stories: Story[]): Story[] {
  const result: Story[] = [];
  for (const s of stories) {
    if (!s.title.trim()) continue;
    const dupIdx = result.findIndex(r => titleSimilarity(r.title, s.title) > 0.6);
    if (dupIdx === -1) {
      result.push(s);
    } else if (s.is_user_pub && !result[dupIdx].is_user_pub) {
      result[dupIdx] = s; // prefer user's chosen publication
    }
  }
  return result;
}

function dedupWithPrev(stories: Story[], prev: Story[]): Story[] {
  if (!prev.length) return stories;
  return stories.filter(s => !prev.some(p => titleSimilarity(s.title, p.title) > 0.6));
}

// ── Ranking ───────────────────────────────────────────────────────────────────

function rankStories(stories: Story[], userTopics: string[]): ScoredStory[] {
  const now = Date.now();
  return stories
    .map(s => {
      let rank_score = 0;
      if (s.is_user_pub)                           rank_score += 3;
      if (s.topic && userTopics.includes(s.topic)) rank_score += 2;
      if ((s.hn_score    ?? 0) > 500)              rank_score += 2;
      if ((s.reddit_score ?? 0) > 1000)            rank_score += 1;
      if (s.published_at) {
        const h = (now - new Date(s.published_at).getTime()) / 3_600_000;
        if (h < 6)  rank_score += 1;
        if (h > 20) rank_score -= 1;
      }
      return { ...s, rank_score };
    })
    .sort((a, b) => b.rank_score - a.rank_score);
}

function selectTopStories(ranked: ScoredStory[], userTopics: string[], max: number): ScoredStory[] {
  const result: ScoredStory[] = [];
  const used = new Set<number>();

  // Guarantee at least one story per topic
  for (const topic of userTopics) {
    const idx = ranked.findIndex((s, i) => !used.has(i) && s.topic === topic);
    if (idx >= 0) { result.push(ranked[idx]); used.add(idx); }
  }

  // Fill remaining slots by score
  for (let i = 0; i < ranked.length && result.length < max; i++) {
    if (!used.has(i)) result.push(ranked[i]);
  }
  return result.slice(0, max);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function withinCutoff(dateStr: string, cutoff: number): boolean {
  const d = new Date(dateStr).getTime();
  return !isNaN(d) && d > cutoff;
}

function toIso(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function timeAgo(isoStr?: string): string {
  if (!isoStr) return "recently";
  const diff  = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const BRIEFING_MODEL = "claude-sonnet-4-6";

export interface GenerateResult {
  briefing:    { id: string; content: string; created_at: string } & Record<string, unknown>;
  emailed:     boolean;
  emailError?: string;
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  analyst:    "Write like a sharp analyst. Assume the reader knows the industry. Skip context, go straight to implications. Be opinionated.",
  journalist: "Write clearly and accessibly. Provide context for every story. Explain why something matters in plain language. Balanced but engaging.",
  advisor:    "Be ruthlessly selective. Only include stories that directly impact the user's specific field and role. Fewer stories, deeper analysis. Cut everything else.",
};

export class NoStoriesError extends Error {
  constructor() {
    super("No fresh stories found in the last 24 hours. Check your topics and sources.");
  }
}

/**
 * Collect fresh stories for a profile, write the briefing with Claude, save it,
 * and email it. Designed to finish inside one 60s serverless invocation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateBriefingForUser(supabase: SupabaseClient, profile: any, depth: Depth, apiKey: string): Promise<GenerateResult> {
  const userId = profile.id as string;
  const topics:            string[] = profile.topics ?? [];
  const publications:      string[] = profile.sources?.publications ?? [];
  const substacks:         string[] = profile.sources?.substacks ?? [];
  const xHandles:          string[] = profile.sources?.x_handles ?? [];
  const podcasts:          string[] = profile.sources?.podcasts ?? [];
  const youtubeChannels:   string[] = profile.sources?.youtube_channels ?? [];
  const redditCommunities: string[] = profile.sources?.reddit_communities ?? [];

  const briefingStyle:  string = profile.briefing_style  ?? "analyst";
  const expertiseLevel: string = profile.expertise_level ?? "expert";
  const cfg = DEPTH_CFG[depth];

  const styleInstruction = STYLE_INSTRUCTIONS[briefingStyle] ?? STYLE_INSTRUCTIONS.analyst;
  const expertiseInstruction = expertiseLevel === "beginner"
    ? "The reader is building their knowledge — define industry terms on first use and provide context when referencing concepts or companies they may not know."
    : "Use industry jargon freely. The reader is an expert and finds over-explanation condescending.";

  // Previous briefing, so we never repeat a story
  const { data: lastBriefing } = await supabase
    .from("briefings").select("articles_used").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const prevArticles: Story[] = (lastBriefing?.articles_used ?? []) as Story[];

  const [
    googleStories, newsApiStories, gdeltStories, hnStories, redditStories,
    rssStories, podcastStories, ytStories, xStories,
  ] = await Promise.all([
    fetchGoogleNews(topics),
    fetchNewsAPI(topics),
    fetchGDELT(topics),
    fetchHackerNews(topics),
    fetchReddit(topics, redditCommunities),
    fetchRSSAndSubstacks(publications, substacks),
    fetchPodcasts(podcasts),
    fetchYouTube(youtubeChannels),
    fetchXMentions(xHandles),
  ]);

  // The user's own publications go first so dedup prefers them
  const allStories = [
    ...rssStories, ...googleStories, ...newsApiStories, ...hnStories,
    ...gdeltStories, ...redditStories, ...podcastStories, ...ytStories, ...xStories,
  ];
  const deduped  = dedup(allStories);
  const filtered = dedupWithPrev(deduped, prevArticles);
  const ranked   = rankStories(filtered, topics);
  const selected = selectTopStories(ranked, topics, cfg.stories);

  console.log(`[briefing] raw:${allStories.length} deduped:${deduped.length} filtered:${filtered.length} selected:${selected.length}`);
  if (selected.length === 0) throw new NoStoriesError();

  const storyList = selected.map((s, i) => {
    const typeLabel = s.type === "podcast" ? "Podcast" : s.type === "video" ? "Video" : "Article";
    const summary   = s.description && s.description.length > 20 ? s.description : s.title;
    const lines = [
      `[${i + 1}] SOURCE: ${s.source} | TYPE: ${typeLabel} | PUBLISHED: ${timeAgo(s.published_at)}`,
      `    TITLE: ${s.title}`,
      `    SUMMARY: ${summary}`,
      s.type === "podcast" && s.listen_url ? `    LISTEN: ${s.listen_url}` : `    URL: ${s.url}`,
    ];
    return lines.join("\n");
  }).join("\n\n");

  const anthropic = new Anthropic({ apiKey, timeout: 42_000, maxRetries: 0 });
  const msg = await anthropic.messages.create({
    model:       BRIEFING_MODEL,
    max_tokens:  2400,
    temperature: 0.7,
    system: `You are Neo — a personal intelligence analyst who knows this person better than any algorithm. You write like the smartest person in the room who also happens to care deeply about the reader.

Writing style: ${styleInstruction}
Expertise level: ${expertiseInstruction}

Rules:
- Never summarise. Always analyse.
- Every insight must answer "so what?" for THIS specific person.
- Write in short punchy paragraphs, never bullets.
- If a story is not relevant to the user's lens, skip it entirely — quality over quantity.
- Each story: what happened (1 sentence), why it matters to THIS person specifically (2-3 sentences), what they should do or watch for (1 sentence).
- Start with a one-line greeting that references something specific about their world.
- Use ## headings to group stories by topic.
- End with one takeaway that connects the day's themes together, on its own final paragraph, written exactly as: **Today's signal:** followed by one or two sentences.
- For every single story you write about, the very first line of that story MUST be one of these exact source attribution formats — nothing may appear before it on that line:
  📰 SOURCE: [publication name] · [X hours/minutes ago]   ← for articles
  🎙️ PODCAST: [show name] · [X hours/minutes ago]         ← for podcasts
  🎬 VIDEO: [channel name] · [X hours/minutes ago]         ← for YouTube videos
  Never write about a story without this attribution line. No exceptions.

Depth instruction for this request: ${cfg.instruction}`,
    messages: [{
      role: "user",
      content: `Who I am: ${profile.lens}

Topics I care about: ${topics.join(", ")}

Today's stories (all from the last 24 hours):
${storyList}

Write my Neo briefing now.`,
    }],
  });

  const content = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  if (!content.trim()) throw new Error("The briefing came back empty — please try again.");

  const sources_used = selected.map(s => ({ name: s.source, url: s.url, type: s.type, published_at: s.published_at ?? null }));
  const date_range   = { from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), to: new Date().toISOString() };

  const { data: saved, error: saveErr } = await supabase
    .from("briefings")
    .insert({ user_id: userId, content, articles_used: selected, sources_used, date_range, articles_count: selected.length })
    .select().single();
  if (saveErr) console.error("[briefing] save error:", saveErr);

  const briefing = (saved ?? { id: crypto.randomUUID(), content, created_at: new Date().toISOString() }) as GenerateResult["briefing"];

  let emailed = false;
  let emailError: string | undefined;
  try {
    const r = await sendBriefingEmail(profile.delivery_email ?? profile.email, content);
    emailed = r.sent;
    emailError = r.error;
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e);
  }
  if (emailError) console.error("[briefing] email error:", emailError);
  if (emailed && saved?.id) {
    await supabase.from("briefings").update({ email_sent: true }).eq("id", saved.id);
  }

  return { briefing, emailed, emailError };
}
