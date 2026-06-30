import { createAdminClient } from "@/lib/supabase/admin";

// Secrets runtime (clés IA) : la prod Railway a des clés invalides/absentes et on
// n'a pas accès à son dashboard. On les stocke donc dans une ligne protégée de la
// base (session_id "__system_secrets__", lisible UNIQUEMENT par le service role,
// RLS bloque tout le monde d'autre) et on les lit ici, avec l'env en repli.
// Cache au niveau process (relu seulement à froid).
let cache: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;

async function loadSecrets(): Promise<Record<string, string>> {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("onboarding_responses")
        .select("answers")
        .eq("session_id", "__system_secrets__")
        .single();
      if (error) throw error;
      cache = (data?.answers as Record<string, string>) || {};
      return cache;
    } catch {
      // Échec souvent transitoire : on NE met PAS en cache un résultat vide
      // (sinon des clés posées en base APRÈS le démarrage ne seraient jamais
      // relues). On réessaiera au prochain appel ; l'env reste le repli immédiat.
      cache = null;
      return {} as Record<string, string>;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Clé runtime : la base (clés posées hors Railway) d'abord, puis l'env. */
export async function getSecret(name: string): Promise<string | undefined> {
  const secrets = await loadSecrets();
  return secrets[name] || process.env[name];
}
