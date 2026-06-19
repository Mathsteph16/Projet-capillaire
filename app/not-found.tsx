import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <p className="text-6xl font-bold text-border">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-muted">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
