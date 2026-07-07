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

    if (event === "ignored") {
      return NextResponse.json({ ignored: true }, { status: 200 });
    }
    if (!event) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (!event.userId) {
      console.warn("[webhook] Missing user_id in custom_data");
      return NextResponse.json({ error: "No user_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    console.log(`[WEBHOOK] event=${event.type} userId=${event.userId} status=${event.status} subId=${event.providerSubscriptionId}`);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", event.userId)
      .single();
    if (!profile) {
      console.error(`[WEBHOOK] user_id inconnu en base : ${event.userId}`);
      return NextResponse.json({ error: "Unknown user" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", event.userId)
      .single();

    console.log(`[WEBHOOK] subscription existante : ${existing ? `id=${existing.id} status=${existing.status}` : "aucune"}`);

    // Payload minimal garanti (colonnes présentes depuis la migration initiale)
    const base = {
      plan:                     event.plan,
      status:                   event.status,
      provider:                 "stripe",
      provider_customer_id:     event.providerCustomerId || null,
      provider_subscription_id: event.providerSubscriptionId || null,
      current_period_end:       event.currentPeriodEnd,
      updated_at:               new Date().toISOString(),
    };

    // Colonnes ajoutées par la migration complémentaire — on les tente en premier.
    const full = {
      ...base,
      cancel_at_period_end: event.cancelAtPeriodEnd,
      customer_email:       event.customerEmail,
      variant_id:           event.variantId || null,
    };

    let writeError: string | null = null;

    if (existing) {
      const { error } = await supabase
        .from("subscriptions")
        .update(full)
        .eq("user_id", event.userId);

      if (error) {
        console.warn(`[WEBHOOK] update full échoué (${error.message}) — retry avec colonnes de base`);
        const { error: error2 } = await supabase
          .from("subscriptions")
          .update(base)
          .eq("user_id", event.userId);
        if (error2) writeError = error2.message;
      }
    } else {
      const { error } = await supabase
        .from("subscriptions")
        .insert({ user_id: event.userId, ...full });

      if (error) {
        console.warn(`[WEBHOOK] insert full échoué (${error.message}) — retry avec colonnes de base`);
        const { error: error2 } = await supabase
          .from("subscriptions")
          .insert({ user_id: event.userId, ...base });
        if (error2) writeError = error2.message;
      }
    }

    if (writeError) {
      console.error(`[WEBHOOK] ÉCHEC ÉCRITURE SUPABASE : ${writeError}`);
      // On retourne 500 pour que Stripe réessaie (et qu'on voie l'erreur dans ses logs)
      return NextResponse.json({ error: "DB write failed", detail: writeError }, { status: 500 });
    }

    console.log(`[WEBHOOK] ✅ subscription écrite → user=${event.userId} status=${event.status}`);

    const trackName =
      event.status === "active"    ? "purchase_completed" :
      event.status === "refunded"  ? "purchase_refunded"  :
      event.status === "cancelled" ? "subscription_cancelled" :
      event.status === "expired"   ? "subscription_expired" :
      event.status === "past_due"  ? "payment_failed" :
      null;

    if (trackName) {
      await trackEventServer(trackName, { plan: event.plan }, { userId: event.userId });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
