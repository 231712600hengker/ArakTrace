import { NextResponse } from "next/server";
import { addEvent, getBatch, getCooperatives, getProducers } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { ACTOR_TYPES, canAddEvent, type ActorType } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const auth = await requireActor(["koperasi", "produsen", "admin"]);
  if ("response" in auth) return auth.response;
  const { actor } = auth;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "validation_failed" }, { status: 400 }); }

  const actorType = body.actor_type as ActorType;
  const date = String(body.event_date ?? ""); const event = String(body.event ?? "").trim().slice(0, 120);
  const rawQty = body.quantity_liters; const quantity = rawQty === null || rawQty === undefined || rawQty === "" ? null : Number(rawQty);
  const f: Record<string, string> = {};
  if (quantity !== null && !(Number.isFinite(quantity) && quantity > 0 && quantity <= 100000)) f.quantity_liters = "angka liter 0-100000";
  if (!ACTOR_TYPES.includes(actorType)) f.actor_type = "tahap rantai tidak valid";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) f.event_date = "format YYYY-MM-DD";
  if (!event) f.event = "wajib diisi";
  if (Object.keys(f).length) return NextResponse.json({ error: "validation_failed", fields: f }, { status: 400 });

  try {
    const batch = await getBatch(decodeURIComponent(params.code));
    if (!batch) return NextResponse.json({ error: "batch_not_found" }, { status: 404 });
    const permission = canAddEvent(actor, batch, actorType);
    if (!permission.ok) return NextResponse.json({ error: permission.reason === "batch_not_verified" || permission.reason === "batch_recalled" ? permission.reason : "forbidden" }, { status: 403 });

    // Nama pelaku untuk koperasi/produsen diambil dari akun, bukan dari input, agar tidak bisa dipalsukan.
    let actorName = String(body.actor_name ?? "").trim().slice(0, 80);
    let producerId: string | undefined;
    if (actor.role === "koperasi") actorName = (await getCooperatives()).find((c) => c.id === actor.cooperative_id)?.name ?? actorName;
    if (actor.role === "produsen" && actorType === "produsen") {
      const producer = (await getProducers()).find((p) => p.id === actor.producer_id);
      if (!producer) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      actorName = producer.name; producerId = producer.id;
    }
    if (!actorName) return NextResponse.json({ error: "validation_failed", fields: { actor_name: "wajib diisi" } }, { status: 400 });
    const excise = actorType === "produsen" ? String(body.excise_band_no ?? "").trim().slice(0, 60) || undefined : undefined;
    const code = await addEvent(batch.code, { actor_type: actorType, actor_name: actorName, event, event_date: date, quantity_liters: quantity, producer_id: producerId, excise_band_no: excise });
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "chain_order_invalid" || message === "chain_conflict") return NextResponse.json({ error: message }, { status: 409 });
    if (message === "volume_exceeds_previous") return NextResponse.json({ error: message, max_liters: (error as { max?: number }).max }, { status: 409 });
    if (message === "quantity_required") return NextResponse.json({ error: "validation_failed", fields: { quantity_liters: "wajib diisi untuk tahap ini" } }, { status: 400 });
    if (message === "batch_recalled") return NextResponse.json({ error: message }, { status: 409 });
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
