import { createClient } from "@/lib/supabase/client";

export async function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const sessionId = getSessionId();

    await supabase.from("events").insert({
      session_id: sessionId,
      user_id: user?.id ?? null,
      name,
      props: props ?? {},
    });
  } catch {
    // analytics should never break the app
  }
}

function getSessionId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/scalpy_sid=([^;]+)/);
  return match?.[1] ?? null;
}
