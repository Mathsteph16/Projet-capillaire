import { createBrowserClient } from "@supabase/ssr";

// Fonction concrète (non générique) : son ReturnType garde le BON typage du client
// (annoter avec ReturnType<typeof createBrowserClient> le dégraderait en any).
function makeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // VERROU PASSE-PLAT : on n'utilise PLUS navigator.locks. Par défaut, Supabase
        // prend un verrou navigateur autour de getSession/getUser/signIn pour
        // coordonner le refresh de token entre onglets. Ce verrou peut rester bloqué
        // INDÉFINIMENT juste après l'inscription -> getSession "charge dans le vide"
        // -> l'analyse n'est jamais envoyée -> barre coincée à 95 % à vie (prouvé
        // dans les logs : le flux s'arrête pile sur getSession). Ici (appli mobile,
        // 1 onglet) on n'a pas besoin de coordination inter-onglets : on exécute
        // directement, sans jamais pouvoir bloquer.
        lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
      },
    }
  );
}

// SINGLETON : un seul client navigateur pour toute l'app. Recréer une instance à
// chaque appel fait que plusieurs clients se disputent le verrou d'auth interne
// (navigator.locks) -> signInWithPassword/getSession peuvent rester bloqués
// indéfiniment ("charge dans le vide"). Une seule instance = plus de blocage.
let browserClient: ReturnType<typeof makeBrowserClient> | undefined;

export function createClient() {
  return (browserClient ??= makeBrowserClient());
}
