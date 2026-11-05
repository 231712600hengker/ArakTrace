"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/RequireRole";
import { RISK_LABEL, rupiah } from "@/lib/labels";
import { priceFloor, priceFloorStatus } from "@/lib/rules";

type Coop = { id: string; name: string };
type Farmer = { id: string; alias: string };
type Ocr = { fields: { confidence: number }; warnings: string[] };
type Result = { code?: string; risk?: { score: number; label: string; factors: { detail: string }[] }; error?: string; fields?: Record<string, string> };

const toNum = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
const MAX_IMAGE = 4 * 1024 * 1024;
const blank = { cooperative_id: "", farmer_id: "", sap_type: "aren", distillation_date: "", volume_liters: "", distill_temp_c: "", distill_duration_min: "", surat_jalan_no: "", equipment_sanitized: false, production_cost_per_liter: "", purchase_price_per_liter: "", lab_tested: false, lab_name: "", lab_ethanol_pct: "", lab_methanol_pct: "", lab_note: "" };

function Form() {
  const [coops, setCoops] = useState<Coop[]>([]), [farmers, setFarmers] = useState<Farmer[]>([]), [loadError, setLoadError] = useState("");
  const [f, setF] = useState(blank), [source, setSource] = useState<"manual" | "ocr">("manual"), [confirmed, setConfirmed] = useState(false);
  const [res, setRes] = useState<Result | null>(null), [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState<Ocr | null>(null), [ocrBusy, setOcrBusy] = useState(false), [ocrError, setOcrError] = useState("");
  const set = (key: string, value: string | boolean) => setF((old) => ({ ...old, [key]: value }));

  useEffect(() => {
    fetch("/api/cooperatives").then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(); setCoops(data); setF((old) => ({ ...old, cooperative_id: data[0]?.id ?? "" })); })
      .catch(() => setLoadError("Daftar koperasi tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman."));
  }, []);
  useEffect(() => {
    if (!f.cooperative_id) return;
    fetch(`/api/farmers?cooperative_id=${encodeURIComponent(f.cooperative_id)}`).then((r) => r.json()).then((d) => setFarmers(Array.isArray(d) ? d : [])).catch(() => setFarmers([]));
  }, [f.cooperative_id]);

  const cost = toNum(f.production_cost_per_liter), paid = toNum(f.purchase_price_per_liter);
  const priceHint = cost && cost > 0 ? (paid && paid > 0 ? (priceFloorStatus(cost, paid) === "memenuhi" ? `Memenuhi batas bawah Pasal 9 (${rupiah(priceFloor(cost))}/liter).` : `Di bawah batas bawah Pasal 9: minimal ${rupiah(priceFloor(cost))}/liter.`) : `Batas bawah Pasal 9: ${rupiah(priceFloor(cost))}/liter.`) : "";

  async function readCertificate(file: File | undefined) {
    setOcr(null); setOcrError(""); if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setOcrError("Gunakan gambar JPEG, PNG, atau WebP."); return; }
    if (file.size > MAX_IMAGE) { setOcrError("Ukuran gambar maksimal 4 MB."); return; }
    setOcrBusy(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file); });
      const response = await fetch("/api/lab-ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_base64: dataUrl.split(",")[1], mime_type: file.type }) });
      const data = await response.json();
      if (!response.ok) { setOcrError(data.message ?? "Pembacaan otomatis gagal. Isi hasil lab secara manual."); return; }
      setOcr(data); setSource("ocr"); setConfirmed(false);
      setF((old) => ({ ...old, lab_tested: true, lab_name: data.fields.lab_name || old.lab_name, lab_ethanol_pct: data.fields.ethanol_pct === null ? old.lab_ethanol_pct : String(data.fields.ethanol_pct), lab_methanol_pct: data.fields.methanol_pct === null ? old.lab_methanol_pct : String(data.fields.methanol_pct), lab_note: `Dibaca AI dari sertifikat${data.fields.report_date ? ` (${data.fields.report_date})` : ""}; pernyataan dokumen: ${String(data.fields.verdict).replace("_", " ")}` }));
    } catch { setOcrError("Pembacaan otomatis gagal. Isi hasil lab secara manual."); }
    finally { setOcrBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setRes(null);
    if (source === "ocr" && !confirmed) { setRes({ error: "ocr_unconfirmed" }); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        cooperative_id: f.cooperative_id, farmer_id: f.farmer_id || null, sap_type: f.sap_type, distillation_date: f.distillation_date, volume_liters: toNum(f.volume_liters), distill_temp_c: toNum(f.distill_temp_c), distill_duration_min: toNum(f.distill_duration_min),
        surat_jalan_no: f.surat_jalan_no, equipment_sanitized: f.equipment_sanitized, production_cost_per_liter: cost, purchase_price_per_liter: paid,
        lab_tested: f.lab_tested, lab_name: f.lab_name, lab_ethanol_pct: toNum(f.lab_ethanol_pct), lab_methanol_pct: toNum(f.lab_methanol_pct), lab_note: f.lab_note, lab_report_source: source,
      }) });
      setRes(await response.json());
    } catch { setRes({ error: "network_failed" }); } finally { setBusy(false); }
  }

  return <main><p className="note"><Link href="/koperasi">← Kembali ke dasbor</Link></p><h1>Catat batch produksi baru</h1>
    {loadError && <div className="panel bad" role="alert">{loadError}</div>}
    {!loadError && !coops.length && <p className="note" role="status">Memuat daftar koperasi…</p>}
    <form onSubmit={submit}>
      <fieldset><legend>Produksi</legend>
        <label htmlFor="coop">Koperasi</label><select id="coop" required value={f.cooperative_id} onChange={(e) => set("cooperative_id", e.target.value)}>{coops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label htmlFor="farmer">Perajin (alias)</label><select id="farmer" value={f.farmer_id} onChange={(e) => set("farmer_id", e.target.value)}><option value="">Tidak dipilih</option>{farmers.map((x) => <option key={x.id} value={x.id}>{x.alias}</option>)}</select>
        <label htmlFor="sap">Jenis nira</label><select id="sap" value={f.sap_type} onChange={(e) => set("sap_type", e.target.value)}><option>aren</option><option>kelapa</option><option>lontar</option></select>
        <label htmlFor="date">Tanggal destilasi</label><input id="date" type="date" required value={f.distillation_date} onChange={(e) => set("distillation_date", e.target.value)} />
        <label htmlFor="vol">Volume hasil (liter)</label><input id="vol" type="number" inputMode="decimal" required value={f.volume_liters} onChange={(e) => set("volume_liters", e.target.value)} />
        <label htmlFor="temp">Suhu destilasi (°C)</label><input id="temp" type="number" inputMode="decimal" required value={f.distill_temp_c} onChange={(e) => set("distill_temp_c", e.target.value)} />
        <label htmlFor="dur">Durasi destilasi (menit)</label><input id="dur" type="number" inputMode="numeric" required value={f.distill_duration_min} onChange={(e) => set("distill_duration_min", e.target.value)} />
        <label><input type="checkbox" checked={f.equipment_sanitized} onChange={(e) => set("equipment_sanitized", e.target.checked)} /> Alat dibersihkan sebelum destilasi</label>
      </fieldset>
      <fieldset><legend>Dokumen dan harga</legend>
        <label htmlFor="sj">Nomor surat jalan desa (jika ada)</label><input id="sj" value={f.surat_jalan_no} maxLength={40} onChange={(e) => set("surat_jalan_no", e.target.value)} />
        <label htmlFor="cost">Biaya produksi yang disepakati (Rp/liter)</label><input id="cost" type="number" inputMode="numeric" value={f.production_cost_per_liter} onChange={(e) => set("production_cost_per_liter", e.target.value)} />
        <label htmlFor="paid">Harga beli dari perajin (Rp/liter)</label><input id="paid" type="number" inputMode="numeric" value={f.purchase_price_per_liter} onChange={(e) => set("purchase_price_per_liter", e.target.value)} />
        <p className="note" role="status">{priceHint || "Isi keduanya untuk memeriksa batas bawah Pasal 9 (biaya produksi + 20%). Nominal hanya terlihat oleh koperasi dan verifikator, tidak oleh publik."}</p>
      </fieldset>
      <fieldset><legend>Hasil uji laboratorium</legend>
        <label><input type="checkbox" checked={f.lab_tested} onChange={(e) => set("lab_tested", e.target.checked)} /> Sudah ada hasil uji lab</label>
        <label htmlFor="cert">Foto sertifikat lab (opsional, dibaca AI)</label>
        <input id="cert" type="file" accept="image/jpeg,image/png,image/webp" disabled={ocrBusy} onChange={(e) => readCertificate(e.target.files?.[0])} />
        <p className="note">Gambar dikirim ke layanan Google Gemini untuk dibaca. Jangan unggah dokumen yang memuat data pribadi. Hasil bacaan hanya usulan dan wajib Anda periksa.</p>
        {ocrBusy && <p className="note" role="status">AI sedang membaca sertifikat…</p>}
        {ocrError && <div className="panel warn" role="alert">{ocrError}</div>}
        {ocr && <div className="panel warn" role="status"><strong>Hasil bacaan AI (keyakinan {Math.round(ocr.fields.confidence * 100)}%)</strong>{ocr.warnings.length > 0 && <ul>{ocr.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}<span className="note">Kolom di bawah sudah terisi; ubah bila tidak sesuai dokumen asli.</span></div>}
        <label htmlFor="labname">Nama laboratorium</label><input id="labname" value={f.lab_name} maxLength={100} onChange={(e) => set("lab_name", e.target.value)} />
        <label htmlFor="eth">Kadar etanol (% v/v)</label><input id="eth" inputMode="decimal" value={f.lab_ethanol_pct} onChange={(e) => set("lab_ethanol_pct", e.target.value)} />
        <label htmlFor="met">Kadar metanol (% b/v)</label><input id="met" inputMode="decimal" value={f.lab_methanol_pct} onChange={(e) => set("lab_methanol_pct", e.target.value)} />
        <label htmlFor="note">Catatan hasil lab</label><input id="note" value={f.lab_note} maxLength={300} onChange={(e) => set("lab_note", e.target.value)} />
        {source === "ocr" && <label><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Saya sudah mencocokkan angka di atas dengan dokumen asli</label>}
      </fieldset>
      <p><button disabled={busy || !coops.length}>{busy ? "Menyimpan…" : "Simpan batch"}</button></p>
    </form>
    {res?.code && <div className="panel"><strong>Batch tersimpan: {res.code}</strong><p>Skor risiko: <strong>{res.risk ? RISK_LABEL[res.risk.label] : ""}</strong> ({res.risk?.score})</p>{res.risk?.factors.length ? <><p className="note">Alasan:</p><ul>{res.risk.factors.map((factor) => <li key={factor.detail}>{factor.detail}</li>)}</ul></> : <p className="note">Tidak ada faktor risiko yang terdeteksi dari data ini.</p>}<p className="note">Status: laporan mandiri. Verifikator perlu memeriksa sebelum batch dapat dilanjutkan ke produsen.</p><div className="actions"><Link className="button-link" href={`/batch/${res.code}`}>Lihat halaman batch</Link><Link className="button-link secondary" href="/koperasi">Kembali ke dasbor</Link></div></div>}
    {res?.error && <div className="panel bad" role="alert">{res.error === "validation_failed" ? `Perbaiki isian: ${JSON.stringify(res.fields)}` : res.error === "ocr_unconfirmed" ? "Centang konfirmasi bahwa angka hasil bacaan AI sudah dicocokkan dengan dokumen asli." : res.error === "forbidden" ? "Akun Anda tidak berhak mencatat batch untuk koperasi ini." : res.error === "unauthenticated" ? "Sesi berakhir. Masuk kembali." : "Batch tidak dapat disimpan. Periksa koneksi dan data lalu coba kembali."}</div>}
  </main>;
}

export default function BatchBaru() {
  return <RequireRole roles={["koperasi", "admin"]} title="Catat batch produksi baru">{() => <Form />}</RequireRole>;
}
