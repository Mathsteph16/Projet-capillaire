import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Connexion CÔTÉ SERVEUR : pose le cookie de session dans la réponse. Évite le
// signInWithPassword navigateur qui traîne ~10s (verrou interne). Connexion quasi
// instantanée, comme l'inscription.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
