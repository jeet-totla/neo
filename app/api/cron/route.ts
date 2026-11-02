import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Briefings started per cron run. Keeps one run inside the 60s limit and the Gmail daily cap. */
const MAX_USERS_PER_RUN = 25;
const STAGGER_MS = 600;
const SKIP_WINDOW_HOURS = 18;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Daily dispatcher (see vercel.json). It does no generation itself: it starts
 * one /api/generate-briefing call per user, and each call is its own serverless
 * invocation with its own 60s budget.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: profiles, error } = await db
    .from("profiles").select("id, topics, delivery_email")
    .not("delivery_email", "is", null).limit(1000);
  if (error) {
    console.error("[cron] profile fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const since = new Date(Date.now() - SKIP_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data: recent } = await db.from("briefings").select("user_id").gte("created_at", since);
  const served = new Set((recent ?? []).map(r => r.user_id as string));

  const { data: keyed } = await db.from("user_secrets").select("user_id");
  const hasKey = new Set((keyed ?? []).map(r => r.user_id as string));

  const due = (profiles ?? []).filter(
    p => Array.isArray(p.topics) && p.topics.length > 0 && hasKey.has(p.id) && !served.has(p.id)
  );
  const batch = due.slice(0, MAX_USERS_PER_RUN);
  const origin = new URL(request.url).origin;

  const calls: Promise<unknown>[] = [];
  for (const p of batch) {
    calls.push(
      fetch(`${origin}/api/generate-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ user_id: p.id, depth_mode: "read" }),
      }).catch(e => console.error("[cron] dispatch failed for", p.id, e))
    );
    await sleep(STAGGER_MS);
  }
  // Give the requests time to leave before this function returns
  await Promise.race([Promise.allSettled(calls), sleep(4000)]);

  console.log(`[cron] dispatched ${batch.length} of ${due.length} due (${profiles?.length ?? 0} profiles)`);
  return NextResponse.json({ dispatched: batch.length, due: due.length, profiles: profiles?.length ?? 0 });
}
