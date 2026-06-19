import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suivi de repousse — Scalpy",
  description: "Suis l'évolution de ton score de densité mois après mois.",
};

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return children;
}
