"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <p className="text-4xl font-bold text-border">Oups</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Quelque chose s'est mal passé
      </h1>
      <p className="mt-2 text-sm text-muted">
        Pas de panique — réessaie et ça devrait marcher.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
      >
        Réessayer
      </button>
    </main>
  );
}
