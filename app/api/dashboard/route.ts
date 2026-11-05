import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/db";
import { requireActor } from "@/lib/auth";

/** Data dasbor sesuai peran pengguna (koperasi: batch sendiri; produsen: batch terverifikasi; verifikator: semua). */
export async function GET() {
  const auth = await requireActor(["koperasi", "produsen", "verifikator", "admin"]);
  if ("response" in auth) return auth.response;
  try { return NextResponse.json(await getDashboard(auth.actor)); }
  catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
