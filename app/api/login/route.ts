import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Connexion CÔTÉ SERVEUR : pose le cookie de session DIRECTEMENT sur la réponse.
// On utilise createServerClient avec setAll qui écrit sur response.cookies —
// l'approche cookies() de next/headers ne garantit pas que les Set-Cookie
// headers se retrouvent dans le NextResponse retourné (bug boucle auth Safari).
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log(`[AUTH] login email=${email} → ${error ? `error: ${error.message}` : "ok"}`);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
