import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        Scalpy
      </h1>
      <p className="mt-4 text-center text-lg text-muted">
        Scanne ton cuir chevelu par IA. Score de densité, stade Norwood, protocole personnalisé.
      </p>
      <Link
        href="/test-scan"
        className="mt-8 rounded-lg bg-accent px-6 py-3 font-medium text-background transition-colors hover:bg-accent-hover"
      >
        Scanner maintenant
      </Link>
    </main>
  );
}
