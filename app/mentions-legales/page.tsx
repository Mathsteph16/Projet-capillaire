import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales · Scalpy",
};

export default function MentionsLegales() {
  return (
    <main className="flex flex-1 flex-col items-center px-5 py-12">
      <article className="w-full max-w-2xl space-y-8 text-sm leading-relaxed text-muted">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em] text-foreground">
          Mentions légales
        </h1>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Éditeur</h2>
          <p>
            Scalpy est édité par Mathias Stephant, entrepreneur individuel.
          </p>
          <p>Email : mathias.stephant@gmail.com</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Hébergement
          </h2>
          <p>
            Le site est hébergé par Railway Corporation, 548 Market St, San
            Francisco, CA 94104, États-Unis.
          </p>
          <p>
            Les données utilisateur sont stockées par Supabase Inc., 970 Toa
            Payoh North #07-04, Singapore 318992.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Nature du service
          </h2>
          <p>
            Scalpy propose une estimation de bien-être capillaire basée sur
            l'analyse visuelle automatisée. Les résultats
            fournis (score de densité, stade Norwood, recommandations) sont
            purement indicatifs et ne constituent en aucun cas un diagnostic
            médical, un avis dermatologique, ni une prescription de traitement.
          </p>
          <p>
            Pour tout problème de santé capillaire, consulte un dermatologue ou
            un médecin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Propriété intellectuelle
          </h2>
          <p>
            L'ensemble du contenu du site (textes, interface, code, marque
            Scalpy) est la propriété exclusive de Mathias Stephant. Toute
            reproduction sans autorisation écrite est interdite.
          </p>
        </section>

        <p className="text-xs">Dernière mise à jour : juin 2026</p>

        <Link
          href="/"
          className="inline-block text-accent transition-colors hover:underline"
        >
          ← Retour à l'accueil
        </Link>
      </article>
    </main>
  );
}
