import Link from "next/link";
import { CodeSearch } from "@/components/CodeSearch";
import { listBatches, getCooperatives } from "@/lib/db";

export const dynamic = "force-dynamic";

const QUICK_BATCHES = [
  { code: "ARK-KRG-2610-0001", label: "Terverifikasi", desc: "Rantai lengkap & lolos uji lab", status: "ok" },
  { code: "ARK-KRG-2610-0002", label: "Menunggu", desc: "Laporan mandiri koperasi", status: "pending" },
  { code: "ARK-KLK-2609-0001", label: "Anomali Volume", desc: "Volume hilir tidak wajar", status: "warn" },
  { code: "ARK-GYR-2608-0001", label: "Ditarik", desc: "Penarikan produk aktif", status: "bad" },
];

export default async function Home() {
  let stats: { label: string; value: number }[] = [];
  try {
    const [batches, coops] = await Promise.all([listBatches({ limit: 500 }), getCooperatives()]);
    stats = [
      { label: "Batch Terdata", value: batches.length },
      { label: "Terverifikasi Resmi", value: batches.filter((b) => b.verification_status === "verified" && !b.recalled).length },
      { label: "Ditarik demi Keamanan", value: batches.filter((b) => b.recalled).length },
      { label: "Koperasi Terhubung", value: coops.length },
    ];
  } catch { /* beranda tetap tampil tanpa statistik */ }

  return (
    <main className="wide">
      {/* ── HERO SECTION ── */}
      <section className="hero">
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 18px",
          background: "linear-gradient(135deg, #E8F5F0 0%, #D1EDE1 100%)",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--green-dark)",
          marginBottom: "16px",
          border: "1px solid var(--green)",
          textTransform: "uppercase",
          letterSpacing: ".05em"
        }}>
          <span>🌴</span> Platform Ketertelusuran Arak Tradisional Bali
        </div>

        <h1>Arak Bali Terverifikasi, Aman, dan Berkeadilan</h1>
        <p className="lead">
          Pindai QR atau masukkan kode batch kemasan untuk melihat asal usul perajin, hasil uji laboratorium, status legalitas, dan riwayat rantai distribusi sebelum dikonsumsi.
        </p>

        <CodeSearch />

        {/* Quick Batch Selector */}
        <div style={{ marginTop: "24px" }}>
          <p className="note" style={{ marginBottom: "12px", fontWeight: 600 }}>
            ⚡ Uji langsung simulasi batch:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
            {QUICK_BATCHES.map((b) => (
              <Link
                key={b.code}
                href={`/batch/${b.code}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  padding: "10px 14px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all .2s ease",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: "13px", color: "var(--green-dark)" }}>{b.code}</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: b.status === "ok" ? "var(--green-light)" : b.status === "bad" ? "var(--red-light)" : "var(--amber-light)",
                    color: b.status === "ok" ? "var(--green-dark)" : b.status === "bad" ? "var(--red)" : "var(--amber-ink)"
                  }}>
                    {b.label}
                  </span>
                </div>
                <span className="note" style={{ fontSize: "12px" }}>{b.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="stats" role="list" aria-label="Statistik platform" style={{ marginTop: "36px" }}>
            {stats.map((s) => (
              <div key={s.label} role="listitem" className="stat">
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3 PILAR SOLUSI ── */}
      <section className="section">
        <h2>🎯 3 Masalah Nyata yang Diselesaikan</h2>
        <div className="grid-3">
          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>🔬</div>
            <h3>Keamanan Mutu & Bebas Oplosan</h3>
            <p>Mencegah risiko keracunan metanol melalui pembacaan sertifikat lab resmi berbasis Vision AI dan verifikasi ketat ambang batas keamanan.</p>
          </div>
          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>📜</div>
            <h3>9 Lapisan Pemeriksaan Legalitas</h3>
            <p>Memastikan legalitas produsen, izin edar BPOM, sanitasi penyulingan, surat jalan desa, hingga kepatuhan pita cukai sebelum arak beredar.</p>
          </div>
          <div className="card">
            <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>⚖️</div>
            <h3>Perlindungan Kesejahteraan Perajin</h3>
            <p>Menegakkan batas bawah harga beli dari perajin sesuai Pergub No. 1/2020 (biaya produksi + 20%), menjaga martabat perajin lokal.</p>
          </div>
        </div>
      </section>

      {/* ── ALUR RANTAI PASOK ── */}
      <section className="section">
        <h2>🔗 Rantai Pasok Berintegritas (Pergub Bali No. 1/2020)</h2>
        <p className="lead" style={{ fontSize: "15px", marginBottom: "20px" }}>
          Bukan sekadar garis waktu statis, melainkan sistem gerbang verifikasi aktif yang memvalidasi setiap perpindahan produk:
        </p>

        <div className="grid-4" style={{ marginTop: "16px" }}>
          <div className="card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🚪</div>
            <h3>Gerbang Verifikasi</h3>
            <p>Batch yang belum lolos verifikasi dilarang diproses produsen maupun masuk ke jalur distribusi.</p>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⚖️</div>
            <h3>Rekonsiliasi Volume</h3>
            <p>Jumlah liter dipantau di tiap tahap. Jika volume bertambah, sistem menandai indikasi pemalsuan.</p>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--amber)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🚨</div>
            <h3>Penarikan Terarah</h3>
            <p>Bila ditemukan cacat mutu, produk langsung ditarik beserta daftar pemegang hilir secara transparan.</p>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>📑</div>
            <h3>Jejak Dokumen Digital</h3>
            <p>Setiap perpindahan mencatat identitas pelaku, surat jalan desa, dan nomor pita cukai resmi.</p>
          </div>
        </div>
      </section>

      {/* ── PILIHAN PERAN ── */}
      <section className="section">
        <h2>👥 Akses Khusus Pemangku Kepentingan</h2>
        <p className="note" style={{ marginBottom: "20px" }}>
          Konsumen & pembeli tidak perlu login untuk memeriksa QR. Akses masuk berikut diperuntukkan bagi pelaku tata kelola arak:
        </p>

        <div className="role-select-grid">
          <Link href="/masuk" className="role-card">
            <div className="role-icon">🏘️</div>
            <h3>Koperasi & Perajin</h3>
            <p>Catat batch produksi baru dari perajin, unggah sertifikat lab melalui AI OCR, dan pantau status penerimaan.</p>
            <span className="role-cta">Masuk Koperasi →</span>
          </Link>

          <Link href="/masuk" className="role-card">
            <div className="role-icon">🔍</div>
            <h3>Verifikator Resmi</h3>
            <p>Periksa antrean pengajuan berdasarkan triase skor risiko, cocokkan dokumen asli, dan putuskan verifikasi atau penolakan.</p>
            <span className="role-cta">Masuk Verifikator →</span>
          </Link>

          <Link href="/masuk" className="role-card">
            <div className="role-icon">🏭</div>
            <h3>Produsen Berizin</h3>
            <p>Lanjutkan pemrosesan batch terverifikasi, catat pita cukai, dan distribusikan dengan rekonsiliasi volume liter ketat.</p>
            <span className="role-cta">Masuk Produsen →</span>
          </Link>
        </div>
      </section>

      {/* ── TEKNOLOGI AI ── */}
      <section className="section">
        <h2>🤖 Integrasi Kecerdasan Buatan (AI)</h2>
        <div className="grid-3">
          <div className="card">
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📸</div>
            <h3>Vision AI OCR Sertifikat</h3>
            <p>Membaca foto dokumen uji laboratorium secara otomatis untuk mengisi kadar etanol dan metanol, dengan validasi manual wajib.</p>
          </div>
          <div className="card">
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>💬</div>
            <h3>AI Advisor Regulasi</h3>
            <p>Asisten interaktif berbasis RAG (BM25 + Gemini) untuk menjawab pertanyaan seputar hukum dan produksi aman. <Link href="/advisor" style={{ color: "var(--green)", fontWeight: 700 }}>Konsultasi sekarang →</Link></p>
          </div>
          <div className="card">
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📊</div>
            <h3>Model Skor Risiko</h3>
            <p>Menganalisis parameter destilasi untuk memprioritaskan antrean verifikasi secara cerdas dan efisien.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
