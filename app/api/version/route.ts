import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

// Renvoie la version DÉPLOYÉE. Le client compare à la sienne ; si différent, il
// recharge (le code chargé est périmé). no-store pour toujours avoir la vraie.
export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    { headers: { "Cache-Control": "no-store" } }
  );
}
