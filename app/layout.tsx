import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/nav";
import MobileNav from "@/components/mobile-nav";
import CookieBanner from "@/components/cookie-banner";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Scalpy — Scanne tes cheveux, sache où tu en es",
  description:
    "Analyse ton cuir chevelu en 30 secondes. Score de densité, stade Norwood, zones fragiles et objectif visuel — gratuit, depuis ton téléphone.",
  keywords: [
    "perte de cheveux",
    "scan capillaire",
    "densité capillaire",
    "Norwood",
    "bien-être capillaire",
    "analyse IA",
  ],
  openGraph: {
    title: "Scalpy — Scanne tes cheveux, sache où tu en es",
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
  themeColor: "#0E0F12",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans pb-16 sm:pb-0">
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-text"
            >
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none" aria-label="Scalpy">
                <circle cx="28" cy="28" r="22" stroke="#34D399" strokeOpacity=".25"/>
                <circle cx="28" cy="28" r="14" stroke="#34D399" strokeOpacity=".45"/>
                <circle cx="28" cy="28" r="3.4" fill="#34D399"/>
                <line x1="6" y1="28" x2="50" y2="28" stroke="#34D399" strokeWidth="1.6"/>
              </svg>
              <span className="font-display text-xl font-semibold tracking-[-0.02em]">Scalpy</span>
            </Link>
            <Nav />
          </div>
        </header>
        <ToastProvider>
          {children}
          <MobileNav />
          <CookieBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
