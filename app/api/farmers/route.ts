import { NextResponse } from "next/server";
import { getFarmers } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { canCreateBatch } from "@/lib/permissions";

export async function GET(req: Request) {
  const auth = await requireActor(["koperasi", "admin"]);
  if ("response" in auth) return auth.response;
  const cooperativeId = new URL(req.url).searchParams.get("cooperative_id") ?? "";
  if (!cooperativeId || !canCreateBatch(auth.actor, cooperativeId)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try { return NextResponse.json((await getFarmers(cooperativeId)).map(({ id, alias }) => ({ id, alias }))); }
  catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
