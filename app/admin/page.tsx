"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

interface TunnelStats {
  cta_clicks: number;
  onboarding_started: number;
  onboarding_completed: number;
  scan_started: number;
  scan_completed: number;
  result_viewed: number;
  paywall_viewed: number;
  checkout_started: number;
  purchase_completed: number;
  active_subs: number;
  canceled_subs: number;
  rescan_count: number;
  arpu: number;
  variants: Record<string, { views: number; purchases: number }>;
}

const TUNNEL_STEPS = [
  { key: "cta_clicks", label: "CTA cliqués" },
  { key: "onboarding_started", label: "Quiz commencé" },
  { key: "onboarding_completed", label: "Quiz terminé" },
  { key: "scan_started", label: "Scan lancé" },
  { key: "scan_completed", label: "Scan terminé" },
  { key: "result_viewed", label: "Résultat vu" },
  { key: "paywall_viewed", label: "Paywall vu" },
  { key: "checkout_started", label: "Checkout lancé" },
  { key: "purchase_completed", label: "Achat complété" },
] as const;

export default function AdminPage() {
  const [stats, setStats] = useState<TunnelStats | null>(null);
  const [period, setPeriod] = useState(7);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin?days=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Erreur de chargement"));
  }, [period]);

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-10">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-text">Admin</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="rounded-[12px] border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value={1}>Aujourd'hui</option>
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {stats && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="text-center">
                <p className="font-data text-[20px] font-medium text-accent">{stats.active_subs}</p>
                <p className="text-xs text-text-faint">Abonnés actifs</p>
              </Card>
              <Card className="text-center">
                <p className="font-data text-[20px] font-medium text-text">{stats.canceled_subs}</p>
                <p className="text-xs text-text-faint">Résiliés</p>
              </Card>
              <Card className="text-center">
                <p className="font-data text-[20px] font-medium text-text">{stats.rescan_count}</p>
                <p className="text-xs text-text-faint">Re-scans</p>
              </Card>
              <Card className="text-center">
                <p className="font-data text-[20px] font-medium text-signal">{stats.arpu.toFixed(2)} EUR</p>
                <p className="text-xs text-text-faint">ARPU</p>
              </Card>
            </div>

            {/* Tunnel */}
            <Card>
              <h2 className="mb-4 text-[17px] font-semibold text-text">
                Tunnel de conversion
              </h2>
              <div className="space-y-2">
                {TUNNEL_STEPS.map((step, i) => {
                  const count = stats[step.key as keyof TunnelStats] as number;
                  const prevCount = i > 0
                    ? (stats[TUNNEL_STEPS[i - 1].key as keyof TunnelStats] as number)
                    : count;
                  const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;

                  return (
                    <div key={step.key} className="flex items-center justify-between rounded-[8px] border border-border bg-bg px-3 py-2">
                      <span className="text-sm text-text-muted">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text">{count}</span>
                        {i > 0 && (
                          <Badge variant={rate >= 50 ? "accent" : rate >= 20 ? "signal" : "danger"}>
                            {rate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* A/B Variants */}
            {Object.keys(stats.variants).length > 0 && (
              <Card>
                <h2 className="mb-4 text-[17px] font-semibold text-text">
                  Variants A/B
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-text-muted">
                        <th className="pb-2 font-medium">Variant</th>
                        <th className="pb-2 text-right font-medium">Vues</th>
                        <th className="pb-2 text-right font-medium">Achats</th>
                        <th className="pb-2 text-right font-medium">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.variants).map(([name, v]) => (
                        <tr key={name} className="border-b border-border/50">
                          <td className="py-2 text-text">{name}</td>
                          <td className="py-2 text-right text-text-muted">{v.views}</td>
                          <td className="py-2 text-right text-text-muted">{v.purchases}</td>
                          <td className="py-2 text-right font-semibold text-accent">
                            {v.views > 0 ? ((v.purchases / v.views) * 100).toFixed(1) : "0.0"}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
