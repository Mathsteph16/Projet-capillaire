import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  return false;
}

const SYSTEM_PROMPT = `Tu es un assistant de bien-être capillaire. À partir de la photo de cuir chevelu fournie, estime de façon indicative et non médicale : un score de densité sur 100, un stade approximatif sur l'échelle de Norwood (de I à VII), les zones les plus dégarnies (golfes, tempes, vertex, ligne frontale), et 5 recommandations de bien-être concrètes et actionnables (produits, gestes, habitudes). Réponds UNIQUEMENT en JSON valide avec les clés : score (nombre), norwood (chaîne 'I' à 'VII'), zones (tableau de chaînes), recommandations (tableau de 5 chaînes), message (une phrase encourageante et bienveillante). Rappelle que c'est une estimation de bien-être, pas un avis médical. Si la photo est inexploitable, renvoie score: null et un message demandant une meilleure photo.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 500 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de scans en peu de temps. Réessaie dans une minute." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucune photo envoyée" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo trop lourde (max 10 Mo)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const client = new Anthropic({ apiKey, timeout: 30_000 });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Analyse cette photo de cuir chevelu.",
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Réponse non parseable", raw: text },
        { status: 502 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
