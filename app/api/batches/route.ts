import { NextResponse } from "next/server";
import { addBatch, getBatchView, getCooperatives, getFarmers, listBatches } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { canCreateBatch } from "@/lib/permissions";

const MAX_BODY_SIZE = 10240; // 10KB
const num = (v: unknown, min: number, max: number) => typeof v === "number" && isFinite(v) && v >= min && v <= max;
const optionalPct = (v: unknown) => v === null || v === undefined || v === "" || num(v, 0, 100);
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const SAP = ["aren", "kelapa", "lontar"];
const optionalMoney = (v: unknown) => v === null || v === undefined || v === "" || num(v, 1, 10_000_000);

/** Daftar batch bersifat publik (ringkasan saja) dan mendukung filter sederhana. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const limit = Math.min(200, Math.max(1, Number(p.get("limit")) || 100));
    return NextResponse.json(await listBatches({ status: p.get("status") || undefined, risk: p.get("risk") || undefined, regency: p.get("regency") || undefined, q: p.get("q")?.slice(0, 60) || undefined, limit }));
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const auth = await requireActor(["koperasi", "admin"]);
  if ("response" in auth) return auth.response;
  const { actor } = auth;

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "validation_failed", message: "Format JSON tidak valid" }, { status: 400 }); }
  if (typeof b !== "object" || b === null) return NextResponse.json({ error: "validation_failed" }, { status: 400 });

  const f: Record<string, string> = {};
  const cooperativeId = String(b.cooperative_id ?? "");
  try {
    if (!(await getCooperatives()).some((c) => c.id === cooperativeId)) f.cooperative_id = "koperasi tidak valid";
    else if (!canCreateBatch(actor, cooperativeId)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    else if (b.farmer_id && !(await getFarmers(cooperativeId)).some((x) => x.id === b.farmer_id)) f.farmer_id = "perajin tidak valid";
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }

  const date = String(b.distillation_date ?? "");
  const parsed = Date.parse(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed)) f.distillation_date = "format YYYY-MM-DD";
  else if (parsed > Date.now() + 86400000) f.distillation_date = "tanggal tidak boleh di masa depan";
  if (!SAP.includes(String(b.sap_type))) f.sap_type = "jenis nira tidak valid";
  if (!num(b.volume_liters, 1, 100000)) f.volume_liters = "wajib angka 1-100000";
  if (!num(b.distill_temp_c, 20, 150)) f.distill_temp_c = "wajib angka 20-150";
  if (!num(b.distill_duration_min, 1, 1440)) f.distill_duration_min = "wajib angka 1-1440";
  if (!optionalPct(b.lab_ethanol_pct)) f.lab_ethanol_pct = "angka 0-100";
  if (!optionalPct(b.lab_methanol_pct)) f.lab_methanol_pct = "angka 0-100";
  if (!optionalMoney(b.production_cost_per_liter)) f.production_cost_per_liter = "angka rupiah per liter";
  if (!optionalMoney(b.purchase_price_per_liter)) f.purchase_price_per_liter = "angka rupiah per liter";
  const hasCost = b.production_cost_per_liter !== null && b.production_cost_per_liter !== undefined && b.production_cost_per_liter !== "";
  const hasPrice = b.purchase_price_per_liter !== null && b.purchase_price_per_liter !== undefined && b.purchase_price_per_liter !== "";
  if (hasCost !== hasPrice) f.purchase_price_per_liter = "isi biaya produksi dan harga beli bersama-sama";
  if (Object.keys(f).length) return NextResponse.json({ error: "validation_failed", fields: f }, { status: 400 });

  const pct = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const methanol = pct(b.lab_methanol_pct);
  try {
    const code = await addBatch({
      cooperative_id: cooperativeId, farmer_id: b.farmer_id ? String(b.farmer_id) : null, sap_type: String(b.sap_type), distillation_date: date,
      volume_liters: b.volume_liters as number, distill_temp_c: b.distill_temp_c as number, distill_duration_min: b.distill_duration_min as number,
      equipment_sanitized: b.equipment_sanitized === true, lab_tested: b.lab_tested === true || methanol !== null, lab_note: str(b.lab_note, 300),
      lab_name: str(b.lab_name, 100), lab_ethanol_pct: pct(b.lab_ethanol_pct), lab_methanol_pct: methanol,
      lab_report_source: b.lab_report_source === "ocr" ? "ocr" : "manual", surat_jalan_no: str(b.surat_jalan_no, 40) || null,
      production_cost_per_liter: hasCost ? Number(b.production_cost_per_liter) : null, purchase_price_per_liter: hasPrice ? Number(b.purchase_price_per_liter) : null,
    }, actor.email || "pengguna");
    return NextResponse.json({ code, risk: (await getBatchView(code))!.risk }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "cooperative_not_found" || message === "farmer_not_found") return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
