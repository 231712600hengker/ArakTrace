import Link from "next/link";
import { listBatches, getCooperatives } from "@/lib/db";
import { RISK_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { VerificationBadge, RiskBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";
type Search = { q?: string; status?: string; risk?: string; regency?: string };

export default async function BatchList({ searchParams }: { searchParams: Search }) {
  let rows: Awaited<ReturnType<typeof listBatches>> = [];
  let regencies: string[] = [];
  let failed = false;

  try {
    rows = await listBatches({
      q: searchParams.q,
      status: searchParams.status,
      risk: searchParams.risk,
      regency: searchParams.regency,
      limit: 100,
    });
    regencies = [...new Set((await getCooperatives()).map((c) => c.regency))].sort();
  } catch {
    failed = true;
  }

  return (
    <main className="wide">
      {/* ── HEADER DIREKTORI ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 8px" }}>📦 Direktori Batch Arak Bali</h1>
        <p className="note" style={{ fontSize: "15px" }}>
          Telusuri seluruh batch arak yang terdaftar dalam rantai pasok resmi berdasarkan kabupaten, status verifikasi, atau tingkat risiko.
        </p>
      </div>

      {/* ── FILTER PENCARIAN ── */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: "20px 24px",
        marginBottom: "28px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <form className="filters" method="get" action="/batch" style={{ margin: 0, gap: "12px" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label htmlFor="q">Cari Kode atau Koperasi</label>
            <input id="q" name="q" placeholder="cth: ARK-KRG atau Tirta Nira" defaultValue={searchParams.q ?? ""} />
          </div>
          <div>
            <label htmlFor="regency">Kabupaten</label>
            <select id="regency" name="regency" defaultValue={searchParams.regency ?? ""}>
              <option value="">Semua Wilayah</option>
              {regencies.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status">Status Verifikasi</label>
            <select id="status" name="status" defaultValue={searchParams.status ?? ""}>
              <option value="">Semua Status</option>
              {Object.entries(VERIFICATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="risk">Tingkat Risiko</label>
            <select id="risk" name="risk" defaultValue={searchParams.risk ?? ""}>
              <option value="">Semua Tingkat</option>
              {Object.entries(RISK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ flex: "0 0 auto", alignSelf: "flex-end" }}>
            <button type="submit" style={{ width: "100%", minHeight: "46px" }}>
              🔍 Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {failed && (
        <div className="panel bad" role="alert">
          Daftar batch tidak dapat dimuat. Silakan periksa koneksi atau muat ulang halaman.
        </div>
      )}

      {!failed && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span className="note" style={{ fontWeight: 600 }}>
            Ditemukan <strong>{rows.length}</strong> batch terdaftar
          </span>
          {(searchParams.q || searchParams.regency || searchParams.status || searchParams.risk) && (
            <Link href="/batch" style={{ fontSize: "13px", color: "var(--red)", fontWeight: 600, textDecoration: "none" }}>
              ✕ Reset Filter
            </Link>
          )}
        </div>
      )}

      {/* ── CARD GRID BATCH ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {rows.map((r) => (
          <Link
            key={r.code}
            href={`/batch/${r.code}`}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "20px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "var(--shadow-sm)",
              transition: "all .25s ease",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
              <span className="mono" style={{ fontSize: "15px", fontWeight: 700, color: "var(--green-dark)" }}>
                {r.code}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <VerificationBadge status={r.verification_status} recalled={r.recalled} />
              </div>
            </div>

            <strong style={{ fontSize: "16px", color: "var(--ink)", marginBottom: "4px" }}>
              {r.cooperative}
            </strong>

            <p className="note" style={{ margin: "0 0 14px", fontSize: "13px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span>📍 {r.regency}</span>
              <span>🌾 Nira {r.sap_type}</span>
              <span>📅 {r.distillation_date}</span>
            </p>

            <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <RiskBadge label={r.risk.label} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                {r.chain_steps} dari 6 tahap rantai
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
