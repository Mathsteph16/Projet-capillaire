const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "Scalpy <noreply@scalpy.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.scalpy-app.com";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[Resend] Échec (${res.status}) pour ${to}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Resend] Erreur réseau pour ${to}:`, err);
    return false;
  }
}

function wrap(content: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0E0F12;color:#F2F3F5;padding:32px 20px;max-width:480px;margin:0 auto;"><div style="background:#16181D;border-radius:16px;padding:24px;">${content}</div><p style="color:#6B7178;font-size:12px;text-align:center;margin-top:20px;">Scalpy · Estimation de bien-être, pas un avis médical.<br/><a href="${APP_URL}/confidentialite" style="color:#9AA0A8;">Confidentialité</a> · <a href="${APP_URL}/api/unsubscribe" style="color:#9AA0A8;">Se désinscrire</a></p></body></html>`;
}

function cta(label: string, href: string): string {
  return `<a href="${APP_URL}${href}" style="display:inline-block;background:#16B981;color:#06231A;font-weight:600;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:16px;">${label}</a>`;
}

export function emailWelcome(): { subject: string; html: string } {
  return {
    subject: "Bienvenue sur Scalpy. Ton bilan t'attend.",
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Bienvenue sur Scalpy</h1><p style="color:#9AA0A8;">Tu viens de faire le premier pas. Ton bilan capillaire t'attend : un score de densité, tes zones fragiles, et un objectif visuel concret.</p><p style="color:#9AA0A8;">Tes photos restent privées, hébergées en Europe.</p>${cta("Faire mon scan", "/scan")}`),
  };
}

export function emailScanAbandoned(): { subject: string; html: string } {
  return {
    subject: "Il te reste une photo pour ton bilan.",
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Ton bilan t'attend</h1><p style="color:#9AA0A8;">Tu as commencé, il ne te reste plus qu'une photo. Ça prend 30 secondes.</p>${cta("Terminer mon scan", "/scan")}`),
  };
}

export function emailPaywallAbandoned(objectif: string): { subject: string; html: string } {
  return {
    subject: `Ton plan pour ${objectif} est prêt à être débloqué.`,
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Ton plan t'attend</h1><p style="color:#9AA0A8;">Ta projection complète, ton protocole 30 jours et ton suivi mensuel sont prêts. Débloque ton espace pour avancer.</p>${cta("Voir les offres", "/plus")}`),
  };
}

export function emailProgramNudge(day: number): { subject: string; html: string } {
  const subjects: Record<number, string> = {
    1: "Jour 1 : on commence simple.",
    3: "Jour 3 : tu tiens le bon rythme.",
    7: "Ton point sur la semaine.",
  };
  return {
    subject: subjects[day] || `Jour ${day} de ton programme`,
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Ton programme avance</h1><p style="color:#9AA0A8;">Chaque petit geste compte. Sois régulier, les effets prennent du temps, et c'est la constance qui fait la différence.</p>${cta("Ouvrir mon plan", "/app")}`),
  };
}

export function emailRescanReminder(): { subject: string; html: string } {
  return {
    subject: "C'est l'heure de ton re-scan.",
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Refais un scan</h1><p style="color:#9AA0A8;">Ça fait un mois. Refais un scan pour voir ta courbe d'évolution et mesurer ta progression.</p>${cta("Faire mon re-scan", "/scan")}`),
  };
}

export function emailWinback(): { subject: string; html: string } {
  return {
    subject: "Reprends ton suivi quand tu veux.",
    html: wrap(`<h1 style="font-size:22px;margin:0 0 12px;">Ton suivi t'attend</h1><p style="color:#9AA0A8;">Tes scans et ta progression sont toujours là. Tu peux reprendre quand tu veux, à ton rythme.</p>${cta("Réactiver mon plan", "/plus")}`),
  };
}
