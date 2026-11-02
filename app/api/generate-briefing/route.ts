import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBriefingForUser, NoStoriesError, type Depth } from "@/lib/briefing-engine";
import { getUserApiKey } from "@/lib/anthropic-key";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Manual briefings a person can generate per rolling 24 hours. */
const DAILY_LIMIT = 5;
/** The cron skips anyone who already received a briefing in this window. */
const CRON_WINDOW_HOURS = 18;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = process.env.CRON_SECRET;
    const isCron = !!secret && request.headers.get("authorization") === `Bearer ${secret}`;

    // Who is this for, and which database client may we use?
    let db: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;
    let userId: string;

    if (isCron) {
      if (typeof body.user_id !== "string") {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
      }
      userId = body.user_id;
      db = createAdminClient();
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
      userId = user.id;
      db = supabase;
    }

    // Cost control: cap how often a briefing can be generated
    const windowHours = isCron ? CRON_WINDOW_HOURS : 24;
    const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const { count } = await db
      .from("briefings").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", since);

    if (isCron && (count ?? 0) > 0) return NextResponse.json({ skipped: true });
    if (!isCron && (count ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `You've reached today's limit of ${DAILY_LIMIT} briefings. Your next one is ready tomorrow.` },
        { status: 429 }
      );
    }

    const { data: profile, error: pErr } = await db.from("profiles").select("*").eq("id", userId).single();
    if (pErr || !profile) {
      return NextResponse.json({ error: "Profile not found — complete onboarding first." }, { status: 404 });
    }
    if (!Array.isArray(profile.topics) || profile.topics.length === 0) {
      return NextResponse.json({ error: "Pick at least one topic in Settings first." }, { status: 400 });
    }

    // Briefings are written with the user's own Anthropic key
    const apiKey = await getUserApiKey(createAdminClient(), userId);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Add your Anthropic API key in Settings to generate briefings.", code: "NO_KEY" },
        { status: 400 }
      );
    }

    const depth: Depth = ["scan", "read", "deep"].includes(body.depth_mode) ? body.depth_mode : "read";
    const result = await generateBriefingForUser(db as never, profile, depth, apiKey);

    return NextResponse.json({
      briefing: result.briefing,
      emailed: result.emailed,
      emailError: result.emailError ?? null,
    });
  } catch (e) {
    console.error("[generate-briefing]", e);
    const upstream = (e as { status?: number })?.status;
    let message = e instanceof Error ? e.message : "Generation failed";
    let status = e instanceof NoStoriesError ? 404 : 500;
    if (upstream === 401) { message = "Anthropic rejected your API key. Update it in Settings."; status = 400; }
    else if (upstream === 429) { message = "Your Anthropic account is rate limited right now. Try again in a minute."; status = 429; }
    else if (upstream === 400 && /credit/i.test(message)) { message = "Your Anthropic account is out of credit. Add credit at console.anthropic.com."; status = 400; }
    return NextResponse.json({ error: message }, { status });
  }
}
