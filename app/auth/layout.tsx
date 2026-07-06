import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion · Scalpy",
  description: "Connecte-toi ou crée ton compte pour accéder à ton scan capillaire.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
