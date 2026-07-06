import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      // Chunks JS/CSS : hashés et immuables -> cache long (vitesse), aucun risque
      // de servir du vieux code (le nom du fichier change à chaque build).
      {
        source: "/_next/static/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Tout le reste (HTML des pages, API) : JAMAIS mis en cache -> le navigateur
      // charge TOUJOURS le code à jour. Fini le "bloqué sur l'ancien code".
      {
        source: "/((?!_next/static).*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
