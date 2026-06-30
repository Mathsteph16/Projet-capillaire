import Stripe from "stripe";
import type { BillingProvider, CheckoutInput, Plan, WebhookEvent } from "./index";
import { getSecret } from "@/lib/runtime-secrets";

// Identifiants de PRIX Stripe (price_...) par plan, lus via getSecret (env Railway
// OU base). -> activer le paiement = poser les clés/prix, zéro changement de code.
const PRICE_SECRET: Record<Plan, string> = {
  plus_monthly: "STRIPE_PRICE_PLUS_MONTHLY",
  plus_annual: "STRIPE_PRICE_PLUS_ANNUAL",
  pro: "STRIPE_PRICE_PRO",
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.scalpy-app.com";
}

async function stripeClient(): Promise<Stripe | null> {
  const key = await getSecret("STRIPE_SECRET_KEY");
  if (!key) return null;
  return new Stripe(key);
}

function planFromMeta(m?: Stripe.Metadata | null): Plan {
  const p = m?.plan as Plan | undefined;
  return p === "plus_annual" || p === "pro" || p === "plus_monthly" ? p : "plus_monthly";
}

export class StripeProvider implements BillingProvider {
  async createCheckout(input: CheckoutInput): Promise<{ url: string }> {
    const stripe = await stripeClient();
    const price = await getSecret(PRICE_SECRET[input.plan]);
    if (!stripe || !price) {
      throw new Error(`Stripe non configuré (clé ou prix manquant pour ${input.plan})`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: input.email || undefined,
      client_reference_id: input.userId,
      // On met l'user_id PARTOUT : sur la session ET sur l'abonnement créé, pour
      // le retrouver dans tous les événements webhook.
      metadata: { user_id: input.userId, plan: input.plan },
      subscription_data: { metadata: { user_id: input.userId, plan: input.plan } },
      success_url: `${siteUrl()}/success`,
      cancel_url: `${siteUrl()}/plus`,
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("Stripe : pas d'URL de paiement renvoyée");
    return { url: session.url };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const stripe = await stripeClient();
    if (!stripe || !subscriptionId) return;
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch (e) {
      console.error(`[Stripe] Annulation échouée (${subscriptionId}):`, e);
    }
  }

  /**
   * Vérifie la signature Stripe (anti-falsification) puis traduit l'événement vers
   * notre WebhookEvent. Renvoie "ignored" pour un événement signé mais hors
   * périmètre (le webhook répond 200, pas de boucle de retry).
   */
  async verifyWebhook(req: Request): Promise<WebhookEvent | "ignored" | null> {
    const secret = await getSecret("STRIPE_WEBHOOK_SECRET");
    const stripe = await stripeClient();
    if (!secret || !stripe) {
      console.error("[Stripe] STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY absent.");
      return null;
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature") ?? "";

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch {
      // Signature invalide -> 401.
      return null;
    }

    const statusOf = (s: string): WebhookEvent["status"] =>
      s === "active" || s === "trialing" ? "active" : s === "canceled" ? "canceled" : "expired";

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id || s.client_reference_id || "";
        if (!userId) return "ignored";
        return {
          type: "subscription_created",
          userId,
          plan: planFromMeta(s.metadata),
          status: s.payment_status === "paid" || s.status === "complete" ? "active" : "expired",
          providerCustomerId: String(s.customer ?? ""),
          providerSubscriptionId: String(s.subscription ?? ""),
          currentPeriodEnd: null,
        };
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id || "";
        if (!userId) return "ignored";
        const cpe = (sub as { current_period_end?: number }).current_period_end;
        return {
          type: "subscription_updated",
          userId,
          plan: planFromMeta(sub.metadata),
          // past_due / unpaid / paused / incomplete_expired -> "expired" : on coupe.
          // canceled mais encore en période payée : Stripe garde status "active"
          // jusqu'à la fin, puis envoie subscription.deleted -> l'accès reste juste.
          status: statusOf(sub.status),
          providerCustomerId: String(sub.customer ?? ""),
          providerSubscriptionId: String(sub.id ?? ""),
          currentPeriodEnd: cpe ? new Date(cpe * 1000).toISOString() : null,
        };
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id || "";
        if (!userId) return "ignored";
        return {
          type: "subscription_expired",
          userId,
          plan: planFromMeta(sub.metadata),
          status: "expired",
          providerCustomerId: String(sub.customer ?? ""),
          providerSubscriptionId: String(sub.id ?? ""),
          currentPeriodEnd: null,
        };
      }

      // Tout le reste (invoice.*, paiements, etc.) : on s'appuie sur les events
      // d'abonnement ci-dessus (past_due remonte via subscription.updated).
      default:
        return "ignored";
    }
  }
}
