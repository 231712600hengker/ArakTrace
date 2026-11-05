import "@/lib/server-only";
import seed from "@/data/seed.json";
import { DISCLAIMER, METHANOL_LIMIT_PCT, methanolStatus, scoreRisk } from "@/lib/risk";
import { CHAIN_ORDER, ACTOR_TYPES, type Actor, type ActorType } from "@/lib/permissions";
import { priceFloor, priceFloorStatus, volumeCheck, type PriceStatus } from "@/lib/rules";
import { getSupabase } from "@/lib/supabase";

export type Cooperative = { id: string; name: string; village: string; regency: string; permit_no: string | null; region_code: string; is_demo?: boolean };
export type Producer = { id: string; name: string; regency: string; iui_no: string | null; nppbkc_no: string | null; izin_edar_no: string | null; is_demo?: boolean };
export type Farmer = { id: string; cooperative_id: string; alias: string; village: string };
export type VerificationStatus = "self_reported" | "verified" | "rejected";
export type Batch = {
  code: string; cooperative_id: string; farmer_id: string | null; producer_id: string | null; sap_type: string; distillation_date: string;
  volume_liters: number; distill_temp_c: number; distill_duration_min: number; equipment_sanitized: boolean; lab_tested: boolean; lab_note: string;
  lab_name: string; lab_ethanol_pct: number | null; lab_methanol_pct: number | null; lab_report_source: "manual" | "ocr" | null;
  surat_jalan_no: string | null; excise_band_no: string | null; verification_status: VerificationStatus; verified_by: string | null;
  verified_at: string | null; verification_note: string; production_cost_per_liter: number | null; purchase_price_per_liter: number | null;
  recalled_at: string | null; recall_reason: string; is_demo: boolean;
};
export type SupplyEvent = { batch_code: string; step: number; actor_type: ActorType; actor_name: string; event: string; event_date: string; quantity_liters: number | null };
export type NewBatch = Pick<Batch, "cooperative_id" | "sap_type" | "distillation_date" | "volume_liters" | "distill_temp_c" | "distill_duration_min" | "equipment_sanitized" | "lab_tested" | "lab_note"> &
  Partial<Pick<Batch, "farmer_id" | "lab_name" | "lab_ethanol_pct" | "lab_methanol_pct" | "lab_report_source" | "surat_jalan_no" | "production_cost_per_liter" | "purchase_price_per_liter">>;
export type VerificationCheck = { check_type: string; status: "lulus" | "belum" | "ditolak"; note: string };

const COOP_COLS = "id,name,village,regency,permit_no,region_code,is_demo";
const EVENT_COLS = "batch_code,step,actor_type,actor_name,event,event_date,quantity_liters";
const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
const text = (v: unknown) => (v === null || v === undefined ? null : String(v));

function toBatch(row: Record<string, unknown>): Batch {
  return {
    code: String(row.code), cooperative_id: String(row.cooperative_id), farmer_id: text(row.farmer_id), producer_id: text(row.producer_id),
    sap_type: String(row.sap_type), distillation_date: String(row.distillation_date).slice(0, 10), volume_liters: Number(row.volume_liters),
    distill_temp_c: Number(row.distill_temp_c), distill_duration_min: Number(row.distill_duration_min), equipment_sanitized: Boolean(row.equipment_sanitized),
    lab_tested: Boolean(row.lab_tested), lab_note: String(row.lab_note ?? ""), lab_name: String(row.lab_name ?? ""),
    lab_ethanol_pct: num(row.lab_ethanol_pct), lab_methanol_pct: num(row.lab_methanol_pct),
    lab_report_source: row.lab_report_source === "ocr" ? "ocr" : row.lab_report_source === "manual" ? "manual" : null,
    surat_jalan_no: text(row.surat_jalan_no), excise_band_no: text(row.excise_band_no),
    verification_status: (["verified", "rejected"].includes(String(row.verification_status)) ? row.verification_status : "self_reported") as VerificationStatus,
    verified_by: text(row.verified_by), verified_at: text(row.verified_at), verification_note: String(row.verification_note ?? ""),
    production_cost_per_liter: num(row.production_cost_per_liter), purchase_price_per_liter: num(row.purchase_price_per_liter),
    recalled_at: text(row.recalled_at), recall_reason: String(row.recall_reason ?? ""), is_demo: row.is_demo !== false,
  };
}
const toEvent = (row: Record<string, unknown>): SupplyEvent => ({
  batch_code: String(row.batch_code), step: Number(row.step), actor_type: row.actor_type as ActorType, actor_name: String(row.actor_name),
  event: String(row.event), event_date: String(row.event_date).slice(0, 10), quantity_liters: num(row.quantity_liters),
});

/** Lapisan penyimpanan: Supabase bila dikonfigurasi, selain itu memori (hanya untuk pengembangan lokal). */
interface Store {
  cooperatives(): Promise<Cooperative[]>;
  producers(): Promise<Producer[]>;
  farmers(cooperativeId?: string): Promise<Farmer[]>;
  batch(code: string): Promise<Batch | null>;
  batches(): Promise<Batch[]>;
  events(code: string): Promise<SupplyEvent[]>;
  eventsMany(codes: string[]): Promise<SupplyEvent[]>;
  insertBatch(batch: Batch, risk: ReturnType<typeof scoreRisk>): Promise<{ duplicate: boolean }>;
  updateBatch(code: string, patch: Partial<Batch>): Promise<void>;
  insertEvent(event: SupplyEvent): Promise<{ duplicate: boolean }>;
  lastSeq(prefix: string): Promise<number>;
}

const g = globalThis as unknown as { __ark_v3?: { batches: Batch[]; events: SupplyEvent[] } };
g.__ark_v3 ??= { batches: (seed.batches as unknown as Record<string, unknown>[]).map(toBatch), events: (seed.events as unknown as Record<string, unknown>[]).map(toEvent) };
const mem = g.__ark_v3;

const memoryStore: Store = {
  async cooperatives() { return seed.cooperatives as Cooperative[]; },
  async producers() { return seed.producers as Producer[]; },
  async farmers(cooperativeId) { return (seed.farmers as Farmer[]).filter((f) => !cooperativeId || f.cooperative_id === cooperativeId); },
  async batch(code) { return mem.batches.find((b) => b.code === code) ?? null; },
  async batches() { return mem.batches; },
  async events(code) { return mem.events.filter((e) => e.batch_code === code).sort((a, b) => a.step - b.step); },
  async eventsMany(codes) { const set = new Set(codes); return mem.events.filter((e) => set.has(e.batch_code)).sort((a, b) => a.step - b.step); },
  async insertBatch(batch) { if (mem.batches.some((b) => b.code === batch.code)) return { duplicate: true }; mem.batches.push(batch); return { duplicate: false }; },
  async updateBatch(code, patch) { const i = mem.batches.findIndex((b) => b.code === code); if (i >= 0) mem.batches[i] = { ...mem.batches[i], ...patch }; },
  async insertEvent(event) { if (mem.events.some((e) => e.batch_code === event.batch_code && e.step === event.step)) return { duplicate: true }; mem.events.push(event); return { duplicate: false }; },
  async lastSeq(prefix) { return Math.max(0, ...mem.batches.filter((b) => b.code.startsWith(prefix)).map((b) => Number(b.code.slice(-4)))); },
};

function supabaseStore(sb: NonNullable<ReturnType<typeof getSupabase>>): Store {
  return {
    async cooperatives() { const { data, error } = await sb.from("cooperatives").select(COOP_COLS).order("name"); if (error) throw error; return (data ?? []) as Cooperative[]; },
    async producers() { const { data, error } = await sb.from("producers").select("*").order("name"); if (error) throw error; return (data ?? []) as Producer[]; },
    async farmers(cooperativeId) { let q = sb.from("farmers").select("id,cooperative_id,alias,village"); if (cooperativeId) q = q.eq("cooperative_id", cooperativeId); const { data, error } = await q.order("alias"); if (error) throw error; return (data ?? []) as Farmer[]; },
    async batch(code) { const { data, error } = await sb.from("batches").select("*").eq("code", code).maybeSingle(); if (error) throw error; return data ? toBatch(data as Record<string, unknown>) : null; },
    async batches() { const { data, error } = await sb.from("batches").select("*").order("created_at", { ascending: false }).limit(500); if (error) throw error; return (data ?? []).map((r: Record<string, unknown>) => toBatch(r)); },
    async events(code) { const { data, error } = await sb.from("supply_events").select(EVENT_COLS).eq("batch_code", code).order("step"); if (error) throw error; return (data ?? []).map((r: Record<string, unknown>) => toEvent(r)); },
    async eventsMany(codes) {
      const out: SupplyEvent[] = [];
      for (let i = 0; i < codes.length; i += 100) { // potong agar URL permintaan tidak terlalu panjang
        const { data, error } = await sb.from("supply_events").select(EVENT_COLS).in("batch_code", codes.slice(i, i + 100)).order("step");
        if (error) throw error; out.push(...(data ?? []).map((r: Record<string, unknown>) => toEvent(r)));
      }
      return out;
    },
    async insertBatch(batch, risk) {
      const { error } = await sb.from("batches").insert({ ...batch, risk_score: risk.score, risk_label: risk.label, risk_factors: risk.factors });
      if (error) { if (error.code === "23505") return { duplicate: true }; throw error; }
      return { duplicate: false };
    },
    async updateBatch(code, patch) { const { error } = await sb.from("batches").update(patch).eq("code", code); if (error) throw error; },
    async insertEvent(event) { const { error } = await sb.from("supply_events").insert(event); if (error) { if (error.code === "23505") return { duplicate: true }; throw error; } return { duplicate: false }; },
    async lastSeq(prefix) { const { data, error } = await sb.from("batches").select("code").like("code", `${prefix}%`).order("code", { ascending: false }).limit(1); if (error) throw error; const c = data?.[0]?.code as string | undefined; return c ? Number(c.slice(-4)) : 0; },
  };
}
const store = (): Store => { const sb = getSupabase(); return sb ? supabaseStore(sb) : memoryStore; };

export const getCooperatives = () => store().cooperatives();
export const getProducers = () => store().producers();
export const getFarmers = (cooperativeId?: string) => store().farmers(cooperativeId);
export const getBatch = (code: string) => store().batch(code.trim().toUpperCase());
const fmtPct = (n: number | null) => String(n).replace(".", ",");

export function verificationView(b: Batch, c: Cooperative, p: Producer | null, events: SupplyEvent[]): VerificationCheck[] {
  const ok = (pass: boolean, yes: string, no: string) => ({ status: (pass ? "lulus" : "belum") as VerificationCheck["status"], note: pass ? yes : no });
  const methanol = methanolStatus(b.lab_methanol_pct);
  const lab: VerificationCheck = b.lab_tested
    ? methanol === "melebihi"
      ? { check_type: "uji_lab", status: "ditolak", note: `Metanol ${fmtPct(b.lab_methanol_pct)}% melebihi batas ${fmtPct(METHANOL_LIMIT_PCT)}% b/v` }
      : { check_type: "uji_lab", status: "lulus", note: [b.lab_note || "Hasil uji lab dilaporkan", b.lab_name && `oleh ${b.lab_name}`, methanol === "memenuhi" && `metanol ${fmtPct(b.lab_methanol_pct)}% (batas ${fmtPct(METHANOL_LIMIT_PCT)}%)`, b.lab_report_source === "ocr" && "dibaca dengan AI, perlu dikonfirmasi"].filter(Boolean).join(", ") }
    : { check_type: "uji_lab", status: "belum", note: "Belum ada hasil uji lab" };
  const third: VerificationCheck = b.verification_status === "verified"
    ? { check_type: "verifikasi_pihak_ketiga", status: "lulus", note: `Diverifikasi oleh ${b.verified_by ?? "verifikator"}` }
    : b.verification_status === "rejected"
      ? { check_type: "verifikasi_pihak_ketiga", status: "ditolak", note: b.verification_note || "Ditolak verifikator" }
      : { check_type: "verifikasi_pihak_ketiga", status: "belum", note: "Data masih laporan mandiri, belum diverifikasi pihak ketiga" };
  const price = priceFloorStatus(b.production_cost_per_liter, b.purchase_price_per_liter);
  const priceCheck: VerificationCheck = { check_type: "harga_batas_bawah", status: price === "memenuhi" ? "lulus" : price === "di_bawah_batas" ? "ditolak" : "belum",
    note: price === "memenuhi" ? "Harga beli bahan baku dari perajin memenuhi batas bawah (biaya produksi + 20%, Pergub Pasal 9)" : price === "di_bawah_batas" ? "Harga beli dari perajin di bawah batas bawah Pergub Pasal 9 (biaya produksi + 20%)" : "Biaya produksi dan harga beli belum dicatat" };
  const volume = volumeCheck(b.volume_liters, events);
  const volumeRow: VerificationCheck = { check_type: "konsistensi_volume", status: volume.status === "konsisten" ? "lulus" : volume.status === "tidak_konsisten" ? "ditolak" : "belum", note: volume.note };
  return [
    { check_type: "izin_usaha", ...ok(Boolean(c.permit_no), `No. izin koperasi${c.is_demo === false ? "" : " (data tiruan)"}: ${c.permit_no}`, "Belum ada izin") },
    { check_type: "higienitas", ...ok(b.equipment_sanitized, "Alat dibersihkan sebelum destilasi (laporan mandiri)", "Kebersihan alat belum dikonfirmasi") },
    lab,
    { check_type: "surat_jalan", ...ok(Boolean(b.surat_jalan_no), `Surat jalan desa tercatat: ${b.surat_jalan_no}`, "Belum ada surat jalan pengangkutan bahan baku") },
    third, priceCheck, volumeRow,
    { check_type: "izin_produsen", ...ok(Boolean(p?.iui_no && p.nppbkc_no && p.izin_edar_no), `IUI, NPPBKC, dan izin edar produsen tercatat (${p?.name})`, p ? "Dokumen izin produsen belum lengkap" : "Belum diproses produsen") },
    { check_type: "label_cukai", ...ok(Boolean(b.excise_band_no), `Nomor pita cukai: ${b.excise_band_no}`, "Belum ada label cukai") },
  ];
}

/** Tampilan batch. Secara default publik: nominal biaya/harga TIDAK disertakan (hanya status). */
export async function getBatchView(code: string, opts: { internal?: boolean } = {}) {
  const s = store(); const normalized = code.trim().toUpperCase();
  const b = await s.batch(normalized); if (!b) return null;
  const [coops, producers, farmers, events] = await Promise.all([s.cooperatives(), s.producers(), s.farmers(b.cooperative_id), s.events(normalized)]);
  const c = coops.find((x) => x.id === b.cooperative_id); if (!c) return null;
  const p = producers.find((x) => x.id === b.producer_id) ?? null;
  const farmer = farmers.find((x) => x.id === b.farmer_id) ?? null;
  const { production_cost_per_liter: cost, purchase_price_per_liter: paid, ...rest } = b;
  const priceStatus = priceFloorStatus(cost, paid);
  return {
    ...rest, cooperative: c, producer: p, farmer, events, risk: scoreRisk(b), methanol_status: methanolStatus(b.lab_methanol_pct), disclaimer: DISCLAIMER,
    verifications: verificationView(b, c, p, events), price_status: priceStatus, volume_check: volumeCheck(b.volume_liters, events), recalled: Boolean(b.recalled_at),
    price: opts.internal && cost && paid ? { cost, paid, floor: priceFloor(cost) } : null,
  };
}

export type BatchSummary = { code: string; cooperative: string; regency: string; sap_type: string; distillation_date: string; verification_status: VerificationStatus; risk: { score: number; label: string }; is_demo: boolean; chain_steps: number; recalled: boolean };
export type BatchFilter = { status?: string; risk?: string; regency?: string; q?: string; limit?: number };
export async function listBatches(filter: BatchFilter = {}): Promise<BatchSummary[]> {
  const s = store(); const [all, coops] = await Promise.all([s.batches(), s.cooperatives()]);
  const q = filter.q?.trim().toUpperCase();
  const rows = all.map((b) => ({ b, c: coops.find((x) => x.id === b.cooperative_id), risk: scoreRisk(b) }))
    .filter(({ b, c, risk }) => (!filter.status || b.verification_status === filter.status) && (!filter.risk || risk.label === filter.risk)
      && (!filter.regency || c?.regency === filter.regency) && (!q || b.code.includes(q) || (c?.name ?? "").toUpperCase().includes(q)))
    .sort((a, z) => z.b.distillation_date.localeCompare(a.b.distillation_date) || a.b.code.localeCompare(z.b.code)).slice(0, filter.limit ?? 100);
  const events = await s.eventsMany(rows.map(({ b }) => b.code));
  return rows.map(({ b, c, risk }) => ({ code: b.code, cooperative: c?.name ?? "-", regency: c?.regency ?? "-", sap_type: b.sap_type, distillation_date: b.distillation_date, verification_status: b.verification_status, risk: { score: risk.score, label: risk.label }, is_demo: b.is_demo, chain_steps: events.filter((e) => e.batch_code === b.code).length, recalled: Boolean(b.recalled_at) }));
}

export type DashboardRow = {
  code: string; cooperative: string; regency: string; sap_type: string; distillation_date: string; volume_liters: number;
  verification_status: VerificationStatus; verification_note: string; verified_by: string | null; recalled: boolean; recall_reason: string;
  risk: { score: number; label: string; factors: string[] }; distill_temp_c: number; distill_duration_min: number; equipment_sanitized: boolean; surat_jalan_no: string | null;
  lab: { tested: boolean; name: string; ethanol_pct: number | null; methanol_pct: number | null; source: "manual" | "ocr" | null; methanol_status: string };
  price_status: PriceStatus; price: { cost: number; paid: number; floor: number } | null; volume_status: string; volume_note: string;
  chain: { step: number; actor_type: ActorType; actor_name: string; quantity_liters: number | null; event_date: string }[];
  last_quantity: number; allowed_next: ActorType[]; producer_id: string | null; excise_band_no: string | null; is_demo: boolean;
};
export type DashboardStats = { total: number; menunggu: number; terverifikasi: number; ditolak: number; ditarik: number; berisiko_tinggi: number; siap_diproses: number; dalam_distribusi: number; selesai: number };

/** Data dasbor sesuai peran. Produsen tidak menerima nominal biaya/harga beli dari perajin. */
export async function getDashboard(actor: Actor): Promise<{ stats: DashboardStats; rows: DashboardRow[] }> {
  const s = store(); const [all, coops] = await Promise.all([s.batches(), s.cooperatives()]);
  const scoped = all.filter((b) => {
    if (actor.role === "koperasi") return b.cooperative_id === actor.cooperative_id;
    if (actor.role === "produsen") return b.verification_status === "verified" && (!b.producer_id || b.producer_id === actor.producer_id);
    return true;
  });
  const events = await s.eventsMany(scoped.map((b) => b.code));
  const rows: DashboardRow[] = scoped.map((b) => {
    const chain = events.filter((e) => e.batch_code === b.code).sort((x, y) => x.step - y.step);
    const lastOrder = chain.length ? CHAIN_ORDER[chain[chain.length - 1].actor_type] : 0;
    const vc = volumeCheck(b.volume_liters, chain); const risk = scoreRisk(b);
    const showPrice = actor.role !== "produsen" && b.production_cost_per_liter && b.purchase_price_per_liter;
    return {
      code: b.code, cooperative: coops.find((c) => c.id === b.cooperative_id)?.name ?? "-", regency: coops.find((c) => c.id === b.cooperative_id)?.regency ?? "-",
      sap_type: b.sap_type, distillation_date: b.distillation_date, volume_liters: b.volume_liters, verification_status: b.verification_status, verification_note: b.verification_note,
      verified_by: b.verified_by, recalled: Boolean(b.recalled_at), recall_reason: b.recall_reason, risk: { score: risk.score, label: risk.label, factors: risk.factors.map((f) => f.detail) },
      distill_temp_c: b.distill_temp_c, distill_duration_min: b.distill_duration_min, equipment_sanitized: b.equipment_sanitized, surat_jalan_no: b.surat_jalan_no,
      lab: { tested: b.lab_tested, name: b.lab_name, ethanol_pct: b.lab_ethanol_pct, methanol_pct: b.lab_methanol_pct, source: b.lab_report_source, methanol_status: methanolStatus(b.lab_methanol_pct) },
      price_status: priceFloorStatus(b.production_cost_per_liter, b.purchase_price_per_liter),
      price: showPrice ? { cost: b.production_cost_per_liter!, paid: b.purchase_price_per_liter!, floor: priceFloor(b.production_cost_per_liter!) } : null,
      volume_status: vc.status, volume_note: vc.note,
      chain: chain.map((e) => ({ step: e.step, actor_type: e.actor_type, actor_name: e.actor_name, quantity_liters: e.quantity_liters, event_date: e.event_date })),
      last_quantity: vc.last_quantity, allowed_next: b.recalled_at ? [] : ACTOR_TYPES.filter((t) => CHAIN_ORDER[t] > lastOrder),
      producer_id: b.producer_id, excise_band_no: b.excise_band_no, is_demo: b.is_demo,
    };
  });
  const downstream = (r: DashboardRow) => r.chain.some((e) => CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen);
  const stats: DashboardStats = {
    total: rows.length, menunggu: rows.filter((r) => r.verification_status === "self_reported" && !r.recalled).length,
    terverifikasi: rows.filter((r) => r.verification_status === "verified" && !r.recalled).length, ditolak: rows.filter((r) => r.verification_status === "rejected").length,
    ditarik: rows.filter((r) => r.recalled).length, berisiko_tinggi: rows.filter((r) => r.risk.label === "tinggi").length,
    siap_diproses: rows.filter((r) => r.verification_status === "verified" && !r.recalled && !downstream(r)).length,
    dalam_distribusi: rows.filter((r) => r.verification_status === "verified" && !r.recalled && downstream(r) && r.allowed_next.length > 0).length,
    selesai: rows.filter((r) => r.verification_status === "verified" && !r.recalled && downstream(r) && r.allowed_next.length === 0).length,
  };
  const rank = (r: DashboardRow) => (r.recalled ? 3 : r.verification_status === "self_reported" ? 0 : r.verification_status === "verified" ? 1 : 2);
  const riskRank: Record<string, number> = { tinggi: 0, sedang: 1, rendah: 2 };
  rows.sort((a, z) => rank(a) - rank(z) || riskRank[a.risk.label] - riskRank[z.risk.label] || z.distillation_date.localeCompare(a.distillation_date));
  return { stats, rows };
}

export const prefixFor = (c: Cooperative, date: string) => `ARK-${c.region_code}-${date.slice(2, 4)}${date.slice(5, 7)}-`;

export async function addBatch(input: NewBatch, actorName: string) {
  const s = store(); const cooperative = (await s.cooperatives()).find((c) => c.id === input.cooperative_id);
  if (!cooperative) throw new Error("cooperative_not_found");
  if (input.farmer_id && !(await s.farmers(input.cooperative_id)).some((f) => f.id === input.farmer_id)) throw new Error("farmer_not_found");
  const prefix = prefixFor(cooperative, input.distillation_date);
  // UNIQUE(code) adalah pengaman akhir; retry menangani dua request serentak.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = prefix + String((await s.lastSeq(prefix)) + 1).padStart(4, "0");
    const batch: Batch = {
      code, cooperative_id: input.cooperative_id, farmer_id: input.farmer_id ?? null, producer_id: null, sap_type: input.sap_type, distillation_date: input.distillation_date,
      volume_liters: input.volume_liters, distill_temp_c: input.distill_temp_c, distill_duration_min: input.distill_duration_min,
      equipment_sanitized: input.equipment_sanitized, lab_tested: input.lab_tested, lab_note: input.lab_note, lab_name: input.lab_name ?? "",
      lab_ethanol_pct: input.lab_ethanol_pct ?? null, lab_methanol_pct: input.lab_methanol_pct ?? null, lab_report_source: input.lab_tested ? input.lab_report_source ?? "manual" : null,
      surat_jalan_no: input.surat_jalan_no ?? null, excise_band_no: null, verification_status: "self_reported", verified_by: null, verified_at: null, verification_note: "",
      production_cost_per_liter: input.production_cost_per_liter ?? null, purchase_price_per_liter: input.purchase_price_per_liter ?? null,
      recalled_at: null, recall_reason: "", is_demo: isDemoMode(),
    };
    const { duplicate } = await s.insertBatch(batch, scoreRisk(batch));
    if (duplicate) continue;
    const farmer = input.farmer_id ? (await s.farmers(input.cooperative_id)).find((f) => f.id === input.farmer_id) : null;
    await s.insertEvent({ batch_code: code, step: 1, actor_type: "perajin", actor_name: farmer?.alias ?? "Perajin anggota koperasi", event: "Destilasi dan penyetoran bahan baku", event_date: input.distillation_date, quantity_liters: input.volume_liters });
    await s.insertEvent({ batch_code: code, step: 2, actor_type: "koperasi", actor_name: cooperative.name, event: `Pencatatan batch oleh ${actorName}`, event_date: new Date().toISOString().slice(0, 10), quantity_liters: input.volume_liters });
    return code;
  }
  throw new Error("batch_code_collision");
}

export async function verifyBatch(code: string, decision: "verified" | "rejected", verifierName: string, note: string) {
  const s = store(); const b = await s.batch(code.trim().toUpperCase()); if (!b) throw new Error("batch_not_found");
  if (b.recalled_at) throw new Error("batch_recalled");
  await s.updateBatch(b.code, { verification_status: decision, verified_by: verifierName, verified_at: new Date().toISOString(), verification_note: note.slice(0, 300) });
  return b.code;
}

/** Menarik batch dari peredaran dan mengembalikan daftar pihak yang memegangnya (untuk tindak lanjut). */
export async function recallBatch(code: string, reason: string) {
  const s = store(); const b = await s.batch(code.trim().toUpperCase()); if (!b) throw new Error("batch_not_found");
  if (b.recalled_at) throw new Error("already_recalled");
  await s.updateBatch(b.code, { recalled_at: new Date().toISOString(), recall_reason: reason.slice(0, 300) });
  const holders = (await s.events(b.code)).filter((e) => CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen).map((e) => ({ actor_type: e.actor_type, actor_name: e.actor_name, quantity_liters: e.quantity_liters }));
  return { code: b.code, holders };
}

export async function addEvent(code: string, input: { actor_type: ActorType; actor_name: string; event: string; event_date: string; quantity_liters?: number | null; producer_id?: string; excise_band_no?: string }) {
  const s = store(); const b = await s.batch(code.trim().toUpperCase()); if (!b) throw new Error("batch_not_found");
  if (b.recalled_at) throw new Error("batch_recalled");
  const events = await s.events(b.code);
  const last = events[events.length - 1];
  if (last && CHAIN_ORDER[input.actor_type] <= CHAIN_ORDER[last.actor_type]) throw new Error("chain_order_invalid");
  const quantity = input.quantity_liters ?? null;
  if (CHAIN_ORDER[input.actor_type] >= CHAIN_ORDER.produsen && (quantity === null || !(quantity > 0))) throw new Error("quantity_required");
  if (quantity !== null) {
    const previous = [...events].reverse().find((e) => e.quantity_liters !== null)?.quantity_liters ?? b.volume_liters;
    if (quantity > previous + 0.0001) throw Object.assign(new Error("volume_exceeds_previous"), { max: previous });
  }
  const { duplicate } = await s.insertEvent({ batch_code: b.code, step: (last?.step ?? 0) + 1, actor_type: input.actor_type, actor_name: input.actor_name, event: input.event, event_date: input.event_date, quantity_liters: quantity });
  if (duplicate) throw new Error("chain_conflict");
  const patch: Partial<Batch> = {};
  if (input.actor_type === "produsen") { if (input.producer_id && !b.producer_id) patch.producer_id = input.producer_id; if (input.excise_band_no) patch.excise_band_no = input.excise_band_no; }
  if (Object.keys(patch).length) await s.updateBatch(b.code, patch);
  return b.code;
}
