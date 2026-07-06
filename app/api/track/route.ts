import { NextResponse } from "next/server";
import { trackEventServer } from "@/lib/track-server";
import { createClient } from "@/lib/supabase/server";

// Tracking côté SERVEUR : l'insert se fait en service_role (contourne les droits
// RLS) -> les events se loggent TOUJOURS, y compris pour un utilisateur connecté
// (avant, l'insert direct depuis le navigateur était bloqué après l'inscription,
// on était aveugle sur le flux scan). En prime, le navigateur ne touche plus
// l'auth Supabase pour tracker -> plus aucun risque de verrou qui bloque l'analyse.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name : "";
    if (!name) return NextResponse.json({ ok: false }, { status: 200 });

    const props =
      body?.props && typeof body.props === "object" ? body.props : {};
    const sessionId =
      typeof body?.session_id === "string" ? body.session_id : undefined;

    // user_id depuis le cookie de session (côté serveur, sans bloquer le client)
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // anonyme : on loggue quand même avec le session_id
    }

    await trackEventServer(name, props, { sessionId, userId });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
