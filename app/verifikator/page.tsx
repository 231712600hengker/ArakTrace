"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { PriceBadge, RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { ACTOR_LABEL, CHAIN_ORDER } from "@/lib/permissions";
import { fmtPct, rupiah } from "@/lib/labels";
import { RoleGuide } from "@/components/RoleGuide";

/** Hal yang perlu diperiksa verifikator pada dokumen asli, diturunkan dari data batch. */
function checks(r: DashboardRow): { text: string; red: boolean }[] {
  const out: { text: string; red: boolean }[] = r.risk.factors.map((t) => ({ text: t, red: t.includes("melebihi batas metanol") }));
  if (r.lab.source === "ocr") out.push({ text: "Angka lab dibaca AI: cocokkan dengan dokumen asli sebelum memverifikasi.", red: false });
  if (!r.lab.tested) out.push({ text: "Belum ada hasil uji lab.", red: false });
  if (r.price_status === "di_bawah_batas") out.push({ text: "Harga beli dari perajin di bawah batas bawah Pasal 9.", red: true });
  if (r.price_status === "tidak_dicatat") out.push({ text: "Biaya produksi dan harga beli belum dicatat.", red: false });
  if (!r.surat_jalan_no) out.push({ text: "Surat jalan desa belum dicatat (Pasal 8).", red: false });
  return out;
}

function QueueItem({ r, onDone }: { r: DashboardRow; onDone: (text: string, ok: boolean) => void }) {
  const [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  async function decide(decision: "verified" | "rejected") {
    if (decision === "rejected" && !note.trim()) { onDone("Isi alasan penolakan terlebih dahulu.", false); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/batches/${encodeURIComponent(r.code)}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note }) });
      onDone(res.ok ? `${r.code}: ${decision === "verified" ? "terverifikasi" : "ditolak"}.` : res.status === 403 ? "Akun Anda tidak berhak memverifikasi." : "Keputusan tidak dapat disimpan.", res.ok);
    } catch { onDone("Koneksi gagal. Coba lagi.", false); } finally { setBusy(false); }
  }
  const list = checks(r);
  const hasRed = list.some((c) => c.red);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.25 }}
      className="item attn"
      style={{ marginBottom: "20px" }}
    >
      {/* Header baris */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>
            <Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none", fontSize: "1.1rem" }}>{r.code}</Link>
          </h3>
          <p className="note" style={{ margin: 0 }}>{r.cooperative}, {r.regency} · nira {r.sap_type} · {r.distillation_date}</p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <RiskBadge label={r.risk.label} />
          <PriceBadge status={r.price_status} />
        </div>
      </div>

      {/* Key-value info */}
      <dl className="kv" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--line)", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px" }}>
        <div><dt>Suhu / durasi</dt><dd>{r.distill_temp_c} °C / {r.distill_duration_min} menit</dd></div>
        <div><dt>Alat dibersihkan</dt><dd>{r.equipment_sanitized ? "✅ Ya (laporan mandiri)" : "❓ Belum dikonfirmasi"}</dd></div>
        <div><dt>Volume produksi</dt><dd>{r.volume_liters} L</dd></div>
        <div><dt>Metanol / etanol</dt><dd>{r.lab.tested ? `${fmtPct(r.lab.methanol_pct)}% / ${fmtPct(r.lab.ethanol_pct)}%` : "Tidak ada hasil lab"}</dd></div>
        <div><dt>Laboratorium</dt><dd>{r.lab.name || "-"}{r.lab.source === "ocr" ? " (dibaca AI)" : ""}</dd></div>
        <div><dt>Surat jalan</dt><dd>{r.surat_jalan_no ?? "Belum ada"}</dd></div>
        {r.price && <div><dt>Biaya / dibayar (batas)</dt><dd>{rupiah(r.price.cost)} / {rupiah(r.price.paid)} ({rupiah(r.price.floor)})</dd></div>}
      </dl>

      {/* Daftar periksa */}
      {list.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {list.map((c) => (
            <div key={c.text} className={`check-row ${c.red ? "bad" : "warn"}`}>
              <span style={{ fontSize: "1.1rem" }}>{c.red ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize: "14px" }}>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Catatan */}
      <label htmlFor={`n-${r.code}`} style={{ fontWeight: 700, marginBottom: "6px", display: "block", color: hasRed ? "var(--red)" : "var(--ink)" }}>
        📝 Catatan {hasRed ? "(wajib bila menolak)" : "(opsional)"}
      </label>
      <input id={`n-${r.code}`} maxLength={300} style={{ width: "100%", marginBottom: "12px" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuliskan catatan untuk koperasi…" />

      {/* Tombol aksi */}
      <div className="verif-actions">
        <motion.button
          type="button"
          disabled={busy}
          onClick={() => decide("verified")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: "var(--green-gradient)", color: "#fff", border: "none" }}
        >
          ✅ Verifikasi
        </motion.button>
        <motion.button
          type="button"
          className="btn-danger"
          disabled={busy}
          onClick={() => decide("rejected")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ❌ Tolak
        </motion.button>
      </div>
    </motion.div>
  );
}

function VerifiedItem({ r, onDone }: { r: DashboardRow; onDone: (text: string, ok: boolean) => void }) {
  const [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  const holders = r.chain.filter((e) => CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen);
  async function recall() {
    if (!reason.trim()) { onDone("Isi alasan penarikan terlebih dahulu.", false); return; }
    if (!window.confirm(`Tarik batch ${r.code} dari peredaran? Batch akan ditandai pada halaman publik dan tidak dapat dilanjutkan.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/batches/${encodeURIComponent(r.code)}/recall`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      const d = await res.json();
      if (!res.ok) { onDone(res.status === 409 ? "Batch sudah ditarik." : "Penarikan tidak dapat disimpan.", false); return; }
      const who = (d.holders as { actor_type: keyof typeof ACTOR_LABEL; actor_name: string; quantity_liters: number | null }[]).map((h) => `${ACTOR_LABEL[h.actor_type]}: ${h.actor_name}${h.quantity_liters ? ` (${h.quantity_liters} L)` : ""}`).join("; ");
      onDone(`${r.code} ditarik. Hubungi pemegang: ${who || "belum ada pemegang hilir"}.`, true);
    } catch { onDone("Koneksi gagal. Coba lagi.", false); } finally { setBusy(false); }
  }
  return (
    <details className="item" style={{ marginBottom: "12px", background: "linear-gradient(to right,#F0FAF5 0%,#fff 10%)", borderLeft: "4px solid var(--green)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>
        <span className="mono">{r.code}</span> · {r.cooperative}
        <span className="note" style={{ marginLeft: "8px" }}>{holders.length ? `${holders.length} pemegang hilir` : "belum ke hilir"}</span>
      </summary>
      <div style={{ marginTop: "12px" }}>
        <div style={{ marginBottom: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <VerificationBadge status={r.verification_status} />
          <RiskBadge label={r.risk.label} />
          <PriceBadge status={r.price_status} />
        </div>
        <ChainMini chain={r.chain} />
        {r.volume_status === "tidak_konsisten" && <div className="banner-bad" role="alert"><strong>Volume tidak konsisten</strong>{r.volume_note}</div>}
        <p className="note" style={{ margin: "8px 0 12px" }}><strong>Pemegang:</strong> {holders.length ? holders.map((h) => `${ACTOR_LABEL[h.actor_type]} ${h.actor_name}`).join(" → ") : "belum ada pemegang hilir"}</p>
        <label htmlFor={`r-${r.code}`}>Alasan penarikan</label>
        <input id={`r-${r.code}`} maxLength={300} style={{ width: "100%", marginBottom: "12px" }} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="actions">
          <button type="button" className="btn-danger" disabled={busy} onClick={recall}>🚫 Tarik dari peredaran</button>
          <Link className="button-link secondary" href={`/batch/${r.code}`}>Halaman publik</Link>
        </div>
      </div>
    </details>
  );
}

function Content() {
  const { data, error, reload } = useDashboard();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const done = (text: string, ok: boolean) => { setMsg({ ok, text }); if (ok) reload(); };
  if (error) return <main className="wide"><div className="panel bad" role="alert">{error}</div></main>;
  if (!data) return <main className="wide"><p className="note" role="status">Memuat dasbor…</p></main>;
  const { stats, rows } = data;
  const queue = rows.filter((r) => r.verification_status === "self_reported" && !r.recalled);
  const verified = rows.filter((r) => r.verification_status === "verified" && !r.recalled);
  const recalled = rows.filter((r) => r.recalled);
  const rejected = rows.filter((r) => r.verification_status === "rejected" && !r.recalled);
  return (<main className="wide">

    {/* ── Header ── */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-header"
      style={{ background: "linear-gradient(135deg,#EAF4FF 0%,#E0EDFF 100%)", borderColor: "#B0CCF0" }}
    >
      <div className="role-pill" style={{ background: "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)" }}>🔍 Verifikator</div>
      <h1>Dasbor Verifikator</h1>
      <p className="desc">Periksa batch secara menyeluruh, cocokkan dokumen asli, lalu tentukan keputusan verifikasi atau penolakan.</p>
    </motion.div>

    <StatCards items={[
      { label: "Menunggu verifikasi", value: stats.menunggu },
      { label: "Berisiko tinggi", value: stats.berisiko_tinggi, alert: true },
      { label: "Terverifikasi", value: stats.terverifikasi },
      { label: "Ditolak", value: stats.ditolak },
      { label: "Ditarik", value: stats.ditarik, alert: true },
    ]} />

    <RoleGuide role="verifikator" steps={[
      { title: "Prioritaskan antrean", detail: "Mulai dari batch dengan risiko tertinggi." },
      { title: "Cocokkan bukti asli", detail: "Periksa sertifikat lab dan surat jalan di luar sistem." },
      { title: "Putuskan dan pantau", detail: "Verifikasi, tolak dengan alasan, atau tarik batch bila perlu." },
    ]} />

    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`panel ${msg.ok ? "" : "bad"}`}
          role={msg.ok ? "status" : "alert"}
          style={{ marginTop: "20px" }}
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Antrean verifikasi ── */}
    <section className="section" style={{ marginTop: "40px" }}>
      <h2>📋 Antrean Verifikasi</h2>
      <p className="note" style={{ marginBottom: "20px", maxWidth: "65ch" }}>
        Diurutkan dari risiko tertinggi. Periksa dokumen asli di luar sistem (hasil uji lab, surat jalan) sebelum memutuskan.
      </p>
      {!queue.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-state"
        >
          <div className="icon">✅</div>
          <p>Tidak ada batch yang menunggu verifikasi saat ini.</p>
        </motion.div>
      )}
      <AnimatePresence mode="popLayout">
        {queue.map((r) => <QueueItem key={r.code} r={r} onDone={done} />)}
      </AnimatePresence>
    </section>

    {/* ── Terverifikasi ── */}
    <section className="section" style={{ marginTop: "40px" }}>
      <h2>✅ Terverifikasi — pantau dan tarik bila perlu</h2>
      {!verified.length && <p className="note">Belum ada batch terverifikasi.</p>}
      {verified.map((r) => <VerifiedItem key={r.code} r={r} onDone={done} />)}
    </section>

    {/* ── Ditarik ── */}
    {recalled.length > 0 && (
      <section className="section" style={{ marginTop: "40px" }}>
        <h2>🚫 Ditarik dari Peredaran</h2>
        {recalled.map((r) => (
          <div key={r.code} className="item recalled" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none" }}>{r.code}</Link>
              </h3>
              <VerificationBadge status={r.verification_status} recalled />
            </div>
            <p className="note bad-text" style={{ margin: "6px 0", fontWeight: 600 }}>⚠️ {r.recall_reason}</p>
            <ChainMini chain={r.chain} />
            <p className="note" style={{ marginTop: "8px" }}>
              <strong>Pemegang:</strong> {r.chain.filter((e) => CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen).map((e) => `${ACTOR_LABEL[e.actor_type]} ${e.actor_name}`).join(" → ") || "belum ada pemegang hilir"}
            </p>
          </div>
        ))}
      </section>
    )}

    {/* ── Ditolak ── */}
    {rejected.length > 0 && (
      <section className="section" style={{ marginTop: "40px" }}>
        <details style={{ padding: "16px 20px", background: "var(--muted-light)", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.05rem" }}>❌ Ditolak ({rejected.length})</summary>
          <div style={{ marginTop: "16px" }}>
            {rejected.map((r) => (
              <div key={r.code} className="item" style={{ background: "#fff", marginBottom: "8px" }}>
                <h3><Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none" }}>{r.code}</Link></h3>
                <div style={{ marginBottom: "6px" }}><VerificationBadge status={r.verification_status} /></div>
                <p className="note" style={{ margin: "4px 0" }}>{r.verification_note}</p>
              </div>
            ))}
          </div>
        </details>
      </section>
    )}
  </main>);
}

export default function Verifikator() {
  return <RequireRole roles={["verifikator", "admin"]} title="Dasbor verifikator">{() => <Content />}</RequireRole>;
}
