import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const revalidate = 300;

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { count } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ scans: count ?? 0 });
}
