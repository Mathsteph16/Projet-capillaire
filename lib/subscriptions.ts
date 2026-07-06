import { createAdminClient } from "@/lib/supabase/admin";

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "cancelled"])
    .single();

  if (!data) return false;

  if (data.status === "active") return true;

  // cancelled but still within paid period
  if (data.status === "cancelled" && data.current_period_end) {
    return new Date(data.current_period_end) > new Date();
  }

  return false;
}
