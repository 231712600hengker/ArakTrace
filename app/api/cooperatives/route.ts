import { NextResponse } from "next/server";
import { getCooperatives } from "@/lib/db";
import { getActor } from "@/lib/auth";

export async function GET() {
  try {
    const actor = await getActor();
    let cooperatives = await getCooperatives();
    // Pengguna koperasi hanya melihat koperasinya sendiri pada formulir pencatatan.
    if (actor?.role === "koperasi") cooperatives = cooperatives.filter((c) => c.id === actor.cooperative_id);
    return NextResponse.json(cooperatives.map(({ id, name, village, regency }) => ({ id, name, village, regency })));
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
