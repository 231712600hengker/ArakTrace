import { NextResponse } from "next/server";
import { verifyBatch } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { canVerify } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const auth = await requireActor(["verifikator", "admin"]);
  if ("response" in auth) return auth.response;
  if (!canVerify(auth.actor)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "validation_failed" }, { status: 400 }); }
  const decision = body.decision; const note = String(body.note ?? "").trim().slice(0, 300);
  if (decision !== "verified" && decision !== "rejected") return NextResponse.json({ error: "validation_failed", fields: { decision: "verified atau rejected" } }, { status: 400 });
  if (decision === "rejected" && !note) return NextResponse.json({ error: "validation_failed", fields: { note: "alasan penolakan wajib diisi" } }, { status: 400 });
  try {
    const code = await verifyBatch(decodeURIComponent(params.code), decision, auth.actor.email || "verifikator", note);
    return NextResponse.json({ code, verification_status: decision });
  } catch (error) {
    if (error instanceof Error && error.message === "batch_not_found") return NextResponse.json({ error: "batch_not_found" }, { status: 404 });
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
