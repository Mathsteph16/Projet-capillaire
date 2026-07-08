import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRedirectAfterLogin } from "@/lib/routing";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  console.log(`[AUTH] callback code=${code ? "présent" : "absent"} next=${explicitNext ?? "absent"} siteUrl=${siteUrl}`);

  if (code) {
    // Collecter les cookies en tableau avant de créer le redirect,
    // car on doit connaître l'userId pour choisir la destination.
    const sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach((c) => sessionCookies.push(c as typeof sessionCookies[0]));
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    console.log(`[AUTH] exchangeCodeForSession → ${error ? `error: ${error.message}` : `user=${data.user?.id}`}`);

    if (!error && data.user) {
      // Si ?next est explicite et différent du défaut "/scan", on le respecte
      // (l'utilisateur voulait accéder à une page précise avant d'être renvoyé
      // vers /auth). Sinon, routing intelligent selon l'état de l'utilisateur.
      const next =
        explicitNext && explicitNext !== "/scan"
          ? explicitNext
          : await getRedirectAfterLogin(data.user.id);

      const redirectUrl = new URL(next, siteUrl);
      const response = NextResponse.redirect(redirectUrl);

      sessionCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
      });

      const createdAt = new Date(data.user.created_at);
      const isNew = Date.now() - createdAt.getTime() < 60_000;
      if (isNew) {
        await supabase.from("events").insert({
          user_id: data.user.id,
          name: "inscription",
          props: { provider: "google" },
        });
        try {
          const { sendEmail, emailWelcome } = await import("@/lib/email/resend");
          if (data.user.email) {
            await sendEmail({ to: data.user.email, ...emailWelcome() });
          }
        } catch {}
      }

      const cookieStore = await cookies();
      const sessionId = cookieStore.get("scalpy_sid")?.value;
      if (sessionId) {
        const admin = createAdminClient();
        await admin
          .from("onboarding_responses")
          .update({ user_id: data.user.id })
          .eq("session_id", sessionId)
          .is("user_id", null);
      }

      console.log(`[AUTH] callback → redirect ${redirectUrl.toString()}`);
      return response;
    }
  }

  console.log(`[AUTH] callback → redirect /auth (échec)`);
  return NextResponse.redirect(new URL("/auth", siteUrl));
}
