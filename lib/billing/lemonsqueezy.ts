import crypto from "crypto";
import type { BillingProvider, CheckoutInput, Plan, WebhookEvent } from "./index";
import { getSecret } from "@/lib/runtime-secrets";

// La config LemonSqueezy est lue via getSecret : env Railway OU base (clés posées
// hors Railway). -> activer le paiement = juste poser les clés dans la base, zéro
// changement de code. Noms des variantes par plan :
const VARIANT_SECRET: Record<Plan, string> = {
  plus_monthly: "LS_VARIANT_PLUS_MONTHLY",
  plus_annual: "LS_VARIANT_PLUS_ANNUAL",
  pro: "LS_VARIANT_PRO",
};

export class LemonSqueezyProvider implements BillingProvider {
  async createCheckout(input: CheckoutInput): Promise<{ url: string }> {
    const apiKey = await getSecret("LEMONSQUEEZY_API_KEY");
    const storeId = await getSecret("LEMONSQUEEZY_STORE_ID");
    const variantId = await getSecret(VARIANT_SECRET[input.plan]);
    if (!apiKey || !storeId || !variantId) {
      throw new Error(`LemonSqueezy non configuré (clé/store/variant manquant pour ${input.plan})`);
    }

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: variantId } },
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

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const apiKey = await getSecret("LEMONSQUEEZY_API_KEY");
    if (!apiKey || !subscriptionId) return;
    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
    });
    if (!res.ok) {
      console.error(`[LemonSqueezy] Annulation échouée (${subscriptionId}): ${await res.text()}`);
    }
  }

  async verifyWebhook(req: Request): Promise<WebhookEvent | null> {
    const secret = (await getSecret("LEMONSQUEEZY_WEBHOOK_SECRET")) ?? "";
    // Sans secret configuré, on refuse tout : pas de webhook accepté en aveugle.
    if (!secret) {
      console.error("[LemonSqueezy] LEMONSQUEEZY_WEBHOOK_SECRET non configuré.");
      return null;
    }
    const body = await req.text();
    const sig = req.headers.get("x-signature") ?? "";

    const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const hmacBuf = Buffer.from(hmac, "hex");
    // timingSafeEqual lève si les longueurs diffèrent : on garde-fou avant.
    if (sigBuf.length !== hmacBuf.length || !crypto.timingSafeEqual(sigBuf, hmacBuf)) {
      return null;
    }

    let payload: Record<string, unknown> & {
      meta?: { event_name?: string; custom_data?: { user_id?: string } };
      data?: { id?: string; attributes?: Record<string, unknown> };
    };
    try {
      payload = JSON.parse(body);
    } catch {
      console.error("[LemonSqueezy] Webhook JSON illisible.");
      return null;
    }
    const eventName = payload.meta?.event_name ?? "";
    const attrs = (payload.data?.attributes ?? {}) as {
      variant_id?: string | number;
      first_subscription_item?: { variant_id?: string | number };
      status?: string;
      customer_id?: string | number;
      renews_at?: string | null;
    };
    const customData = payload.meta?.custom_data ?? {};

    // Mapping variante -> plan, via la config (env ou base).
    const planMap: Record<string, Plan> = {};
    for (const [plan, secretName] of Object.entries(VARIANT_SECRET)) {
      const vid = await getSecret(secretName);
      if (vid) planMap[vid] = plan as Plan;
    }

    const variantId = String(attrs.variant_id ?? attrs.first_subscription_item?.variant_id ?? "");
    const plan = planMap[variantId] ?? "plus_monthly";

    const typeMap: Record<string, WebhookEvent["type"]> = {
      subscription_created: "subscription_created",
      subscription_updated: "subscription_updated",
      subscription_cancelled: "subscription_cancelled",
      subscription_expired: "subscription_expired",
      order_created: "subscription_created",
    };

    const type = typeMap[eventName];
    if (!type) return null;

    const statusMap: Record<string, WebhookEvent["status"]> = {
      active: "active",
      cancelled: "canceled",
      expired: "expired",
      on_trial: "active",
      paused: "canceled",
    };

    return {
      type,
      userId: customData.user_id ?? "",
      plan,
      status: statusMap[attrs.status ?? ""] ?? "active",
      providerCustomerId: String(attrs.customer_id ?? ""),
      providerSubscriptionId: String(payload.data?.id ?? ""),
      currentPeriodEnd: attrs.renews_at ?? null,
    };
  }
}
