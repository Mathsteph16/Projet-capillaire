import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmail,
  emailScanAbandoned,
  emailPaywallAbandoned,
  emailProgramNudge,
  emailRescanReminder,
} from "@/lib/email/resend";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const sent: string[] = [];

  try {
    // 1. Scan abandoned (signed up 1h+ ago, no scan done)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: noScanUsers } = await supabase
      .from("profiles")
      .select("id, email")
      .lt("created_at", oneHourAgo);

    if (noScanUsers) {
      for (const user of noScanUsers) {
        if (!user.email) continue;
        const { data: scan } = await supabase
          .from("scans")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "done")
          .limit(1)
          .single();

        if (!scan) {
          const { data: alreadySent } = await supabase
            .from("email_log")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "scan_abandoned")
            .single();

          if (!alreadySent) {
            const email = emailScanAbandoned();
            await sendEmail({ to: user.email, ...email });
            await supabase.from("email_log").insert({ user_id: user.id, type: "scan_abandoned" });
            sent.push(`scan_abandoned:${user.email}`);
          }
        }
      }
    }

    // 2. Rescan reminder (last scan 30+ days ago, active sub)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (activeSubs) {
      for (const sub of activeSubs) {
        const { data: lastScan } = await supabase
          .from("scans")
          .select("created_at")
          .eq("user_id", sub.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (lastScan && lastScan.created_at < thirtyDaysAgo) {
          const { data: alreadySent } = await supabase
            .from("email_log")
            .select("id")
            .eq("user_id", sub.user_id)
            .eq("type", "rescan_reminder")
            .gt("created_at", thirtyDaysAgo)
            .single();

          if (!alreadySent) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", sub.user_id)
              .single();

            if (profile?.email) {
              const email = emailRescanReminder();
              await sendEmail({ to: profile.email, ...email });
              await supabase.from("email_log").insert({ user_id: sub.user_id, type: "rescan_reminder" });
              sent.push(`rescan:${profile.email}`);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Cron email error:", e);
  }

  return NextResponse.json({ sent, timestamp: new Date().toISOString() });
}
