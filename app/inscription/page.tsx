"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Inscription() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Vérifie ta boîte mail pour confirmer ton inscription.");
    }
    setLoading(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Inscription</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          type="password"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-3 font-medium text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Envoi…" : "Créer mon compte"}
        </button>

        {message && <p className="text-sm text-signal">{message}</p>}

        <p className="text-sm text-muted">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-accent hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
