"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, ScoreMark } from "@/components/ui";

export default function Success() {
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (data?.status === "active") {
        setStatus("active");
        setTimeout(() => router.push("/app"), 2000);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("pending");
        return;
      }

      setTimeout(check, 3000);
    }

    check();
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md text-center space-y-4">
        {status === "checking" && (
          <>
            <div className="flex justify-center"><ScoreMark size={40} spin value={0.7} /></div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">Activation en cours</h1>
            <p className="text-sm text-text-muted">
              On prépare ton espace. Ça ne prend que quelques secondes.
            </p>
          </>
        )}
        {status === "active" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">C'est activé.</h1>
            <p className="text-sm text-text-muted">
              Ton plan est prêt. On t'emmène à ton espace.
            </p>
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">
              Presque prêt
            </h1>
            <p className="text-sm text-text-muted">
              Le paiement est en cours de traitement. Ton accès sera activé
              dans quelques minutes.
            </p>
            <Button variant="primary" onClick={() => router.push("/app")}>
              Aller à mon espace
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
