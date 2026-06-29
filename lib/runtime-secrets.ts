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
      const { data } = await admin
        .from("onboarding_responses")
        .select("answers")
        .eq("session_id", "__system_secrets__")
        .single();
      cache = (data?.answers as Record<string, string>) || {};
    } catch {
      cache = {};
    }
    return cache;
  })();
  return loading;
}

/** Clé runtime : la base (clés posées hors Railway) d'abord, puis l'env. */
export async function getSecret(name: string): Promise<string | undefined> {
  const secrets = await loadSecrets();
  return secrets[name] || process.env[name];
}
