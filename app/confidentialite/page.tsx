import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Scalpy",
};

export default function Confidentialite() {
  return (
    <main className="flex flex-1 flex-col items-center px-5 py-12">
      <article className="w-full max-w-2xl space-y-8 text-sm leading-relaxed text-muted">
        <h1 className="text-2xl font-semibold text-foreground">
          Politique de confidentialité
        </h1>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Responsable du traitement
          </h2>
          <p>
            Mathias Stephant — mathias.stephant@gmail.com
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Données collectées
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <span className="text-foreground">Compte</span> : adresse email,
              mot de passe (hashé), nom si connexion Google.
            </li>
            <li>
              <span className="text-foreground">Scan</span> : photo de cuir
              chevelu, score de densité, stade Norwood, zones détectées.
            </li>
            <li>
              <span className="text-foreground">Onboarding</span> : réponses au
              questionnaire (durée de perte, zone, traitement, objectif).
            </li>
            <li>
              <span className="text-foreground">Événements</span> : actions
              clés (inscription, scan complété) à des fins de statistiques
              internes.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Finalité du traitement
          </h2>
          <p>
            Les données sont utilisées exclusivement pour fournir le service
            (analyse capillaire, suivi, recommandations) et améliorer
            l'expérience utilisateur via des statistiques anonymisées.
          </p>
          <p>
            Aucune donnée n'est vendue, louée ou transmise à des tiers à des
            fins commerciales.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Traitement des photos
          </h2>
          <p>
            Les photos de cuir chevelu sont transmises à l'API Claude
            (Anthropic) pour analyse. Elles ne sont pas conservées par Anthropic
            au-delà du traitement de la requête. Les photos sont stockées dans
            ton espace personnel sécurisé sur Supabase et ne sont accessibles
            qu'à toi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Durée de conservation
          </h2>
          <p>
            Tes données sont conservées tant que ton compte est actif. Tu peux
            demander la suppression de ton compte et de toutes les données
            associées à tout moment par email.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Cookies
          </h2>
          <p>
            Scalpy utilise uniquement des cookies essentiels au fonctionnement
            du site (authentification, session). Aucun cookie de tracking
            publicitaire n'est utilisé.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Tes droits (RGPD)
          </h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données, tu
            disposes d'un droit d'accès, de rectification, de suppression, de
            portabilité et d'opposition sur tes données personnelles.
          </p>
          <p>
            Pour exercer ces droits, contacte-nous à{" "}
            <a
              href="mailto:mathias.stephant@gmail.com"
              className="text-accent hover:underline"
            >
              mathias.stephant@gmail.com
            </a>
            . Nous répondrons sous 30 jours.
          </p>
          <p>
            Tu peux également déposer une réclamation auprès de la CNIL :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              www.cnil.fr
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Hébergement et sous-traitants
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <span className="text-foreground">Railway</span> (hébergement
              applicatif) — États-Unis
            </li>
            <li>
              <span className="text-foreground">Supabase</span> (base de
              données, stockage, authentification) — Singapour
            </li>
            <li>
              <span className="text-foreground">Anthropic</span> (analyse IA
              des photos) — États-Unis
            </li>
            <li>
              <span className="text-foreground">Google</span> (authentification
              OAuth, optionnel) — États-Unis
            </li>
          </ul>
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
