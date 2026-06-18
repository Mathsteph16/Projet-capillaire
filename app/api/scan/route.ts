import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Tu es un assistant de bien-être capillaire. À partir de la photo de cuir chevelu fournie, estime de façon indicative et non médicale : un score de densité sur 100, un stade approximatif sur l'échelle de Norwood (de I à VII), les zones les plus dégarnies (golfes, tempes, vertex, ligne frontale), et 3 recommandations de bien-être. Réponds UNIQUEMENT en JSON valide avec les clés : score (nombre), norwood (chaîne 'I' à 'VII'), zones (tableau de chaînes), recommandations (tableau de 3 chaînes), message (une phrase encourageante). Rappelle que c'est une estimation de bien-être, pas un avis médical. Si la photo est inexploitable, renvoie score: null et un message demandant une meilleure photo.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 500 }
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

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const client = new Anthropic({ apiKey });

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
