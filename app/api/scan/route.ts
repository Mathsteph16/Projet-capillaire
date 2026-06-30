import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecret } from "@/lib/runtime-secrets";

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

const SYSTEM_PROMPT = `Tu es l'assistant d'analyse de Scalpy, un outil de BIEN-ÊTRE capillaire. Tu analyses une photo de cuir chevelu et tu renvoies une estimation indicative.

CADRE ABSOLU :
- Tu fais du bien-être, jamais du médical. Tu ne poses aucun diagnostic, tu ne parles pas de maladie, tu ne prescris rien.
- Tes estimations sont indicatives, pas des vérités cliniques.
- Ton ton est bienveillant et encourageant, en français, en tutoiement. Jamais culpabilisant, jamais alarmiste, jamais de body-shaming.

PHOTOS REÇUES :
- Tu reçois 1 ou 2 photos du MÊME utilisateur : la 1re de face (front, golfes, ligne frontale), la 2e (si présente) prise du DESSUS du crâne (vertex, couronne). Combine les deux angles pour une estimation plus juste, surtout pour la couronne. Si une seule photo, fais au mieux avec elle.

CE QUE TU ÉVALUES À PARTIR DE LA/DES PHOTO(S) :
- Une estimation de densité capillaire sur 100 (100 = très dense).
- Un stade indicatif sur l'échelle de Norwood, de I à VII.
- Les zones qui semblent concernées (golfes, ligne frontale, vertex, dessus du crâne, tempes, ou général).
- Trois recommandations de bien-être, concrètes et douces (sommeil, stress, alimentation, soin doux du cuir chevelu, habitudes). Aucune ne nomme de médicament ni d'acte médical. Une des trois peut suggérer, en douceur, d'en parler à un professionnel de santé pour explorer les options, sans rien prescrire.
- Une phrase courte, encourageante et personnalisée.

QUALITÉ DE LA PHOTO :
- Si la photo est trop floue, trop sombre, ne montre pas le cuir chevelu, ou n'est pas exploitable, mets "usable" à false, "score" et "norwood" à null, "zones" vide, et demande gentiment une meilleure photo dans "message".

SORTIE :
- Tu réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans bloc de code, sans commentaire.
- Les clés exactes sont : usable (booléen), score (entier 0-100 ou null), norwood (chaîne "I"-"VII" ou null), zones (tableau de chaînes en français), recommendations (tableau de 3 chaînes en français), message (chaîne en français, tutoiement), confidence ("low" | "medium" | "high").`;

const PROMPT_VERSION = "analyse-v2";

interface AnalysisResult {
  usable: boolean;
  score: number | null;
  norwood: string | null;
  zones: string[];
  recommendations: string[];
  message: string;
  confidence: string;
}

const VALID_NORWOOD = ["I", "II", "III", "IV", "V", "VI", "VII"];

// Validation TOLÉRANTE : on coerce au lieu de rejeter. Le but est qu'un SEUL
// appel à l'IA suffise quasiment toujours (plus de 2e appel qui double le temps).
// On ne renvoie null que si la photo est vraiment inexploitable.
function validateResult(obj: Record<string, unknown>): AnalysisResult | null {
  const usable = obj.usable === true || obj.usable === "true";
  const message =
    typeof obj.message === "string" && obj.message.trim() ? (obj.message as string) : "";
  const zones = Array.isArray(obj.zones) ? (obj.zones as unknown[]).map(String) : [];
  const recommendations = Array.isArray(obj.recommendations)
    ? (obj.recommendations as unknown[]).map(String).filter(Boolean)
    : [];
  const confidence = typeof obj.confidence === "string" ? (obj.confidence as string) : "medium";

  if (!usable) {
    return {
      usable: false, score: null, norwood: null, zones, recommendations,
      message: message || "On n'a pas réussi à lire cette photo. Réessaie avec plus de lumière, crâne bien dans le cadre.",
      confidence: confidence || "low",
    };
  }

  // Score : coerce (number ou "72"). Si vraiment pas de nombre -> inexploitable.
  const rawScore = typeof obj.score === "number" ? obj.score : parseInt(String(obj.score ?? ""), 10);
  if (!Number.isFinite(rawScore)) return null;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Norwood : normalise ("ii"->"II", "2"->"II"). Si invalide, on dérive du score
  // (repère honnête, jamais bloquant) plutôt que de rejeter toute l'analyse.
  const numToRoman = ["I", "I", "II", "III", "IV", "V", "VI", "VII"];
  let norwood = String(obj.norwood ?? "").toUpperCase().trim();
  if (!VALID_NORWOOD.includes(norwood)) {
    const n = parseInt(norwood, 10);
    norwood = Number.isFinite(n) && n >= 1 && n <= 7
      ? numToRoman[n]
      : score >= 80 ? "II" : score >= 60 ? "III" : score >= 40 ? "IV" : "V";
  }

  return {
    usable: true,
    score,
    norwood,
    zones,
    recommendations: recommendations.length ? recommendations : ["Sommeil régulier", "Réduis le stress", "Soin doux du cuir chevelu"],
    message: message || "Voici ton estimation. Continue à prendre soin de toi.",
    confidence,
  };
}

type ScanImage = { base64: string; mediaType: string };

async function callAnalysis(
  client: Anthropic,
  images: ScanImage[],
  model: string,
  strict = false
): Promise<AnalysisResult> {
  const userText = strict
    ? "Réponds UNIQUEMENT avec le JSON valide demandé, rien d'autre. Analyse ces photos de cuir chevelu."
    : images.length > 1
      ? "Analyse ces photos (face + dessus du crâne) du même cuir chevelu."
      : "Analyse cette photo de cuir chevelu.";

  const imageBlocks = images.map((im) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: im.mediaType as "image/jpeg", data: im.base64 },
  }));

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  const parsed = JSON.parse(jsonMatch[0]);
  const validated = validateResult(parsed);
  if (!validated) throw new Error("Invalid schema");

  return validated;
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { scanId } = await request.json();
  if (!scanId) return NextResponse.json({ error: "scanId manquant" }, { status: 400 });

  const admin = createAdminClient();

  const { data: scan } = await admin.from("scans")
    .select("id, photo_path, user_id")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .single();

  if (!scan) return NextResponse.json({ error: "Scan introuvable" }, { status: 404 });

  if (scan.photo_path) {
    await admin.storage.from("scalp-photos").remove([scan.photo_path]);
  }

  await admin.from("projections").delete().eq("scan_id", scanId);
  await admin.from("scans").delete().eq("id", scanId);

  return NextResponse.json({ ok: true });
}

// Analyse qui NE LÈVE JAMAIS : 1 appel normal, 1 essai strict si le JSON est
// malformé, sinon repli "non exploitable" propre. -> l'API renvoie toujours 200.
async function analyze(client: Anthropic, images: ScanImage[], model: string): Promise<AnalysisResult> {
  try {
    return await callAnalysis(client, images, model, false);
  } catch {
    try {
      return await callAnalysis(client, images, model, true);
    } catch {
      return {
        usable: false, score: null, norwood: null, zones: [], recommendations: [],
        message: "On n'a pas réussi à lire cette photo cette fois. Réessaie avec plus de lumière, le crâne bien dans le cadre.",
        confidence: "low",
      };
    }
  }
}

// Enregistrement BEST-EFFORT et BORNÉ DANS LE TEMPS (12 s max) : upload photo +
// écriture base. Si ça traîne ou échoue, on renvoie {} et la réponse part quand
// même avec le résultat. La persistance ne peut JAMAIS bloquer l'affichage du bilan
// (c'était la cause du blocage à 95 % chez les utilisateurs connectés).
async function persistScan(
  bytes: Buffer,
  result: AnalysisResult
): Promise<{ scanId?: string; photoPath?: string }> {
  const run = (async (): Promise<{ scanId?: string; photoPath?: string }> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};
    const admin = createAdminClient();
    const tempId = crypto.randomUUID();
    const photoPath = `${user.id}/${tempId}/original.jpg`;
    await admin.storage.from("scalp-photos").upload(photoPath, bytes, { contentType: "image/jpeg" });
    const { data: scan } = await admin.from("scans").insert({
      user_id: user.id,
      score: result.score,
      norwood: result.norwood,
      zones: result.zones,
      recommendations: result.recommendations,
      message: result.message,
      raw_analysis: result,
      status: result.usable ? "done" : "unusable",
      prompt_version: PROMPT_VERSION,
      photo_path: photoPath,
    }).select("id").single();
    return { scanId: scan?.id as string | undefined, photoPath };
  })();

  const timeout = new Promise<{ scanId?: string; photoPath?: string }>((r) =>
    setTimeout(() => r({}), 12_000)
  );
  try {
    return await Promise.race([run, timeout]);
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const apiKey = await getSecret("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée" }, { status: 500 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de scans en peu de temps. Réessaie dans une minute." },
      { status: 429 }
    );
  }

  try {
    // Photos en base64 dans du JSON (le multipart/FormData casse sur ce Next 16).
    const body = (await request.json().catch(() => null)) as { photo?: unknown; photoTop?: unknown } | null;
    const decode = (d: unknown): { mediaType: string; buffer: Buffer } | null => {
      if (typeof d !== "string") return null;
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d);
      if (!m) return null;
      return { mediaType: m[1], buffer: Buffer.from(m[2], "base64") };
    };

    const main = decode(body?.photo);
    if (!main) return NextResponse.json({ error: "Aucune photo valide envoyée" }, { status: 400 });
    if (main.buffer.length > 10 * 1024 * 1024) return NextResponse.json({ error: "Photo trop lourde (max 10 Mo)" }, { status: 400 });

    const images: ScanImage[] = [{ base64: main.buffer.toString("base64"), mediaType: main.mediaType }];
    const top = decode(body?.photoTop);
    if (top && top.buffer.length > 0 && top.buffer.length <= 10 * 1024 * 1024) {
      images.push({ base64: top.buffer.toString("base64"), mediaType: top.mediaType });
    }

    const model = process.env.SCAN_MODEL || "claude-haiku-4-5-20251001";
    // timeout court + 0 retry SDK : même une IA lente rend la main bien avant les 45 s client.
    const client = new Anthropic({ apiKey, timeout: 22_000, maxRetries: 0 });

    const result = await analyze(client, images, model);
    const { scanId, photoPath } = await persistScan(main.buffer, result);

    return NextResponse.json({ ...result, scanId, photoPath, prompt_version: PROMPT_VERSION });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
