import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Création de compte SANS confirmation d'email (zéro friction) : on crée
// l'utilisateur côté serveur avec email_confirm forcé, il peut se connecter
// immédiatement. La connexion se fait ensuite côté client.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const already =
        error.message?.toLowerCase().includes("already") ||
        error.status === 422;
      return NextResponse.json(
        { error: already ? "Cet email est déjà utilisé." : error.message },
        { status: already ? 409 : 400 }
      );
    }

    // Rattache les réponses du questionnaire (anonymes, liées au cookie de session)
    // au nouveau compte. Sans ça, la perso (objectif) est perdue pour les
    // inscriptions par email (seul Google le faisait via auth/callback).
    // NON BLOQUANT : si ça échoue, l'inscription réussit quand même.
    try {
      const userId = data.user?.id;
      const sessionId = (await cookies()).get("scalpy_sid")?.value;
      if (userId && sessionId) {
        await admin
          .from("onboarding_responses")
          .update({ user_id: userId })
          .eq("session_id", sessionId)
          .is("user_id", null);
      }
    } catch (e) {
      console.error("[signup] Rattachement onboarding échoué (non bloquant):", e);
    }

    // Connexion CÔTÉ SERVEUR : pose directement le cookie de session dans la
    // réponse. Le navigateur n'a plus besoin d'appeler signInWithPassword (qui
    // traînait ~8s à cause d'un verrou interne). L'inscription devient quasi
    // instantanée. Si ça échoue, le client refera la connexion (filet).
    let signedIn = false;
    try {
      const supabase = await createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      signedIn = !signInError;
    } catch (e) {
      console.error("[signup] Connexion serveur échouée (le client réessaiera):", e);
    }

    return NextResponse.json({ ok: true, signedIn });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
