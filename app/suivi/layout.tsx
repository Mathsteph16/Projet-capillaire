import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscriptions";

export const metadata: Metadata = {
  title: "Suivi de repousse · Scalpy",
  description: "Suis l'évolution de ton score de densité mois après mois.",
};

export default async function SuiviLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?next=/suivi");

  const active = await hasActiveSubscription(user.id);
  if (!active) redirect("/plus");

  return <>{children}</>;
}
