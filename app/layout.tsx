import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/nav";
import MobileNav from "@/components/mobile-nav";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

// Corps : grotesque humaniste propre et neutre (pas l'Inter générique des sites IA)
const bodyFont = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Titres : grotesque éditorial à forte personnalité (signature clinique-technique)
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Données : mono d'ingénierie (registre clinique), chiffres tabulaires pour score / stats / prix
const dataFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Scalpy ·Scanne tes cheveux, sache où tu en es",
  description:
    "Analyse ton cuir chevelu en 30 secondes. Score de densité, stade Norwood, zones fragiles et objectif visuel ·gratuit, depuis ton téléphone.",
  keywords: [
    "perte de cheveux",
    "scan capillaire",
    "densité capillaire",
    "Norwood",
    "bien-être capillaire",
    "analyse IA",
  ],
  openGraph: {
    title: "Scalpy ·Scanne tes cheveux, sache où tu en es",
    description:
      "Score de densité, stade Norwood et objectif visuel en 30 secondes.",
    type: "website",
    locale: "fr_FR",
    siteName: "Scalpy",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14161b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${bodyFont.variable} ${displayFont.variable} ${dataFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans pb-16 sm:pb-0">
        <header className="glass sticky top-0 z-50 border-b border-border/70">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-text"
            >
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none" aria-label="Scalpy" className="transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-hover:rotate-[30deg]">
                <circle cx="28" cy="28" r="22" stroke="var(--accent-light)" strokeOpacity=".25"/>
                <circle cx="28" cy="28" r="14" stroke="var(--accent-light)" strokeOpacity=".45"/>
                <circle cx="28" cy="28" r="3.4" fill="var(--accent-light)"/>
                <line x1="6" y1="28" x2="50" y2="28" stroke="var(--accent-light)" strokeWidth="1.6"/>
              </svg>
              <span className="font-display text-xl font-semibold tracking-[-0.02em]">Scalpy</span>
            </Link>
            <Nav />
          </div>
        </header>
        <ToastProvider>
          {children}
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
