import { NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEventServer } from "@/lib/track-server";

// Webhook Stripe. URL à renseigner dans le dashboard Stripe :
//   https://www.scalpy-app.com/api/webhook/stripe
// La signature est vérifiée dans StripeProvider.verifyWebhook (corps brut requis).
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const billing = getBillingProvider();
    const event = await billing.verifyWebhook(req);

    // Signature valide mais event hors périmètre : on accuse réception (200) pour
    // que Stripe ne renvoie pas l'event en boucle.
    if (event === "ignored") {
      return NextResponse.json({ ignored: true }, { status: 200 });
    }
    if (!event) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (!event.userId) {
      return NextResponse.json({ error: "No user_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // L'user_id vient des metadata du checkout. Même signature valide, on confirme
    // que le compte existe avant d'activer (jamais d'activation sur un id arbitraire).
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", event.userId)
      .single();
    if (!profile) {
      console.error(`[Webhook Stripe] user_id inconnu, ignoré : ${event.userId}`);
      return NextResponse.json({ error: "Unknown user" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", event.userId)
      .single();

    if (existing) {
      await supabase
        .from("subscriptions")
        .update({
          plan: event.plan,
          status: event.status,
          provider: "stripe",
          provider_customer_id: event.providerCustomerId,
          provider_subscription_id: event.providerSubscriptionId,
          current_period_end: event.currentPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", event.userId);
    } else {
      await supabase.from("subscriptions").insert({
        user_id: event.userId,
        plan: event.plan,
        status: event.status,
        provider: "stripe",
        provider_customer_id: event.providerCustomerId,
        provider_subscription_id: event.providerSubscriptionId,
        current_period_end: event.currentPeriodEnd,
      });
    }

    const eventName =
      event.status === "active" ? "purchase_completed" : "purchase_failed";
    await trackEventServer(eventName, { plan: event.plan }, { userId: event.userId });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
