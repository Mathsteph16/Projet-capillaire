import { NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEventServer } from "@/lib/track-server";

export async function POST(req: Request) {
  try {
    const billing = getBillingProvider();
    const event = await billing.verifyWebhook(req);

    if (!event) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!event.userId) {
      console.warn("[webhook] Missing user_id in custom_data");
      return NextResponse.json({ error: "No user_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const upsertData: Record<string, unknown> = {
      user_id:                  event.userId,
      plan:                     event.plan,
      status:                   event.status,
      provider:                 "lemonsqueezy",
      provider_customer_id:     event.providerCustomerId || null,
      provider_subscription_id: event.providerSubscriptionId || null,
      cancel_at_period_end:     event.cancelAtPeriodEnd,
      customer_email:           event.customerEmail,
      variant_id:               event.variantId || null,
      updated_at:               new Date().toISOString(),
    };

    if (event.currentPeriodEnd) {
      upsertData.current_period_end = event.currentPeriodEnd;
    }

    // Upsert on user_id — one subscription row per user
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", event.userId)
      .single();

    if (existing) {
      await supabase
        .from("subscriptions")
        .update(upsertData)
        .eq("user_id", event.userId);
    } else {
      await supabase.from("subscriptions").insert(upsertData);
    }

    // Tracking
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
    console.error("[webhook] Error:", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
