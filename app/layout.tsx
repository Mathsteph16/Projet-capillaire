import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scalpy — Scan capillaire par IA",
  description:
    "Diagnostic de densité, suivi de repousse et protocole personnalisé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            Scalpy
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/connexion"
              className="text-muted transition-colors hover:text-foreground"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-accent px-4 py-1.5 font-medium text-background transition-colors hover:bg-accent-hover"
            >
              S'inscrire
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
