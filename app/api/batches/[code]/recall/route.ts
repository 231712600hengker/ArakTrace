import { NextResponse } from "next/server";
import { recallBatch } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { canRecall } from "@/lib/permissions";

/** Menarik batch dari peredaran (verifikator/admin). Mengembalikan daftar pemegang hilir untuk tindak lanjut. */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const auth = await requireActor(["verifikator", "admin"]);
  if ("response" in auth) return auth.response;
  if (!canRecall(auth.actor)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "validation_failed" }, { status: 400 }); }
  const reason = String(body.reason ?? "").trim().slice(0, 300);
  if (!reason) return NextResponse.json({ error: "validation_failed", fields: { reason: "alasan penarikan wajib diisi" } }, { status: 400 });
  try { return NextResponse.json(await recallBatch(decodeURIComponent(params.code), reason)); }
  catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "batch_not_found") return NextResponse.json({ error: message }, { status: 404 });
    if (message === "already_recalled") return NextResponse.json({ error: message }, { status: 409 });
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
