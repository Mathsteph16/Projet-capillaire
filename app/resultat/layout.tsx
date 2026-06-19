import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ton résultat — Scalpy",
  description: "Score de densité, stade Norwood et zones à surveiller.",
};

export default function ResultatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
