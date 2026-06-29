import { createClient } from "@/lib/supabase/client";

export async function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
) {
  try {
    const supabase = createClient();
    // getSession() : lecture LOCALE instantanée. getUser() faisait un appel réseau
    // qui prend le verrou d'auth navigateur et le bloque -> bloquait l'analyse
    // (95%) et empêchait le tracking de se logger. Ne JAMAIS getUser ici.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionId = getSessionId();

    await supabase.from("events").insert({
      session_id: sessionId,
      user_id: session?.user?.id ?? null,
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
