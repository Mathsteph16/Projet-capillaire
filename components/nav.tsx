"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

export default function Nav() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    show("Déconnecté");
    router.push("/");
  }

  return (
    <nav className="flex items-center gap-1 text-sm sm:gap-4">
      <Link href="/scan" className="rounded-[12px] px-3 py-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
        Scanner
      </Link>
      <Link href="/suivi" className="hidden rounded-[12px] px-3 py-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:block">
        Suivi
      </Link>
      <Link href="/plus" className="hidden rounded-[12px] px-3 py-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:block">
        Offres
      </Link>
      {user ? (
        <button
          onClick={handleLogout}
          className="ml-1 rounded-[12px] border border-border px-4 py-1.5 font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:ml-2"
        >
          Déconnexion
        </button>
      ) : (
        <Link
          href="/auth"
          className="ml-1 rounded-[var(--radius-md)] bg-accent px-4 py-1.5 font-medium text-accent-foreground transition-colors hover:bg-accent-hover sm:ml-2"
        >
          Connexion
        </Link>
      )}
    </nav>
  );
}
