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
const blank = {
  cooperative_id: "", farmer_id: "", sap_type: "aren", distillation_date: "", volume_liters: "",
  distill_temp_c: "", distill_duration_min: "", surat_jalan_no: "", equipment_sanitized: false,
  production_cost_per_liter: "", purchase_price_per_liter: "", lab_tested: false, lab_name: "",
  lab_ethanol_pct: "", lab_methanol_pct: "", lab_note: ""
};

function Form() {
  const [coops, setCoops] = useState<Coop[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadError, setLoadError] = useState("");
  const [f, setF] = useState(blank);
  const [source, setSource] = useState<"manual" | "ocr">("manual");
  const [confirmed, setConfirmed] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState<Ocr | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrError, setOcrError] = useState("");

  const set = (key: string, value: string | boolean) => setF((old) => ({ ...old, [key]: value }));

  useEffect(() => {
    fetch("/api/cooperatives")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error();
        setCoops(data);
        setF((old) => ({ ...old, cooperative_id: data[0]?.id ?? "" }));
      })
      .catch(() => setLoadError("Daftar koperasi tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman."));
  }, []);

  useEffect(() => {
    if (!f.cooperative_id) return;
    fetch(`/api/farmers?cooperative_id=${encodeURIComponent(f.cooperative_id)}`)
      .then((r) => r.json())
      .then((d) => setFarmers(Array.isArray(d) ? d : []))
      .catch(() => setFarmers([]));
  }, [f.cooperative_id]);

  const cost = toNum(f.production_cost_per_liter);
  const paid = toNum(f.purchase_price_per_liter);
  const priceStatus = cost && cost > 0 && paid && paid > 0 ? priceFloorStatus(cost, paid) : null;
  const floorVal = cost && cost > 0 ? priceFloor(cost) : 0;

  async function readCertificate(file: File | undefined) {
    setOcr(null);
    setOcrError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setOcrError("Gunakan gambar JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_IMAGE) {
      setOcrError("Ukuran gambar maksimal 4 MB.");
      return;
    }
    setOcrBusy(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/lab-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: dataUrl.split(",")[1], mime_type: file.type }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOcrError(data.message ?? "Pembacaan otomatis gagal. Isi hasil lab secara manual.");
        return;
      }
      setOcr(data);
      setSource("ocr");
      setConfirmed(false);
      setF((old) => ({
        ...old,
        lab_tested: true,
        lab_name: data.fields.lab_name || old.lab_name,
        lab_ethanol_pct: data.fields.ethanol_pct === null ? old.lab_ethanol_pct : String(data.fields.ethanol_pct),
        lab_methanol_pct: data.fields.methanol_pct === null ? old.lab_methanol_pct : String(data.fields.methanol_pct),
        lab_note: `Dibaca AI dari sertifikat${data.fields.report_date ? ` (${data.fields.report_date})` : ""}; kesimpulan: ${String(data.fields.verdict).replace("_", " ")}`,
      }));
    } catch {
      setOcrError("Pembacaan otomatis gagal. Isi hasil lab secara manual.");
    } finally {
      setOcrBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setRes(null);
    if (source === "ocr" && !confirmed) {
      setRes({ error: "ocr_unconfirmed" });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cooperative_id: f.cooperative_id,
          farmer_id: f.farmer_id || null,
          sap_type: f.sap_type,
          distillation_date: f.distillation_date,
          volume_liters: toNum(f.volume_liters),
          distill_temp_c: toNum(f.distill_temp_c),
          distill_duration_min: toNum(f.distill_duration_min),
          surat_jalan_no: f.surat_jalan_no,
          equipment_sanitized: f.equipment_sanitized,
          production_cost_per_liter: cost,
          purchase_price_per_liter: paid,
          lab_tested: f.lab_tested,
          lab_name: f.lab_name,
          lab_ethanol_pct: toNum(f.lab_ethanol_pct),
          lab_methanol_pct: toNum(f.lab_methanol_pct),
          lab_note: f.lab_note,
          lab_report_source: source,
        }),
      });
      setRes(await response.json());
    } catch {
      setRes({ error: "network_failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wide">
      <p className="note" style={{ marginBottom: "16px" }}>
        <Link href="/koperasi" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
          ← Kembali ke Dasbor Koperasi
        </Link>
      </p>

      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 8px" }}>📝 Catat Batch Produksi Arak Baru</h1>
        <p className="note" style={{ fontSize: "15px" }}>
          Daftarkan produksi bahan baku dari perajin untuk memulai jejak ketertelusuran rantai pasok resmi.
        </p>
      </div>

      {loadError && <div className="panel bad" role="alert">{loadError}</div>}
      {!loadError && !coops.length && <p className="note" role="status">Memuat data koperasi…</p>}

      <form onSubmit={submit}>
        {/* ── BAGIAN 1: PRODUKSI ── */}
        <div style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h2 style={{ fontSize: "1.2rem", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🌾</span> 1. Data Produksi & Bahan Baku
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label htmlFor="coop">Koperasi Penanggung Jawab</label>
              <select id="coop" required value={f.cooperative_id} onChange={(e) => set("cooperative_id", e.target.value)}>
                {coops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="farmer">Perajin Penyuling</label>
              <select id="farmer" value={f.farmer_id} onChange={(e) => set("farmer_id", e.target.value)}>
                <option value="">Pilih Perajin Binaan</option>
                {farmers.map((x) => <option key={x.id} value={x.id}>{x.alias}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="sap">Jenis Nira</label>
              <select id="sap" value={f.sap_type} onChange={(e) => set("sap_type", e.target.value)}>
                <option value="aren">Nira Aren</option>
                <option value="kelapa">Nira Kelapa</option>
                <option value="lontar">Nira Lontar</option>
              </select>
            </div>

            <div>
              <label htmlFor="date">Tanggal Destilasi</label>
              <input id="date" type="date" required value={f.distillation_date} onChange={(e) => set("distillation_date", e.target.value)} />
            </div>

            <div>
              <label htmlFor="vol">Volume Hasil (Liter)</label>
              <input id="vol" type="number" inputMode="decimal" required placeholder="cth: 120" value={f.volume_liters} onChange={(e) => set("volume_liters", e.target.value)} />
            </div>

            <div>
              <label htmlFor="temp">Suhu Destilasi (°C)</label>
              <input id="temp" type="number" inputMode="decimal" required placeholder="Suhu ideal 76-80 °C" value={f.distill_temp_c} onChange={(e) => set("distill_temp_c", e.target.value)} />
            </div>

            <div>
              <label htmlFor="dur">Durasi Destilasi (Menit)</label>
              <input id="dur" type="number" inputMode="numeric" required placeholder="cth: 150" value={f.distill_duration_min} onChange={(e) => set("distill_duration_min", e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--paper)", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <label style={{ display: "flex", alignItems: "center", margin: 0, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={f.equipment_sanitized} onChange={(e) => set("equipment_sanitized", e.target.checked)} />
              <span>🧼 Peralatan destilasi dibersihkan & disanitasi sebelum proses</span>
            </label>
          </div>
        </div>

        {/* ── BAGIAN 2: LEGALITAS & HARGA ── */}
        <div style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h2 style={{ fontSize: "1.2rem", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚖️</span> 2. Kepatuhan Dokumen & Batas Harga (Pasal 9)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="sj">Nomor Surat Jalan Desa (Pasal 8)</label>
              <input id="sj" value={f.surat_jalan_no} maxLength={40} placeholder="cth: SJ-DESA-2026-001" onChange={(e) => set("surat_jalan_no", e.target.value)} />
              <span className="note">Surat jalan pengangkutan bahan baku dari desa asal ke koperasi.</span>
            </div>

            <div>
              <label htmlFor="cost">Biaya Produksi Perajin (Rp/liter)</label>
              <input id="cost" type="number" inputMode="numeric" placeholder="cth: 60000" value={f.production_cost_per_liter} onChange={(e) => set("production_cost_per_liter", e.target.value)} />
            </div>

            <div>
              <label htmlFor="paid">Harga Beli Koperasi (Rp/liter)</label>
              <input id="paid" type="number" inputMode="numeric" placeholder="cth: 75000" value={f.purchase_price_per_liter} onChange={(e) => set("purchase_price_per_liter", e.target.value)} />
            </div>
          </div>

          {/* Indikator Pasal 9 */}
          {cost && cost > 0 && (
            <div style={{
              marginTop: "16px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: priceStatus === "memenuhi" ? "var(--green-light)" : "var(--amber-light)",
              border: `1px solid ${priceStatus === "memenuhi" ? "var(--green)" : "var(--amber)"}`,
              fontSize: "14px"
            }}>
              <strong>Evaluasi Pergub Bali No. 1/2020 Pasal 9:</strong>
              <div style={{ marginTop: "4px" }}>
                Batas bawah harga beli yang adil: <strong>{rupiah(floorVal)}/liter</strong> (biaya produksi + 20%).
                {priceStatus === "memenuhi" ? (
                  <span style={{ color: "var(--green-dark)", display: "block", fontWeight: 700, marginTop: "2px" }}>
                    ✅ Memenuhi: Harga beli koperasi melindungi kesejahteraan perajin.
                  </span>
                ) : paid ? (
                  <span style={{ color: "var(--red)", display: "block", fontWeight: 700, marginTop: "2px" }}>
                    ⚠️ Di bawah batas: Harga beli kurang dari batas minimum yang diwajibkan regulasi.
                  </span>
                ) : (
                  <span className="note" style={{ display: "block" }}>Masukkan harga beli untuk evaluasi.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── BAGIAN 3: SERTIFIKAT LAB AI ── */}
        <div style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h2 style={{ fontSize: "1.2rem", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🔬</span> 3. Sertifikat Hasil Uji Laboratorium
          </h2>

          <div style={{ padding: "12px 16px", background: "var(--paper)", borderRadius: "8px", border: "1px solid var(--line)", marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", margin: 0, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={f.lab_tested} onChange={(e) => set("lab_tested", e.target.checked)} />
              <span>Sudah memiliki hasil uji laboratorium resmi</span>
            </label>
          </div>

          {/* Upload Box AI */}
          <div style={{
            border: "2px dashed #B9D6C5",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            background: "linear-gradient(135deg,#F5FBF7 0%,#E8F5F0 100%)",
            marginBottom: "20px"
          }}>
            <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📸</div>
            <strong style={{ fontSize: "16px", display: "block", color: "var(--green-dark)" }}>
              Ekstraksi Dokumen Otomatis (Vision AI)
            </strong>
            <p className="note" style={{ maxWidth: "55ch", margin: "4px auto 16px" }}>
              Unggah foto lembar hasil uji lab untuk mengisi nama laboratorium, kadar etanol, dan metanol secara otomatis.
            </p>
            <input
              id="cert"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={ocrBusy}
              onChange={(e) => readCertificate(e.target.files?.[0])}
              style={{ display: "inline-block" }}
            />
          </div>

          {ocrBusy && <p className="note" role="status">⏳ AI sedang membaca dan mengekstrak data sertifikat…</p>}
          {ocrError && <div className="panel warn" role="alert">{ocrError}</div>}
          {ocr && (
            <div className="panel" role="status" style={{ borderLeftColor: "var(--green)" }}>
              <strong>✅ Berhasil diekstrak (Tingkat Keyakinan: {Math.round(ocr.fields.confidence * 100)}%)</strong>
              <p className="note" style={{ margin: "4px 0 0" }}>
                Data telah terisi pada kolom di bawah. Periksa dan cocokkan dengan fisik dokumen sebelum menyimpan.
              </p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="labname">Nama Laboratorium</label>
              <input id="labname" value={f.lab_name} maxLength={100} placeholder="cth: Balai Laboratorium Kesehatan Bali" onChange={(e) => set("lab_name", e.target.value)} />
            </div>

            <div>
              <label htmlFor="eth">Kadar Etanol (% v/v)</label>
              <input id="eth" inputMode="decimal" placeholder="cth: 38.5" value={f.lab_ethanol_pct} onChange={(e) => set("lab_ethanol_pct", e.target.value)} />
            </div>

            <div>
              <label htmlFor="met">Kadar Metanol (% b/v)</label>
              <input id="met" inputMode="decimal" placeholder="cth: 0.004 (maks 0.01)" value={f.lab_methanol_pct} onChange={(e) => set("lab_methanol_pct", e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="note">Catatan Tambahan Laboratorium</label>
              <input id="note" value={f.lab_note} maxLength={300} placeholder="Keterangan dokumen atau nomor laporan uji" onChange={(e) => set("lab_note", e.target.value)} />
            </div>
          </div>

          {source === "ocr" && (
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--amber-light)", borderRadius: "8px", border: "1px solid var(--amber)" }}>
              <label style={{ display: "flex", alignItems: "center", margin: 0, cursor: "pointer", fontWeight: 700, color: "var(--amber-ink)" }}>
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>Saya menyatakan telah mencocokkan angka di atas dengan dokumen fisik asli.</span>
              </label>
            </div>
          )}
        </div>

        {/* ── TOMBOL SUBMIT ── */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button disabled={busy || !coops.length} style={{ padding: "14px 32px", fontSize: "16px", fontWeight: 700 }}>
            {busy ? "⏳ Menyimpan Data…" : "💾 Simpan & Terbitkan Batch"}
          </button>
          <Link href="/koperasi" className="button-link secondary" style={{ textDecoration: "none" }}>
            Batal
          </Link>
        </div>
      </form>

      {/* ── HASIL PENYIMPANAN ── */}
      {res?.code && (
        <div className="panel" style={{ marginTop: "28px", borderLeftColor: "var(--green)" }}>
          <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "8px" }}>
            🎉 Batch Berhasil Didaftarkan: <span className="mono">{res.code}</span>
          </strong>
          <p style={{ margin: "0 0 10px" }}>
            Skor Triase Risiko: <strong>{res.risk ? RISK_LABEL[res.risk.label] : ""}</strong> ({res.risk?.score})
          </p>
          <p className="note">
            Status saat ini: <strong>Laporan Mandiri Koperasi</strong>. Batch kini masuk ke antrean verifikator sebelum dapat dilanjutkan ke produsen.
          </p>
          <div className="actions" style={{ marginTop: "16px" }}>
            <Link className="button-link" href={`/batch/${res.code}`}>
              📄 Buka Paspor Publik Batch
            </Link>
            <Link className="button-link secondary" href="/koperasi">
              Kembali ke Dasbor Koperasi
            </Link>
          </div>
        </div>
      )}

      {res?.error && (
        <div className="panel bad" role="alert" style={{ marginTop: "28px" }}>
          <strong>Penyimpanan Gagal:</strong>{" "}
          {res.error === "validation_failed"
            ? `Periksa kembali kolom isian: ${JSON.stringify(res.fields)}`
            : res.error === "ocr_unconfirmed"
            ? "Harap centang konfirmasi bahwa angka hasil bacaan AI sudah dicocokkan dengan dokumen fisik asli."
            : res.error === "forbidden"
            ? "Akun Anda tidak memiliki kewenangan mencatat batch untuk koperasi ini."
            : res.error === "unauthenticated"
            ? "Sesi masuk berakhir. Silakan masuk kembali."
            : "Terjadi gangguan saat menyimpan batch. Periksa data dan koneksi Anda."}
        </div>
      )}
    </main>
  );
}

export default function BatchBaru() {
  return <RequireRole roles={["koperasi", "admin"]} title="Catat Batch Produksi Baru">{() => <Form />}</RequireRole>;
}
