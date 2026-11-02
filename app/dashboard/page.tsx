import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getKeyStatus } from "@/lib/user-key";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile + recent briefings in parallel
  const [{ data: profile }, { data: briefings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("briefings")
      .select("id, content, created_at, articles_used")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // If no profile yet, send to onboarding
  if (!profile) redirect("/onboarding");

  // Only whether a key exists and its last four characters ever reach the browser
  let keyStatus: Awaited<ReturnType<typeof getKeyStatus>> = null;
  try { keyStatus = await getKeyStatus(createAdminClient(), user.id); } catch { /* table not created yet */ }

  const all      = briefings ?? [];
  const latest   = all[0] ?? null;
  const pastOnly = all.slice(1);

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      profile={profile}
      latestBriefing={latest}
      pastBriefings={pastOnly}
      keyStatus={keyStatus}
    />
  );
}
