"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ProgressBar,
  Gauge,
  LockedOverlay,
  Disclaimer,
  Input,
  Checkbox,
  RadioCard,
  Stepper,
  Badge,
  PriceCard,
  ScanAnimation,
} from "@/components/ui";

export default function DesignPage() {
  const [progress, setProgress] = useState(45);
  const [selected, setSelected] = useState("b");
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState(2);

  return (
    <main className="mx-auto max-w-2xl space-y-16 px-5 py-12">
      <h1 className="text-[34px] font-bold leading-tight tracking-[-0.01em] text-text">
        Design System
      </h1>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Couleurs</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {[
            { name: "bg", color: "#0E0F12" },
            { name: "surface", color: "#16181D" },
            { name: "surface-2", color: "#1E2128" },
            { name: "border", color: "#262A32" },
            { name: "text", color: "#F2F3F5" },
            { name: "muted", color: "#9AA0A8" },
            { name: "faint", color: "#6B7178" },
            { name: "accent", color: "#16B981" },
            { name: "signal", color: "#F5A524" },
            { name: "danger", color: "#E5484D" },
          ].map((c) => (
            <div key={c.name} className="space-y-1.5 text-center">
              <div className="mx-auto h-12 w-12 rounded-[12px] border border-border" style={{ background: c.color }} />
              <p className="text-xs text-text-faint">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Boutons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="md">Primary</Button>
          <Button variant="secondary" size="md">Secondary</Button>
          <Button variant="ghost" size="md">Ghost</Button>
          <Button variant="danger" size="md">Danger</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="lg">CTA Principal</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md" loading>Loading</Button>
          <Button variant="primary" size="md" disabled>Disabled</Button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Cartes</h2>
        <Card>
          <p className="text-sm text-text-muted">Carte standard (surface)</p>
        </Card>
        <Card elevated>
          <p className="text-sm text-text-muted">Carte élevée (surface-2)</p>
        </Card>
      </section>

      {/* Progress */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Progression</h2>
        <ProgressBar value={progress} />
        <div className="flex gap-3">
          <Button size="sm" variant="secondary" onClick={() => setProgress(Math.max(0, progress - 20))}>-20</Button>
          <Button size="sm" variant="secondary" onClick={() => setProgress(Math.min(100, progress + 20))}>+20</Button>
        </div>
        <Stepper total={6} current={step} />
        <div className="flex gap-3">
          <Button size="sm" variant="secondary" onClick={() => setStep(Math.max(0, step - 1))}>Prev</Button>
          <Button size="sm" variant="secondary" onClick={() => setStep(Math.min(6, step + 1))}>Next</Button>
        </div>
      </section>

      {/* Gauge */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Jauge</h2>
        <div className="flex flex-wrap gap-8 justify-center">
          <Gauge score={72} />
          <Gauge score={45} label="Score moyen" />
          <Gauge score={25} label="Score bas" />
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent">Recommandé</Badge>
          <Badge variant="signal">Le plus choisi</Badge>
          <Badge variant="danger">Alerte</Badge>
        </div>
      </section>

      {/* Form */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Formulaire</h2>
        <Input label="Email" type="email" placeholder="ton@email.com" />
        <Input label="Erreur" error="Ce champ est requis" />
        <Checkbox
          label="J'accepte que ma photo soit analysée pour générer mon bilan."
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
      </section>

      {/* RadioCard */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">RadioCard</h2>
        <div className="space-y-2.5">
          {["a", "b", "c"].map((v) => (
            <RadioCard
              key={v}
              label={`Option ${v.toUpperCase()}`}
              selected={selected === v}
              onClick={() => setSelected(v)}
            />
          ))}
        </div>
      </section>

      {/* LockedOverlay */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">LockedOverlay</h2>
        <LockedOverlay ctaLabel="Débloquer mon protocole complet" href="/plus">
          <Card>
            <p className="text-sm text-text">Contenu verrouillé qui donne envie...</p>
            <p className="mt-2 text-sm text-text-muted">
              Un protocole personnalisé sur 30 jours, avec des recommandations
              adaptées à ta situation.
            </p>
          </Card>
        </LockedOverlay>
      </section>

      {/* Disclaimer */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Disclaimer</h2>
        <Disclaimer />
      </section>

      {/* PriceCard */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">PriceCard</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <PriceCard
            name="Plus Mensuel"
            price="14,99 €"
            period="mois"
            features={[
              "Projection complète",
              "Protocole 30 jours",
              "Suivi mensuel",
            ]}
          />
          <PriceCard
            name="Plus Annuel"
            price="79 €"
            period="an"
            equivalent="~6,58 €/mois"
            savings="Économie ~56 % vs mensuel"
            badge="Le plus choisi"
            featured
            features={[
              "Projection complète",
              "Protocole 30 jours",
              "Suivi mensuel",
            ]}
          />
          <PriceCard
            name="Pro"
            price="149 €"
            period="an"
            features={[
              "Tout Plus",
              "Re-scans illimités",
              "Suivi avancé",
              "Accès prioritaire",
            ]}
          />
        </div>
      </section>

      {/* Scan Animation */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-text">Scan Animation</h2>
        <ScanAnimation
          photoUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' fill='%231E2128'%3E%3Crect width='300' height='300'/%3E%3Ctext x='150' y='150' fill='%239AA0A8' text-anchor='middle' dy='.35em' font-size='14'%3EPhoto%3C/text%3E%3C/svg%3E"
          steps={[
            "Analyse de la densité…",
            "Détection des zones fragiles…",
            "Estimation du stade…",
            "Construction de ton bilan…",
          ]}
          currentStep={2}
        />
      </section>
    </main>
  );
}
