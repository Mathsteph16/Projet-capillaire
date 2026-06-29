import { createBrowserClient } from "@supabase/ssr";

// SINGLETON : un seul client navigateur pour toute l'app. Recréer une instance à
// chaque appel fait que plusieurs clients se disputent le verrou d'auth interne
// (navigator.locks) -> signInWithPassword/getSession peuvent rester bloqués
// indéfiniment ("charge dans le vide"). Une seule instance = plus de blocage.
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
