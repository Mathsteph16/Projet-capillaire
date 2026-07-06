import crypto from "crypto";
import type { BillingProvider, CheckoutInput, Plan, WebhookEvent } from "./index";

const PLAN_VARIANT_IDS: Record<Plan, string> = {
  plus_monthly: process.env.LEMONSQUEEZY_VARIANT_ID_MENSUEL ?? "",
  plus_annual:  process.env.LEMONSQUEEZY_VARIANT_ID_ANNUEL ?? "",
  pro:          process.env.LEMONSQUEEZY_VARIANT_ID_PRO ?? "",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.scalpy-app.com";

export class LemonSqueezyProvider implements BillingProvider {
  private apiKey = process.env.LEMONSQUEEZY_API_KEY ?? "";
  private storeId = process.env.LEMONSQUEEZY_STORE_ID ?? "";

  async createCheckout(input: CheckoutInput): Promise<{ url: string }> {
    const variantId = PLAN_VARIANT_IDS[input.plan];
    if (!variantId) throw new Error(`No variant for plan ${input.plan}`);

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: input.email,
              custom: { user_id: input.userId },
            },
            product_options: {
              redirect_url: `${SITE_URL}/suivi?checkout=success`,
            },
          },
          relationships: {
            store:   { data: { type: "stores",   id: this.storeId } },
            variant: { data: { type: "variants", id: variantId   } },
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lemon Squeezy checkout failed: ${text}`);
    }

    const json = await res.json();
    return { url: json.data.attributes.url };
  }

  async verifyWebhook(req: Request): Promise<WebhookEvent | null> {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";
    const body = await req.text();
    const sig = req.headers.get("x-signature") ?? "";

    let sigBuf: Buffer, hmacBuf: Buffer;
    try {
      sigBuf  = Buffer.from(sig, "hex");
      hmacBuf = Buffer.from(
        crypto.createHmac("sha256", secret).update(body).digest("hex"),
        "hex"
      );
    } catch {
      return null;
    }

    if (sigBuf.length !== hmacBuf.length || !crypto.timingSafeEqual(sigBuf, hmacBuf)) {
      return null;
    }

    const payload   = JSON.parse(body);
    const eventName = payload.meta?.event_name as string;
    const attrs     = payload.data?.attributes ?? {};
    const customData = payload.meta?.custom_data ?? {};

    const variantIdFromPayload = String(
      attrs.variant_id ??
      attrs.first_subscription_item?.variant_id ??
      ""
    );

    const planMap: Record<string, Plan> = {};
    for (const [plan, vid] of Object.entries(PLAN_VARIANT_IDS)) {
      if (vid) planMap[vid] = plan as Plan;
    }
    const plan = planMap[variantIdFromPayload] ?? "plus_monthly";

    const lsStatusMap: Record<string, WebhookEvent["status"]> = {
      active:    "active",
      cancelled: "cancelled",
      expired:   "expired",
      on_trial:  "active",
      paused:    "paused",
      past_due:  "past_due",
    };

    const eventStatusMap: Record<string, WebhookEvent["status"]> = {
      subscription_created:         "active",
      subscription_updated:         lsStatusMap[attrs.status] ?? "active",
      subscription_cancelled:       "cancelled",
      subscription_expired:         "expired",
      subscription_paused:          "paused",
      subscription_unpaused:        "active",
      subscription_payment_success: "active",
      subscription_payment_failed:  "past_due",
      order_created:                "active",
      order_refunded:               "refunded",
    };

    const status = eventStatusMap[eventName];
    if (!status) return null;

    const knownTypes = new Set([
      "subscription_created", "subscription_updated", "subscription_cancelled",
      "subscription_expired", "subscription_paused", "subscription_unpaused",
      "subscription_payment_success", "subscription_payment_failed",
      "order_created", "order_refunded",
    ]);
    if (!knownTypes.has(eventName)) return null;

    return {
      type:                    eventName as WebhookEvent["type"],
      userId:                  customData.user_id ?? "",
      plan,
      status,
      providerCustomerId:      String(attrs.customer_id ?? ""),
      providerSubscriptionId:  String(payload.data?.id ?? ""),
      currentPeriodEnd:        attrs.renews_at ?? attrs.ends_at ?? null,
      cancelAtPeriodEnd:       attrs.cancelled === true || eventName === "subscription_cancelled",
      customerEmail:           attrs.user_email ?? null,
      variantId:               variantIdFromPayload,
    };
  }
}
