export type Plan = "plus_monthly" | "plus_annual" | "pro";

export interface CheckoutInput {
  userId: string;
  plan: Plan;
  email: string;
}

export interface WebhookEvent {
  type: "subscription_created" | "subscription_updated" | "subscription_cancelled" | "subscription_expired";
  userId: string;
  plan: Plan;
  status: "active" | "canceled" | "expired";
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodEnd: string | null;
}

export interface BillingProvider {
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  /**
   * Retourne :
   * - un WebhookEvent à appliquer,
   * - "ignored" si la signature est VALIDE mais l'événement ne nous concerne pas
   *   (à répondre 200, sinon le prestataire retente en boucle),
   * - null si la signature est INVALIDE / absente (à répondre 401).
   */
  verifyWebhook(req: Request): Promise<WebhookEvent | "ignored" | null>;
  /** Annule l'abonnement chez le prestataire (stoppe les prélèvements). */
  cancelSubscription(subscriptionId: string): Promise<void>;
}

import { LemonSqueezyProvider } from "./lemonsqueezy";

export { LemonSqueezyProvider };

export function getBillingProvider(): BillingProvider {
  return new LemonSqueezyProvider();
}
