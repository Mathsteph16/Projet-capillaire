import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/scan";

  console.log(`[AUTH] callback code=${code ? "présent" : "absent"} next=${next} siteUrl=${siteUrl}`);

  if (code) {
    // On crée le redirect EN PREMIER et on y pose les cookies directement.
    // L'approche précédente (cookies() de next/headers + NextResponse séparé)
    // ne garantissait pas que les Set-Cookie headers arrivent au navigateur.
    const redirectUrl = new URL(next, siteUrl);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
            });
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    console.log(`[AUTH] exchangeCodeForSession → ${error ? `error: ${error.message}` : `user=${data.user?.id}`}`);

    if (!error && data.user) {
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

      // Link onboarding responses to user via session cookie
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
