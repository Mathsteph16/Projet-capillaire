import { createAdminClient } from "@/lib/supabase/admin";

export async function getRedirectAfterLogin(userId: string): Promise<string> {
  const supabase = createAdminClient();

  const [subResult, scanResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .in("status", ["active", "cancelled"])
      .maybeSingle(),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const sub = subResult.data;
  const scanCount = scanResult.count ?? 0;

  const hasActiveSub = sub
    ? sub.status === "active" ||
      (sub.status === "cancelled" &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date())
    : false;

  if (hasActiveSub && scanCount > 0) {
    console.log(`[ROUTING] userId=${userId} sub=active scans=${scanCount} → /suivi`);
    return "/suivi";
  }
  if (hasActiveSub && scanCount === 0) {
    console.log(`[ROUTING] userId=${userId} sub=active scans=0 → /scan`);
    return "/scan";
  }
  if (!hasActiveSub && scanCount > 0) {
    console.log(`[ROUTING] userId=${userId} sub=none scans=${scanCount} → /plus`);
    return "/plus";
  }
  console.log(`[ROUTING] userId=${userId} sub=none scans=0 → /onboarding`);
  return "/onboarding";
}
