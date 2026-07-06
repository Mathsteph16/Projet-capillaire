import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEventServer } from "@/lib/track-server";

export async function POST(req: Request) {
  try {
    const { answers, step } = await req.json();

    // Validation : answers doit être un objet simple et borné (pas de payload
    // géant ni de type inattendu qui pollueraient la base ou les emails).
    if (
      typeof answers !== "object" ||
      answers === null ||
      Array.isArray(answers) ||
      Object.keys(answers).length > 30 ||
      JSON.stringify(answers).length > 4000
    ) {
      return NextResponse.json({ error: "Réponses invalides" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let sessionId = cookieStore.get("scalpy_sid")?.value;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookieStore.set("scalpy_sid", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("onboarding_responses")
      .select("id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("onboarding_responses")
        .update({ answers })
        .eq("id", existing.id);
    } else {
      await supabase.from("onboarding_responses").insert({
        session_id: sessionId,
        answers,
      });

      await trackEventServer("onboarding_started", {}, { sessionId });
    }

    if (step !== undefined) {
      await trackEventServer("onboarding_step", { step }, { sessionId });
    }

    return NextResponse.json({ ok: true, sessionId });
  } catch (e) {
    console.error("Onboarding error:", e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
