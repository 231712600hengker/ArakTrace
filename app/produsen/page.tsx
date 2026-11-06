"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { ACTOR_LABEL, CHAIN_ORDER, type ActorType } from "@/lib/permissions";
import { STEP_DEFAULT_EVENT } from "@/lib/labels";
import { RoleGuide } from "@/components/RoleGuide";

const ERRORS: Record<string, string> = {
  batch_not_verified: "Batch belum diverifikasi, sehingga belum dapat dilanjutkan.", batch_recalled: "Batch sudah ditarik dari peredaran dan tidak dapat dilanjutkan.",
  chain_order_invalid: "Tahap harus berurutan setelah tahap terakhir yang tercatat.", chain_conflict: "Peristiwa lain baru saja dicatat. Muat ulang lalu coba lagi.",
  forbidden: "Akun Anda tidak berhak menambah peristiwa ini.", unauthenticated: "Sesi berakhir. Masuk kembali.",
};
const today = () => new Date().toISOString().slice(0, 10);

function StepForm({ row, onDone }: { row: DashboardRow; onDone: () => void }) {
  const options = row.allowed_next.filter((t) => CHAIN_ORDER[t] >= CHAIN_ORDER.produsen);
  const [type, setType] = useState<ActorType>(options[0]);
  const [f, setF] = useState({ actor_name: "", event: STEP_DEFAULT_EVENT[options[0]] ?? "", event_date: today(), quantity_liters: String(row.last_quantity), excise_band_no: "" });
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));
  const own = type === "produsen";
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/batches/${encodeURIComponent(row.code)}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actor_type: type, actor_name: f.actor_name, event: f.event, event_date: f.event_date, quantity_liters: Number(f.quantity_liters.replace(",", ".")), excise_band_no: f.excise_band_no }) });
      const d = await r.json();
      if (r.ok) { setMsg({ ok: true, text: "Tahap tercatat." }); onDone(); return; }
      setMsg({ ok: false, text: d.error === "volume_exceeds_previous" ? `Jumlah melebihi tahap sebelumnya (maksimal ${d.max_liters} L). Jumlah tidak boleh bertambah antar tahap.` : d.error === "validation_failed" ? `Perbaiki isian: ${JSON.stringify(d.fields)}` : ERRORS[d.error] ?? "Tahap tidak dapat disimpan." });
    } catch { setMsg({ ok: false, text: "Koneksi gagal. Coba lagi." }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} style={{ background: "linear-gradient(135deg,#F5FBF7 0%,#fff 100%)", border: "1px solid #B9D6C5", borderRadius: "10px", padding: "20px", marginTop: "16px" }}>
      <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "15px", color: "var(--green-dark)" }}>
        📋 Catat tahap berikutnya
      </p>
      <label htmlFor={`t-${row.code}`}>Jenis tahap</label>
      <select id={`t-${row.code}`} value={type} onChange={(e) => { const t = e.target.value as ActorType; setType(t); set("event", STEP_DEFAULT_EVENT[t] ?? ""); }}>
        {options.map((o) => <option key={o} value={o}>{ACTOR_LABEL[o]}</option>)}
      </select>
      {!own && <><label htmlFor={`n-${row.code}`}>Nama pelaku — {ACTOR_LABEL[type]}</label><input id={`n-${row.code}`} required maxLength={80} value={f.actor_name} onChange={(e) => set("actor_name", e.target.value)} /></>}
      {own && <p className="note" style={{ margin: "8px 0" }}>ℹ️ Nama produsen diambil dari akun Anda.</p>}
      <label htmlFor={`e-${row.code}`}>Deskripsi peristiwa</label>
      <input id={`e-${row.code}`} required maxLength={120} value={f.event} onChange={(e) => set("event", e.target.value)} />
      <div className="row">
        <div>
          <label htmlFor={`d-${row.code}`}>📅 Tanggal</label>
          <input id={`d-${row.code}`} type="date" required value={f.event_date} onChange={(e) => set("event_date", e.target.value)} />
        </div>
        <div>
          <label htmlFor={`q-${row.code}`}>🧪 Jumlah (liter, maks. {row.last_quantity})</label>
          <input id={`q-${row.code}`} type="number" inputMode="decimal" required min="0.01" step="any" value={f.quantity_liters} onChange={(e) => set("quantity_liters", e.target.value)} />
        </div>
      </div>
      {own && <><label htmlFor={`p-${row.code}`}>🏷️ Nomor pita cukai (jika ada)</label><input id={`p-${row.code}`} maxLength={60} value={f.excise_band_no} onChange={(e) => set("excise_band_no", e.target.value)} /></>}
      <p style={{ marginTop: "16px" }}>
        <motion.button
          disabled={busy}
          className="btn-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ background: "var(--green-gradient)", color: "#fff", border: "none", padding: "10px 24px", fontWeight: 700 }}
        >
          {busy ? "⏳ Menyimpan…" : "💾 Catat Tahap"}
        </motion.button>
      </p>
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`note ${msg.ok ? "" : "bad-text"}`}
            role={msg.ok ? "status" : "alert"}
          >
            {msg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

function Content() {
  const { data, error, reload } = useDashboard();
  if (error) return <main className="wide"><div className="panel bad" role="alert">{error}</div></main>;
  if (!data) return <main className="wide"><p className="note" role="status">Memuat dasbor…</p></main>;
  const { stats, rows } = data;
  const active = rows.filter((r) => !r.recalled && r.allowed_next.some((t) => CHAIN_ORDER[t] >= CHAIN_ORDER.produsen));
  const rest = rows.filter((r) => !active.includes(r));
  return (<main className="wide">

    {/* ── Header ── */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-header"
      style={{ background: "linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%)", borderColor: "#FBD38D" }}
    >
      <div className="role-pill" style={{ background: "linear-gradient(135deg,#D97706 0%,#B45309 100%)" }}>🏭 Produsen</div>
      <h1>Dasbor Produsen</h1>
      <p className="desc">
        Catat setiap tahap distribusi batch arak yang sudah terverifikasi. Jumlah liter tidak boleh bertambah antar tahap.
      </p>
    </motion.div>

    <StatCards items={[
      { label: "Siap diproses", value: stats.siap_diproses },
      { label: "Dalam distribusi", value: stats.dalam_distribusi },
      { label: "Selesai", value: stats.selesai },
      { label: "Ditarik", value: stats.ditarik, alert: true },
    ]} />

    <RoleGuide role="produsen" steps={[
      { title: "Pilih batch terverifikasi", detail: "Hanya batch yang lolos verifikasi dapat dilanjutkan." },
      { title: "Catat tahap berikutnya", detail: "Masukkan pelaku, tanggal, jumlah, dan pita cukai bila tersedia." },
      { title: "Jaga volume", detail: "Jumlah tidak boleh melebihi tahap sebelumnya." },
    ]} />

    {/* ── Perlu dilanjutkan ── */}
    <section className="section" style={{ marginTop: "40px" }}>
      <h2>⚙️ Perlu Dilanjutkan</h2>
      {!active.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-state"
        >
          <div className="icon">✅</div>
          <p>Tidak ada batch yang menunggu tahap berikutnya saat ini.</p>
        </motion.div>
      )}
      {active.map((r, i) => (
        <motion.details
          key={r.code}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          className="item attn"
          open={active.length <= 3}
          style={{ marginBottom: "16px" }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.05rem" }}>
            <span className="mono">{r.code}</span>
            <span className="note" style={{ marginLeft: "8px" }}>🏘️ {r.cooperative} · 🧪 {r.last_quantity} L tersisa</span>
          </summary>
          <div style={{ marginTop: "12px" }}>
            <p className="note" style={{ margin: "0 0 10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span>🌾 Nira {r.sap_type}</span>
              <span>📅 {r.distillation_date}</span>
              <span>📦 Produksi {r.volume_liters} L</span>
            </p>
            <div style={{ marginBottom: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <VerificationBadge status={r.verification_status} recalled={r.recalled} />
              <RiskBadge label={r.risk.label} />
            </div>
            <ChainMini chain={r.chain} />
            {r.volume_status === "tidak_konsisten" && (
              <div className="banner-bad" role="alert" style={{ marginTop: "12px" }}>
                <strong>⚠️ Volume tidak konsisten</strong>{r.volume_note}
              </div>
            )}
            <StepForm row={r} onDone={reload} />
            <p className="note" style={{ marginTop: "16px" }}>
              <Link href={`/batch/${r.code}`} style={{ color: "var(--green)", fontWeight: 600 }}>📄 Lihat halaman publik batch →</Link>
            </p>
          </div>
        </motion.details>
      ))}
    </section>

    {/* ── Selesai atau ditarik ── */}
    {rest.length > 0 && (
      <section className="section" style={{ marginTop: "40px" }}>
        <h2>✅ Selesai atau Ditarik</h2>
        {rest.map((r) => (
          <div key={r.code} className={`item${r.recalled ? " recalled" : ""}`} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none" }}>{r.code}</Link>
              </h3>
              <VerificationBadge status={r.verification_status} recalled={r.recalled} />
            </div>
            {r.recalled && <p className="note bad-text" style={{ margin: "6px 0", fontWeight: 600 }}>🚫 {r.recall_reason}</p>}
            <ChainMini chain={r.chain} />
          </div>
        ))}
      </section>
    )}
  </main>);
}

export default function ProdusenDashboard() {
  return <RequireRole roles={["produsen", "admin"]} title="Dasbor produsen">{() => <Content />}</RequireRole>;
}
