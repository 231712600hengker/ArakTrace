"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { PriceBadge, RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { rupiah } from "@/lib/labels";
import { RoleGuide } from "@/components/RoleGuide";

/** Hal yang perlu ditindaklanjuti koperasi untuk sebuah batch. */
function todo(r: DashboardRow): string[] {
  const out: string[] = [];
  if (r.recalled) out.push(`Batch ditarik dari peredaran: ${r.recall_reason || "tanpa alasan tercatat"}. Hentikan penjualan dan hubungi verifikator.`);
  if (r.verification_status === "rejected") out.push(`Ditolak verifikator: ${r.verification_note || "tanpa catatan"}. Perbaiki penyebabnya dan catat batch baru dengan hasil lab yang sah.`);
  if (!r.recalled && r.verification_status === "self_reported") out.push("Menunggu pemeriksaan verifikator.");
  if (!r.lab.tested) out.push("Belum ada hasil uji lab. Unggah sertifikat agar batch dapat diverifikasi.");
  if (r.price_status === "di_bawah_batas" && r.price) out.push(`Harga beli ${rupiah(r.price.paid)}/liter di bawah batas bawah Pasal 9 (${rupiah(r.price.floor)}/liter).`);
  if (r.price_status === "tidak_dicatat") out.push("Biaya produksi dan harga beli belum dicatat (diperlukan untuk pemeriksaan Pasal 9).");
  if (!r.surat_jalan_no) out.push("Surat jalan desa belum dicatat.");
  if (r.volume_status === "tidak_konsisten") out.push(r.volume_note);
  return out;
}

function Content() {
  const { data, error } = useDashboard();
  if (error) return <main className="wide"><div className="panel bad" role="alert">{error}</div></main>;
  if (!data) return <main className="wide"><p className="note" role="status">Memuat dasbor…</p></main>;
  const { stats, rows } = data;
  const attention = rows.filter((r) => r.recalled || r.verification_status === "rejected" || r.price_status === "di_bawah_batas" || r.volume_status === "tidak_konsisten");
  return (<main className="wide">

    {/* ── Header ── */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-header"
    >
      <div className="role-pill">🏘️ Koperasi</div>
      <h1>Dasbor Koperasi</h1>
      <p className="desc">Pantau seluruh batch arak yang terdaftar, tindak lanjuti catatan verifikator, dan catat batch baru.</p>
    </motion.div>

    {/* ── Action bar ── */}
    <div className="action-bar">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link className="action-btn primary" href="/koperasi/batch-baru" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1.2rem" }}>➕</span> Catat Batch Baru
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link className="action-btn secondary" href="/advisor" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1.2rem" }}>💬</span> Tanya AI Advisor
        </Link>
      </motion.div>
    </div>

    <StatCards items={[
      { label: "Total batch", value: stats.total },
      { label: "Menunggu verifikasi", value: stats.menunggu },
      { label: "Terverifikasi", value: stats.terverifikasi },
      { label: "Ditolak", value: stats.ditolak, alert: true },
      { label: "Ditarik", value: stats.ditarik, alert: true },
    ]} />
    <p className="note" style={{ marginTop: "8px", marginBottom: "24px" }}>
      Perbarui data batch secara berkala dan segera tindak lanjuti setiap peringatan dari verifikator.
    </p>

    <RoleGuide role="koperasi" steps={[
      { title: "Catat batch", detail: "Isi asal bahan, volume, dan data produksi." },
      { title: "Lampirkan bukti", detail: "Unggah sertifikat lab lalu periksa hasil bacaan AI." },
      { title: "Pantau keputusan", detail: "Tindak lanjuti catatan dari verifikator." },
    ]} />

    {/* ── Perlu tindakan ── */}
    {attention.length > 0 && (
      <section className="section" style={{ marginTop: "40px" }}>
        <h2>⚠️ Perlu Tindakan</h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: "linear-gradient(135deg,#FFF8E7 0%,#FEF2F2 100%)",
            border: "2px solid var(--amber)",
            borderRadius: "var(--radius)",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "var(--amber-ink)", fontWeight: 600 }}>
            🔔 Ada <strong>{attention.length}</strong> batch yang memerlukan perhatian segera. Selesaikan sebelum batch dapat diverifikasi.
          </p>
        </motion.div>
        {attention.map((r, i) => (
          <motion.div
            key={r.code}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="item attn"
            style={{ marginBottom: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>
                <Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none", fontSize: "1.1rem" }}>{r.code}</Link>
              </h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <VerificationBadge status={r.verification_status} recalled={r.recalled} />
                <RiskBadge label={r.risk.label} />
              </div>
            </div>
            <ul className="warn-list red" style={{ marginTop: "8px" }}>
              {todo(r).filter((t) => !t.startsWith("Menunggu")).map((t) => (
                <li key={t} style={{ marginBottom: "4px" }}>⚡ {t}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </section>
    )}

    {/* ── Semua batch ── */}
    <section className="section" style={{ marginTop: "40px" }}>
      <h2>📦 Semua Batch</h2>
      {!rows.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-state"
        >
          <div className="icon">📦</div>
          <p>Belum ada batch terdaftar. Mulai dengan mencatat batch arak pertama Anda.</p>
          <Link href="/koperasi/batch-baru" className="button-link">➕ Catat Batch Baru</Link>
        </motion.div>
      )}
      {rows.map((r, i) => (
        <motion.div
          key={r.code}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
          whileHover={{ x: 3 }}
          className={`item${r.recalled ? " recalled" : ""}`}
          style={{ marginBottom: "16px" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ margin: "0 0 6px" }}>
                <Link href={`/batch/${r.code}`} className="mono" style={{ textDecoration: "none" }}>{r.code}</Link>
              </h3>
              <p className="note" style={{ margin: "0 0 8px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span>🌾 Nira {r.sap_type}</span>
                <span>📅 {r.distillation_date}</span>
                <span>🧪 {r.volume_liters} liter</span>
                <span>📍 {r.regency}</span>
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <VerificationBadge status={r.verification_status} recalled={r.recalled} />
              <RiskBadge label={r.risk.label} />
              <PriceBadge status={r.price_status} />
            </div>
          </div>
          <ChainMini chain={r.chain} />
          {todo(r).length > 0 && (
            <ul className="warn-list" style={{ marginTop: "12px" }}>
              {todo(r).map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
        </motion.div>
      ))}
    </section>
  </main>);
}

export default function KoperasiDashboard() {
  return <RequireRole roles={["koperasi", "admin"]} title="Dasbor koperasi">{() => <Content />}</RequireRole>;
}
