import { notFound } from "next/navigation";
import Link from "next/link";
import { getBatchView } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { QrCode } from "@/components/QrCode";
import { VerificationBadge, RiskBadge, PriceBadge } from "@/components/Badges";
import { ACTOR_LABEL, ACTOR_TYPES } from "@/lib/permissions";
import { CHECK_LABEL, CHECK_STATUS_LABEL, RISK_LABEL, fmtPct } from "@/lib/labels";
import { METHANOL_LIMIT_PCT } from "@/lib/risk";

export const dynamic = "force-dynamic";

export default async function BatchPage({ params }: { params: { code: string } }) {
  const b = await getBatchView(decodeURIComponent(params.code));
  if (!b) notFound();

  const url = `${siteUrl()}/batch/${b.code}`;
  const failed = b.verifications.filter((v) => v.status === "ditolak");
  const passedCount = b.verifications.filter((v) => v.status === "lulus").length;

  // Persentase metanol terhadap batas aman
  const methanolPct = b.lab_methanol_pct ?? 0;
  const isOverMethanol = b.lab_tested && b.lab_methanol_pct !== null && b.lab_methanol_pct > METHANOL_LIMIT_PCT;

  return (
    <main className="wide">
      <p className="note" style={{ marginBottom: "16px" }}>
        <Link href="/batch" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 600 }}>
          ← Kembali ke Direktori Batch
        </Link>
      </p>

      {/* ── PASPOR DIGITAL BATCH CARD ── */}
      <div className="passport-card">
        {/* Header Paspor */}
        <div className="passport-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
            <span className="batch-code-tag">
              🏷️ {b.code}
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <VerificationBadge status={b.verification_status} recalled={b.recalled} />
              <RiskBadge label={b.risk.label} />
              {b.is_demo && <span className="badge warn-b">Data Demo</span>}
            </div>
          </div>
          <h1>{b.cooperative.name}</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "15px" }}>
            📍 {b.cooperative.village}, Kabupaten {b.cooperative.regency} · Izin Koperasi: {b.cooperative.permit_no || "Terdaftar"}
          </p>
        </div>

        {/* Isi Paspor */}
        <div className="passport-body">
          {/* Alert Penarikan Produk */}
          {b.recalled && (
            <div className="banner-bad" role="alert" style={{ marginTop: 0, marginBottom: "24px" }}>
              <strong>🚫 BATCH INI DITARIK DARI PEREDARAN</strong>
              <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
                Produk ini tidak boleh dijual, didistribusikan, atau disajikan ke konsumen.
                <br /><strong>Alasan penarikan:</strong> {b.recall_reason || "Pelanggaran baku mutu keamanan pangan."}
              </p>
            </div>
          )}

          {/* Alert Pemeriksaan Ditolak */}
          {!b.recalled && failed.length > 0 && (
            <div className="banner-bad" role="alert" style={{ marginTop: 0, marginBottom: "24px" }}>
              <strong>⚠️ {failed.length} dari 9 Pemeriksaan Tidak Memenuhi Syarat</strong>
              <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
                Pemeriksaan yang gagal: {failed.map((v) => CHECK_LABEL[v.check_type]).join(", ")}.
              </p>
            </div>
          )}

          {/* Grid Informasi Asal Bahan Baku */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "32px"
          }}>
            <div>
              <span className="note" style={{ display: "block", fontSize: "12px" }}>🌾 Jenis Bahan Baku</span>
              <strong style={{ fontSize: "15px", textTransform: "capitalize" }}>Nira {b.sap_type}</strong>
            </div>
            <div>
              <span className="note" style={{ display: "block", fontSize: "12px" }}>📅 Tanggal Destilasi</span>
              <strong style={{ fontSize: "15px" }}>{b.distillation_date}</strong>
            </div>
            <div>
              <span className="note" style={{ display: "block", fontSize: "12px" }}>🧪 Volume Awal</span>
              <strong style={{ fontSize: "15px" }}>{b.volume_liters} Liter</strong>
            </div>
            <div>
              <span className="note" style={{ display: "block", fontSize: "12px" }}>👤 Perajin Penyuling</span>
              <strong style={{ fontSize: "15px" }}>{b.farmer ? b.farmer.alias : "Perajin Binaan"}</strong>
            </div>
          </div>

          {/* ── BAGIAN 1: RANTAI PASOK BERURUTAN ── */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "1.3rem", marginTop: 0, marginBottom: "8px" }}>
              🔗 Jejak Rantai Pasok (Pergub Bali No. 1/2020)
            </h2>
            <p className="note" style={{ marginBottom: "16px" }}>
              Setiap mata rantai memvalidasi identitas pelaku, tanggal serah terima, dan jumlah volume liter untuk mencegah pencampuran.
            </p>

            <div className="chain-stepper">
              {ACTOR_TYPES.map((type, idx) => {
                const event = b.events.find((e) => e.actor_type === type);
                const isCompleted = !!event;

                return (
                  <div key={type} className={`chain-step ${isCompleted ? "active" : "empty"}`}>
                    <div className="step-num">{idx + 1}</div>
                    <div className="step-info">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <span className="actor-badge">{ACTOR_LABEL[type]}</span>
                        {isCompleted && event.quantity_liters && (
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green-dark)", background: "var(--green-light)", padding: "2px 8px", borderRadius: "6px" }}>
                            🧪 {event.quantity_liters} Liter
                          </span>
                        )}
                      </div>
                      <strong>{isCompleted ? event.actor_name : `${ACTOR_LABEL[type]} (Belum Tercatat)`}</strong>
                      <div className="meta">
                        {isCompleted ? (
                          <>
                            <span>{event.event}</span> · <span>📅 {event.event_date}</span>
                          </>
                        ) : (
                          <span>Menunggu proses verifikasi dan serah terima tahap sebelumnya.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── BAGIAN 2: HASIL UJI LABORATORIUM ── */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "1.3rem", marginTop: 0, marginBottom: "8px" }}>
              🧪 Hasil Pengujian Laboratorium Resmi
            </h2>
            <p className="note" style={{ marginBottom: "16px" }}>
              Pengujian senyawa metanol dan kadar etanol untuk menjamin arak aman dari bahaya racun oplosan.
            </p>

            <div className="meter-grid">
              {/* Meter Metanol */}
              <div className={`meter-card ${isOverMethanol ? "bad" : ""}`} style={{ borderLeft: `4px solid ${isOverMethanol ? "var(--red)" : "var(--green)"}` }}>
                <span className="note" style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  Kadar Metanol (Maks. 0,010% b/v)
                </span>
                <div className="meter-val" style={{ color: isOverMethanol ? "var(--red)" : "var(--green-dark)" }}>
                  {b.lab_tested && b.lab_methanol_pct !== null ? `${fmtPct(b.lab_methanol_pct)}% b/v` : "Belum Diuji"}
                </div>
                <div className="meter-bar-track">
                  <div
                    className="meter-bar-fill"
                    style={{
                      width: `${Math.min((methanolPct / 0.02) * 100, 100)}%`,
                      background: isOverMethanol ? "var(--red)" : "var(--green)"
                    }}
                  />
                </div>
                <div className="meter-limit">
                  {b.lab_tested && b.lab_methanol_pct !== null ? (
                    isOverMethanol ? (
                      <span className="bad-text">🚨 Berbahaya: Melebihi batas aman maksimal!</span>
                    ) : (
                      <span style={{ color: "var(--green-dark)", fontWeight: 600 }}>✅ Aman: Di bawah ambang batas bahaya</span>
                    )
                  ) : (
                    <span>Sertifikat lab belum diverifikasi</span>
                  )}
                </div>
              </div>

              {/* Meter Etanol */}
              <div className="meter-card" style={{ borderLeft: "4px solid var(--green)" }}>
                <span className="note" style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  Kadar Etanol (Alkohol Alami)
                </span>
                <div className="meter-val" style={{ color: "var(--ink)" }}>
                  {b.lab_tested && b.lab_ethanol_pct !== null ? `${fmtPct(b.lab_ethanol_pct)}% v/v` : "Belum Diuji"}
                </div>
                <div className="meter-bar-track">
                  <div
                    className="meter-bar-fill"
                    style={{
                      width: `${Math.min(((b.lab_ethanol_pct ?? 0) / 50) * 100, 100)}%`,
                      background: "var(--green)"
                    }}
                  />
                </div>
                <div className="meter-limit">
                  <span>Golongan C Tradisional Bali (30% – 50% v/v)</span>
                </div>
              </div>
            </div>

            {b.lab_tested && (
              <p className="note" style={{ marginTop: "10px" }}>
                🏢 <strong>Laboratorium Penguji:</strong> {b.lab_name || "Balai Pengujian Terakreditasi"} {b.lab_note && `· Catatan: ${b.lab_note}`}
              </p>
            )}
          </section>

          {/* ── BAGIAN 3: 9 LAPISAN PEMERIKSAAN ── */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>
                📋 9 Lapisan Pemeriksaan Mutu & Legalitas
              </h2>
              <span style={{ fontSize: "13px", fontWeight: 700, color: passedCount === 9 ? "var(--green-dark)" : "var(--amber-ink)" }}>
                {passedCount} dari 9 Terpenuhi
              </span>
            </div>
            <p className="note" style={{ marginBottom: "16px" }}>
              Setiap batch dinilai secara menyeluruh sebelum diizinkan beredar di pasaran.
            </p>

            <div className="check-grid">
              {b.verifications.map((v) => {
                const isPass = v.status === "lulus";
                const isFail = v.status === "ditolak";
                const icon = isPass ? "✅" : isFail ? "❌" : "⏳";
                const cardClass = isPass ? "pass" : isFail ? "fail" : "pending";

                return (
                  <div key={v.check_type} className={`check-card ${cardClass}`}>
                    <div className="check-icon">{icon}</div>
                    <div className="check-content">
                      <strong>{CHECK_LABEL[v.check_type] ?? v.check_type}</strong>
                      <span>{v.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── BAGIAN 4: SKOR RISIKO & TRISE AI ── */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "1.3rem", marginTop: 0, marginBottom: "8px" }}>
              📊 Triase Skor Risiko AI
            </h2>
            <div style={{
              background: b.risk.label === "rendah" ? "var(--green-light)" : b.risk.label === "tinggi" ? "var(--red-light)" : "var(--amber-light)",
              border: `1px solid ${b.risk.label === "rendah" ? "var(--green)" : b.risk.label === "tinggi" ? "var(--red)" : "var(--amber)"}`,
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "1.1rem", color: b.risk.label === "rendah" ? "var(--green-dark)" : b.risk.label === "tinggi" ? "var(--red)" : "var(--amber-ink)" }}>
                  Tingkat Risiko: {RISK_LABEL[b.risk.label]} (Skor Triase: {b.risk.score})
                </strong>
                <span className="note" style={{ fontSize: "12px" }}>Model {b.risk.version}</span>
              </div>
              <ul style={{ margin: "10px 0 0", paddingLeft: "20px", fontSize: "14px" }}>
                {b.risk.factors.map((f) => (
                  <li key={f.name} style={{ marginBottom: "4px" }}>{f.detail}</li>
                ))}
              </ul>
            </div>
            <p className="note">{b.disclaimer}</p>
          </section>

          {/* ── BAGIAN 5: KODE QR & KONSULTASI ADVISOR ── */}
          <section style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap"
          }}>
            <QrCode value={url} label={`QR Paspor Batch ${b.code}`} />
            <div style={{ flex: 1, minWidth: "220px" }}>
              <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}>
                Kode Batch Kemasan: <span className="mono">{b.code}</span>
              </strong>
              <p className="note" style={{ margin: "0 0 16px" }}>
                Pindai QR ini pada kemasan botol arak untuk memverifikasi keaslian langsung dari ponsel pintar tanpa perlu memasang aplikasi tambahan.
              </p>
              <div className="actions" style={{ marginTop: 0 }}>
                <Link className="button-link" href={`/advisor?batch=${encodeURIComponent(b.code)}`}>
                  💬 Tanya AI Advisor tentang Batch Ini
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
