import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offres — Scalpy",
  description: "Protocole personnalisé, suivi de repousse et analyses comparatives.",
};

export default function PlusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
