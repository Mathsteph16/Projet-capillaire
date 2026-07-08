import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getRedirectAfterLogin } from "@/lib/routing";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    // On collecte les cookies en tableau avant de créer le NextResponse,
    // puis on les applique après (même pattern que /api/signup).
    const sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach((c) => sessionCookies.push(c as typeof sessionCookies[0]));
          },
        },
      }
    );

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    console.log(`[AUTH] login email=${email} → ${error ? `error: ${error.message}` : "ok"}`);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const redirectTo = data.user?.id
      ? await getRedirectAfterLogin(data.user.id)
      : "/scan";

    const response = NextResponse.json({ ok: true, redirectTo });
    sessionCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
