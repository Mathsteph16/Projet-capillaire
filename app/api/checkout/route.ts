import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillingProvider, type Plan } from "@/lib/billing";
import { trackEventServer } from "@/lib/track-server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: Plan };
    if (!["plus_monthly", "plus_annual", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const billing = getBillingProvider();
    const { url } = await billing.createCheckout({
      userId: user.id,
      plan,
      email: user.email ?? "",
    });

    await trackEventServer("checkout_started", { plan }, { userId: user.id });

    return NextResponse.json({ url });
  } catch (e) {
    console.error("Checkout error:", e);
    // Config paiement absente (clés/variantes pas encore posées) : message clair
    // et 503, pas un 500 générique.
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("non configuré")) {
      return NextResponse.json(
        { error: "Le paiement n'est pas encore disponible. Réessaie dans un instant." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
