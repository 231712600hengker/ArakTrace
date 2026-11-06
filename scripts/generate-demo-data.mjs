// Pembangkit data DEMO deterministik (seed tetap) -> data/seed.json
// Semua nama, nomor izin, nomor pita cukai, dan hasil laboratorium di sini TIRUAN.
// Jalankan: node scripts/generate-demo-data.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SEED = 20261104;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const between = (lo, hi, d = 0) => Number((lo + rnd() * (hi - lo)).toFixed(d));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pad = (n, w = 2) => String(n).padStart(w, "0");
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const regencies = [
  ["Karangasem", "KRG"], ["Buleleng", "BLL"], ["Bangli", "BGL"], ["Klungkung", "KLK"], ["Gianyar", "GYR"], ["Tabanan", "TBN"],
];
const coopNames = ["Tirta Nira", "Sari Aren", "Giri Merta", "Segara Kelapa", "Taman Lontar", "Sumber Rasa"];
const villageNames = ["Desa Tri Eka Buana", "Desa Les", "Desa Sidemen", "Desa Belok Sidan", "Desa Bondalem", "Desa Baturinggiting"];

const cooperatives = regencies.map(([regency, code], i) => ({
  id: `c${i + 1}`,
  name: i === 1 ? "Kelompok Tani Sari Aren" : `Koperasi ${coopNames[i]}`,
  village: villageNames[i] ?? `Desa ${coopNames[i]}`,
  regency, permit_no: `IZIN-KOP-${pad(i + 1, 3)}`, region_code: code, is_demo: true,
}));
const producers = [
  { id: "p1", name: "Produsen Dewata Spirit", regency: "Badung", iui_no: "IUI-BALI-001", nppbkc_no: "NPPBKC-BALI-001", izin_edar_no: "BPOM-MD-001", is_demo: true },
  { id: "p2", name: "Produsen Gunung Agung Bali", regency: "Gianyar", iui_no: "IUI-BALI-002", nppbkc_no: "NPPBKC-BALI-002", izin_edar_no: "BPOM-MD-002", is_demo: true },
  { id: "p3", name: "Produsen Pesisir Timur", regency: "Klungkung", iui_no: "IUI-BALI-003", nppbkc_no: null, izin_edar_no: null, is_demo: true },
];

const balineseNames = [
  "I Wayan Sudira", "I Made Astawa", "I Nyoman Rai",
  "I Ketut Sujana", "I Gede Suardika", "I Wayan Kariasa",
  "I Made Sukadana", "I Ketut Wirawan", "I Nyoman Pasek",
  "I Wayan Merta", "I Made Subawa", "I Ketut Darsana",
  "I Wayan Kertia", "I Made Suartana", "I Nyoman Wardana",
  "I Ketut Arimbawa", "I Wayan Suweta", "I Made Budiarta"
];

const farmers = cooperatives.flatMap((c, i) => [0, 1, 2].map((n) => {
  const nameIdx = (i * 3 + n) % balineseNames.length;
  return {
    id: `f${i + 1}${n + 1}`,
    cooperative_id: c.id,
    alias: balineseNames[nameIdx],
    village: c.village,
    is_demo: true
  };
}));

const distributors = ["Distributor Nusa Bali", "Distributor Wangaya Indah", "Distributor Bali Raya"];
const subDistributors = ["Sub Distributor Sanur Jaya", "Sub Distributor Ubud Lestari", "Sub Distributor Singaraja Makmur"];
const sellers = ["Bar Seminyak Sunset", "Restoran Ubud Heritage", "Toko Minuman Dewata Denpasar", "Restoran Singaraja Indah"];

// Tiga batch kanonik dipertahankan agar kode batch tetap valid.
const canon = [
  { code: "ARK-KRG-2610-0001", cooperative_id: "c1", farmer_id: "f11", sap_type: "aren", distillation_date: "2026-10-05", volume_liters: 120, distill_temp_c: 78, distill_duration_min: 150, equipment_sanitized: true, lab_tested: true, lab_note: "Hasil uji lab: memenuhi standar mutu Pergub Bali No. 1/2020", lab_name: "Balai Laboratorium Kesehatan Bali", lab_ethanol_pct: 38.5, lab_methanol_pct: 0.004, lab_report_source: "manual", verification_status: "verified", producer_id: "p1", stage: 5 },
  { code: "ARK-KRG-2610-0002", cooperative_id: "c1", farmer_id: "f12", sap_type: "kelapa", distillation_date: "2026-10-12", volume_liters: 80, distill_temp_c: 80, distill_duration_min: 120, equipment_sanitized: true, lab_tested: false, lab_note: "", lab_name: "", lab_ethanol_pct: null, lab_methanol_pct: null, lab_report_source: null, verification_status: "self_reported", producer_id: null, stage: 2 },
  { code: "ARK-BLL-2610-0001", cooperative_id: "c2", farmer_id: "f21", sap_type: "lontar", distillation_date: "2026-10-15", volume_liters: 60, distill_temp_c: 92, distill_duration_min: 60, equipment_sanitized: false, lab_tested: false, lab_note: "", lab_name: "", lab_ethanol_pct: null, lab_methanol_pct: null, lab_report_source: null, verification_status: "self_reported", producer_id: null, stage: 2 },
];
const seqByPrefix = {};
canon.forEach((b) => { const p = b.code.slice(0, 12); seqByPrefix[p] = Math.max(seqByPrefix[p] ?? 0, Number(b.code.slice(-4))); });

function makeBatch(index) {
  const ci = index % cooperatives.length; const c = cooperatives[ci];
  const date = addDays("2026-07-01", Math.floor(rnd() * 118));
  const prefix = `ARK-${c.region_code}-${date.slice(2, 4)}${date.slice(5, 7)}-`;
  const seq = (seqByPrefix[prefix.slice(0, 12)] = (seqByPrefix[prefix.slice(0, 12)] ?? 0) + 1);
  const roll = rnd();
  const profile = roll < 0.55 ? "baik" : roll < 0.8 ? "sedang" : "buruk";
  let temp, dur, san, lab;
  if (profile === "baik") { temp = between(76, 80, 0); dur = between(120, 200, 0); san = true; lab = true; }
  else if (profile === "sedang") { temp = between(81, 88, 0); dur = between(90, 150, 0); san = rnd() < 0.7; lab = rnd() < 0.4; }
  else { temp = between(89, 98, 0); dur = between(40, 85, 0); san = false; lab = false; }
  const overLimit = profile === "buruk" && rnd() < 0.5;
  const labFilled = lab || overLimit;
  const ocr = labFilled && rnd() < 0.5;
  let status = "self_reported";
  if (profile === "baik" && rnd() < 0.7) status = "verified";
  else if (overLimit) status = "rejected";
  else if (profile === "sedang" && lab && rnd() < 0.4) status = "verified";
  const hasProducer = status === "verified";
  const stage = status === "verified" ? pick([3, 4, 5, 6]) : 2;
  const farmer = farmers.filter((f) => f.cooperative_id === c.id)[Math.floor(rnd() * 3)];
  return {
    code: prefix + pad(seq, 4), cooperative_id: c.id, farmer_id: farmer.id,
    sap_type: pick(["aren", "kelapa", "lontar"]), distillation_date: date, volume_liters: between(40, 220, 0),
    distill_temp_c: temp, distill_duration_min: dur, equipment_sanitized: san, lab_tested: labFilled,
    lab_note: labFilled ? (overLimit ? "Kadar metanol melebihi batas maksimal Pergub Bali No. 1/2020" : "Memenuhi baku mutu standar pengujian lab") : "",
    lab_name: labFilled ? "Balai Laboratorium Kesehatan Bali" : "",
    lab_ethanol_pct: labFilled ? between(30, 44, 1) : null,
    lab_methanol_pct: labFilled ? (overLimit ? between(0.02, 0.06, 3) : between(0.001, 0.009, 3)) : null,
    lab_report_source: labFilled ? (ocr ? "ocr" : "manual") : null,
    verification_status: status, producer_id: hasProducer ? pick(producers.filter((p) => p.nppbkc_no)).id : null, stage,
  };
}

const raw = [...canon];
for (let i = 0; i < 17; i += 1) raw.push(makeBatch(i + 3));

const batches = []; const events = [];
// Aliran acak kedua agar data lama (aliran pertama) tidak berubah ketika bidang baru ditambahkan.
const rnd2 = mulberry32(SEED + 7);
const between2 = (lo, hi) => lo + rnd2() * (hi - lo);
const CAP = "2026-11-04"; const clampDate = (d) => (d > CAP ? CAP : d);
// Dua batch terverifikasi dipilih deterministik untuk demo: anomali volume dan penarikan produk.
const canonCodes = new Set(canon.map((c) => c.code));
const verifiedOthers = raw.filter((r) => r.verification_status === "verified" && !canonCodes.has(r.code));
const anomaly = verifiedOthers[0]; const recall = verifiedOthers[1]; const ready = verifiedOthers[verifiedOthers.length - 1]; // siap diproses produsen (belum ada tahap hilir)
if (anomaly) anomaly.stage = Math.max(anomaly.stage, 5);
if (recall) recall.stage = 6;
if (ready && ready !== anomaly && ready !== recall) { ready.stage = 2; ready.producer_id = null; }
for (const r of raw) {
  const c = cooperatives.find((x) => x.id === r.cooperative_id); const f = farmers.find((x) => x.id === r.farmer_id);
  const verified = r.verification_status === "verified";
  const { stage, ...b } = r;
  // Harga dan biaya (Rp/liter, tiruan): sebagian memenuhi batas bawah Pasal 9, sebagian di bawah, sebagian belum dicatat.
  const cost = Math.round(between2(45000, 80000) / 1000) * 1000; const roll = rnd2();
  let costOut = cost; let paid;
  if (roll < 0.1) { costOut = null; paid = null; }
  else if (roll < 0.22) paid = Math.floor((cost * between2(1.02, 1.15)) / 500) * 500;
  else paid = Math.ceil((cost * between2(1.2, 1.4)) / 500) * 500;
  if (r.code === "ARK-KRG-2610-0001") { costOut = 60000; paid = 75000; }
  const isRecall = recall && r.code === recall.code;
  batches.push({
    ...b,
    surat_jalan_no: stage >= 2 && r.verification_status !== "rejected" ? `MOCK-SJ-${r.code.slice(-9).replace(/-/g, "")}` : null,
    excise_band_no: stage >= 3 && verified && producers.find((p) => p.id === r.producer_id)?.nppbkc_no ? `MOCK-PITA-${r.code.slice(-9).replace(/-/g, "")}` : null,
    verified_by: verified || r.verification_status === "rejected" ? "Dinas Perindustrian & Perdagangan Prov. Bali" : null,
    production_cost_per_liter: costOut, purchase_price_per_liter: paid,
    recalled_at: isRecall ? "2026-11-02T09:00:00Z" : null,
    recall_reason: isRecall ? "Hasil uji petik berkala menemukan kadar metanol 0,028% b/v (melebihi ambang batas maksimal). Seluruh batch ditarik dari peredaran." : "",
    is_demo: true,
  });
  const d0 = r.distillation_date; const prod = producers.find((p) => p.id === r.producer_id);
  const steps = [
    ["perajin", f.alias, "Destilasi dan penyetoran bahan baku", d0],
    ["koperasi", c.name, "Pembelian bahan baku dan pencatatan batch", addDays(d0, 1)],
    ["produsen", prod?.name ?? "", "Kontrol kualitas, pengemasan, dan label cukai", addDays(d0, 6)],
    ["distributor", pick(distributors), "Distribusi dari produsen", addDays(d0, 12)],
    ["sub_distributor", pick(subDistributors), "Distribusi lanjutan", addDays(d0, 16)],
    ["penjual_langsung", pick(sellers), "Diterima penjual langsung", addDays(d0, 19)],
  ];
  let prevQ = r.volume_liters;
  steps.slice(0, stage).forEach(([actor_type, actor_name, event, event_date], i) => {
    let q = r.volume_liters;
    if (i >= 2) q = Math.max(1, Math.round(prevQ * between2(0.9, 0.99)));
    if (anomaly && r.code === anomaly.code && i === 4) q = Math.round(prevQ * 1.25); // sengaja melebihi tahap sebelumnya (demo anomali)
    prevQ = q;
    events.push({ batch_code: r.code, step: i + 1, actor_type, actor_name, event, event_date: clampDate(event_date), quantity_liters: q });
  });
}
console.log("demo anomali volume:", anomaly?.code, "| demo penarikan:", recall?.code, "| siap diproses:", ready?.code);
batches.sort((a, b) => a.code.localeCompare(b.code));

const out = { _note: "DATA DEMO TIRUAN dibangkitkan oleh scripts/generate-demo-data.mjs (seed tetap). Bukan data entitas atau produk nyata.", cooperatives, producers, farmers, batches, events };
const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/seed.json");
writeFileSync(target, JSON.stringify(out, null, 1) + "\n");
console.log(`seed.json: ${cooperatives.length} koperasi, ${producers.length} produsen, ${farmers.length} perajin, ${batches.length} batch, ${events.length} peristiwa rantai`);
const tally = {}; batches.forEach((b) => { tally[b.verification_status] = (tally[b.verification_status] ?? 0) + 1; }); console.log(tally);
