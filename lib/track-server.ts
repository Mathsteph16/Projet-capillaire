import { createAdminClient } from "@/lib/supabase/admin";

export async function trackEventServer(
  name: string,
  props?: Record<string, string | number | boolean>,
  options?: { sessionId?: string; userId?: string }
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("events").insert({
      session_id: options?.sessionId ?? null,
      user_id: options?.userId ?? null,
      name,
      props: props ?? {},
    });
  } catch {
    // analytics should never break the app
  }
}
