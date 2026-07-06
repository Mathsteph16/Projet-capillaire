export type Plan = "plus_monthly" | "plus_annual" | "pro";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused" | "past_due" | "refunded";

export interface CheckoutInput {
  userId: string;
  plan: Plan;
  email: string;
}

export interface WebhookEvent {
  type:
    | "subscription_created"
    | "subscription_updated"
    | "subscription_cancelled"
    | "subscription_expired"
    | "subscription_paused"
    | "subscription_unpaused"
    | "subscription_payment_success"
    | "subscription_payment_failed"
    | "order_created"
    | "order_refunded";
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerEmail: string | null;
  variantId: string;
}

export interface BillingProvider {
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  verifyWebhook(req: Request): Promise<WebhookEvent | null>;
}

export { LemonSqueezyProvider } from "./lemonsqueezy";

export function getBillingProvider(): BillingProvider {
  return new (require("./lemonsqueezy").LemonSqueezyProvider)();
}
