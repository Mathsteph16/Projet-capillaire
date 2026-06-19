import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan capillaire — Scalpy",
  description: "Prends une photo de ton crâne et obtiens ton score de densité en 30 secondes.",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
