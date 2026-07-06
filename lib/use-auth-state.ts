"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Etat de session partage par la navigation, pour montrer le bon menu :
// - "out"        : visiteur non connecte (site vitrine)
// - "free"       : connecte sans abonnement actif (a fait/peut faire son scan)
// - "subscriber" : abonnement actif (a acces a son espace /app)
export type AuthState = "loading" | "out" | "free" | "subscriber";

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function resolve() {
      // getSession() lit la session en LOCAL (instantané) au lieu de getUser()
      // qui fait un aller-retour réseau lent -> la nav s'affiche tout de suite.
      let hasUser = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        hasUser = !!session?.user;
        if (!session?.user) { setState("out"); return; }
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!active) return;
        setState(sub?.status === "active" ? "subscriber" : "free");
      } catch {
        // Ne JAMAIS rester coincé sur "loading" (sinon la nav mobile disparaît) :
        // on dégrade proprement selon qu'on a vu une session ou non.
        if (active) setState(hasUser ? "free" : "out");
      }
    }

    resolve();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => resolve());
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return state;
}
