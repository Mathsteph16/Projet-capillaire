import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "mathias.stephant@gmail.com").split(",");

const PLAN_PRICES: Record<string, number> = {
  plus_monthly: 14.99,
  plus_annual: 79,
  pro: 149,
};

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await admin
    .from("events")
    .select("name, props")
    .gte("created_at", since);

  const rows = events ?? [];

  function count(name: string) {
    return rows.filter((e: { name: string }) => e.name === name).length;
  }

  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("id, plan")
    .eq("status", "active");

  const { data: canceledSubs } = await admin
    .from("subscriptions")
    .select("id")
    .eq("status", "canceled");

  const { data: totalProfiles } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // ARPU calculation
  const totalRevenue = (activeSubs ?? []).reduce((sum: number, s: { plan: string }) => {
    return sum + (PLAN_PRICES[s.plan] || 0);
  }, 0);
  const totalUsers = (totalProfiles as unknown as { count: number })?.count || 1;
  const arpu = Math.round((totalRevenue / totalUsers) * 100) / 100;

  // A/B variant breakdown
  const variantEvents = rows.filter((e: { name: string; props: Record<string, unknown> }) =>
    e.props && typeof e.props === "object" && "variant" in e.props
  );
  const variants: Record<string, { views: number; purchases: number }> = {};
  for (const e of variantEvents) {
    const v = String((e.props as Record<string, unknown>).variant);
    if (!variants[v]) variants[v] = { views: 0, purchases: 0 };
    if (e.name === "hero_viewed") variants[v].views++;
    if (e.name === "purchase_completed") variants[v].purchases++;
  }

  return NextResponse.json({
    cta_clicks: count("cta_scan_click"),
    onboarding_started: count("onboarding_started"),
    onboarding_completed: count("onboarding_completed"),
    scan_started: count("scan_started"),
    scan_completed: count("scan_completed"),
    result_viewed: count("result_viewed"),
    paywall_viewed: count("paywall_viewed"),
    checkout_started: count("checkout_started"),
    purchase_completed: count("purchase_completed"),
    active_subs: activeSubs?.length ?? 0,
    canceled_subs: canceledSubs?.length ?? 0,
    rescan_count: count("rescan_started"),
    arpu,
    variants,
  });
}
