import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const redirectUrl = new URL("/scan", siteUrl);
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

    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "email",
      token_hash,
    });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Link onboarding responses to user via session cookie
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("scalpy_sid")?.value;
        if (sessionId) {
          const admin = createAdminClient();
          await admin
            .from("onboarding_responses")
            .update({ user_id: user.id })
            .eq("session_id", sessionId)
            .is("user_id", null);
        }

        // Send welcome email
        try {
          const { sendEmail, emailWelcome } = await import("@/lib/email/resend");
          if (user.email) {
            await sendEmail({ to: user.email, ...emailWelcome() });
          }
        } catch {}
      }

      return response;
    }
  }

  return NextResponse.redirect(new URL("/auth", siteUrl));
}
