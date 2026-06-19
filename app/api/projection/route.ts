import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEventServer } from "@/lib/track-server";

const PROJECTION_PROMPT = `Edit this real photo of a person. Keep the SAME person with identical facial features, age, skin tone, expression, head pose, camera framing, lighting, and background. Do not beautify, smooth, or change the face in any way.

Modify ONLY the hair: show a realistic, believable increase in hair density and coverage in the thinning or balding areas, as if this same person's own hair had become naturally fuller. Keep it realistic and attainable, not a perfect or exaggerated full head of hair. The hairline shape and the added density must look natural and consistent with this individual. Match the original hair color and texture exactly.

The result must clearly be the same person, just with denser hair. Do not add any text, watermark, or graphic overlay. Output only the edited image.`;

const PROMPT_VERSION = "projection-v1";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { scanId, photoPath } = await req.json();
    if (!scanId || !photoPath) {
      return NextResponse.json({ error: "scanId et photoPath requis" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if projection already exists
    const { data: existing } = await admin
      .from("projections")
      .select("id, status")
      .eq("scan_id", scanId)
      .eq("user_id", user.id)
      .single();

    if (existing && existing.status === "done") {
      return NextResponse.json({ ok: true, status: "already_done" });
    }

    // Create projection record
    const projectionId = existing?.id || crypto.randomUUID();
    if (!existing) {
      await admin.from("projections").insert({
        id: projectionId,
        user_id: user.id,
        scan_id: scanId,
        status: "generating",
        provider: "nano-banana",
        prompt_version: PROMPT_VERSION,
      });
    } else {
      await admin.from("projections").update({ status: "generating" }).eq("id", projectionId);
    }

    await trackEventServer("projection_started", {}, { userId: user.id });

    // Get original photo
    const { data: photoData } = await admin.storage
      .from("scalp-photos")
      .download(photoPath);

    if (!photoData) {
      // try old bucket
      const { data: fallbackPhoto } = await admin.storage
        .from("photos")
        .download(photoPath);
      if (!fallbackPhoto) {
        await admin.from("projections").update({ status: "failed" }).eq("id", projectionId);
        return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
      }
    }

    // Try fal.ai (Nano Banana) first
    let success = false;
    const falKey = process.env.FAL_KEY;

    if (falKey && photoData) {
      try {
        const base64 = Buffer.from(await photoData.arrayBuffer()).toString("base64");
        const imageUrl = `data:image/jpeg;base64,${base64}`;

        const falRes = await fetch("https://fal.run/fal-ai/gemini-2-flash/image", {
          method: "POST",
          headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: PROJECTION_PROMPT,
            image_url: imageUrl,
          }),
        });

        if (falRes.ok) {
          const falResult = await falRes.json();
          const imageUrlResult = falResult.images?.[0]?.url || falResult.image?.url;
          if (imageUrlResult) {
            const imgRes = await fetch(imageUrlResult);
            const imgBuffer = await imgRes.arrayBuffer();

            // Store full version
            await admin.storage
              .from("projections")
              .upload(`${user.id}/${scanId}/full.jpg`, Buffer.from(imgBuffer), {
                contentType: "image/jpeg",
                upsert: true,
              });

            // Store teaser (same image for now, will be degraded client-side via LockedOverlay blur)
            await admin.storage
              .from("projections")
              .upload(`${user.id}/${scanId}/teaser.jpg`, Buffer.from(imgBuffer), {
                contentType: "image/jpeg",
                upsert: true,
              });

            await admin.from("projections").update({
              status: "done",
              provider: "nano-banana",
              teaser_path: `${user.id}/${scanId}/teaser.jpg`,
              full_path: `${user.id}/${scanId}/full.jpg`,
            }).eq("id", projectionId);

            success = true;
          }
        }
      } catch {
        // try fallback
      }
    }

    // Fallback: GPT Image 1.5
    if (!success && process.env.OPENAI_API_KEY && photoData) {
      try {
        const base64 = Buffer.from(await photoData.arrayBuffer()).toString("base64");

        const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1.5",
            prompt: PROJECTION_PROMPT,
            image: `data:image/jpeg;base64,${base64}`,
          }),
        });

        if (openaiRes.ok) {
          const openaiResult = await openaiRes.json();
          const b64Image = openaiResult.data?.[0]?.b64_json;
          if (b64Image) {
            const imgBuffer = Buffer.from(b64Image, "base64");

            await admin.storage
              .from("projections")
              .upload(`${user.id}/${scanId}/full.jpg`, imgBuffer, {
                contentType: "image/jpeg",
                upsert: true,
              });

            await admin.storage
              .from("projections")
              .upload(`${user.id}/${scanId}/teaser.jpg`, imgBuffer, {
                contentType: "image/jpeg",
                upsert: true,
              });

            await admin.from("projections").update({
              status: "done",
              provider: "gpt-image-1.5",
              teaser_path: `${user.id}/${scanId}/teaser.jpg`,
              full_path: `${user.id}/${scanId}/full.jpg`,
            }).eq("id", projectionId);

            success = true;
          }
        }
      } catch {
        // mark as failed
      }
    }

    if (!success) {
      await admin.from("projections").update({ status: "failed" }).eq("id", projectionId);
      await trackEventServer("projection_failed", {}, { userId: user.id });
      return NextResponse.json({ ok: false, status: "failed" });
    }

    await trackEventServer("projection_completed", {}, { userId: user.id });
    return NextResponse.json({ ok: true, status: "done" });
  } catch (e) {
    console.error("Projection error:", e);
    return NextResponse.json({ error: "Erreur de projection" }, { status: 500 });
  }
}
