import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Delete storage files
    const buckets = ["scalp-photos", "projections", "photos"];
    for (const bucket of buckets) {
      const { data: files } = await admin.storage
        .from(bucket)
        .list(user.id);

      if (files && files.length > 0) {
        for (const folder of files) {
          const { data: subFiles } = await admin.storage
            .from(bucket)
            .list(`${user.id}/${folder.name}`);

          if (subFiles) {
            const paths = subFiles.map((f) => `${user.id}/${folder.name}/${f.name}`);
            if (paths.length > 0) {
              await admin.storage.from(bucket).remove(paths);
            }
          }
        }
        // Remove top-level files too
        const topPaths = files.filter(f => f.metadata).map(f => `${user.id}/${f.name}`);
        if (topPaths.length > 0) {
          await admin.storage.from(bucket).remove(topPaths);
        }
      }
    }

    // Delete data (cascade should handle most, but be explicit)
    await admin.from("program_progress").delete().eq("user_id", user.id);
    await admin.from("projections").delete().eq("user_id", user.id);
    await admin.from("scans").delete().eq("user_id", user.id);
    await admin.from("onboarding_responses").delete().eq("user_id", user.id);
    await admin.from("subscriptions").delete().eq("user_id", user.id);
    await admin.from("events").delete().eq("user_id", user.id);
    await admin.from("email_log").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    // Delete auth user
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Account deletion error:", e);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
