"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

function ResetInner() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setIsError(true);
      setMessage("Lien invalide ou expiré. Demande un nouveau lien.");
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setIsError(true);
        setMessage("Lien expiré. Demande un nouveau lien de réinitialisation.");
      } else {
        setReady(true);
      }
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setIsError(true);
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setMessage("");
    setIsError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setMessage("Mot de passe mis à jour ! Redirection…");
      setTimeout(() => router.push("/scan"), 1500);
    }
    setLoading(false);
  }

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">
            Nouveau mot de passe
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Choisis un nouveau mot de passe pour ton compte.
          </p>
        </div>

        {!ready && message && (
          <p className="text-sm text-signal">{message}</p>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text transition-colors"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Enregistrer le mot de passe
            </Button>
            {message && (
              <p className={`text-sm ${isError ? "text-signal" : "text-accent"}`}>
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
        </main>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
