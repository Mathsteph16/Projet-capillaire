"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { ScoreMark } from "@/components/ui";

function AuthInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/scan";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">
            Content de te revoir
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Connecte-toi pour retrouver tes résultats.
          </p>
        </div>
        <AuthForm mode="login" redirectTo={next} />
      </div>
    </main>
  );
}

export default function Auth() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <ScoreMark size={40} spin value={0.7} />
        </main>
      }
    >
      <AuthInner />
    </Suspense>
  );
}
