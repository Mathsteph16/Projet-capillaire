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
  verifyWebhook(req: Request): Promise<WebhookEvent | null>;
  /** Annule l'abonnement chez le prestataire (stoppe les prélèvements). */
  cancelSubscription(subscriptionId: string): Promise<void>;
}

import { LemonSqueezyProvider } from "./lemonsqueezy";

export { LemonSqueezyProvider };

export function getBillingProvider(): BillingProvider {
  return new LemonSqueezyProvider();
}
