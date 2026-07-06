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
          cancel_at_period_end: event.cancelAtPeriodEnd,
          customer_email: event.customerEmail,
          variant_id: event.variantId || null,
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
        cancel_at_period_end: event.cancelAtPeriodEnd,
        customer_email: event.customerEmail,
        variant_id: event.variantId || null,
      });
    }

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

    console.log(`[webhook] ${event.type} → user ${event.userId} → ${event.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
