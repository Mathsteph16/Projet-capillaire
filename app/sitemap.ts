import type { MetadataRoute } from "next";

const BASE = "https://projet-capillaire-production.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/plus`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
