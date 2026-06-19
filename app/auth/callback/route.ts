import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const createdAt = new Date(data.user.created_at);
      const isNew = Date.now() - createdAt.getTime() < 60_000;
      if (isNew) {
        await supabase.from("events").insert({
          user_id: data.user.id,
          name: "inscription",
          meta: { provider: "google" },
        });
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth", origin));
}
