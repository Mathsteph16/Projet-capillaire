import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "mathias.stephant@gmail.com").split(",");

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("name, props")
    .gte("created_at", since);

  const rows = events ?? [];

  function count(name: string) {
    return rows.filter((e) => e.name === name).length;
  }

  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "active");

  const { data: canceledSubs } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "canceled");

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
    rescan_count: count("rescan_completed"),
  });
}
