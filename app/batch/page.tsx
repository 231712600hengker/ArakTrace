import Link from "next/link";
import { listBatches, getCooperatives } from "@/lib/db";
import { RISK_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { VerificationBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";
type Search = { q?: string; status?: string; risk?: string; regency?: string };

export default async function BatchList({ searchParams }: { searchParams: Search }) {
  let rows: Awaited<ReturnType<typeof listBatches>> = []; let regencies: string[] = []; let failed = false;
  try {
    rows = await listBatches({ q: searchParams.q, status: searchParams.status, risk: searchParams.risk, regency: searchParams.regency, limit: 100 });
    regencies = [...new Set((await getCooperatives()).map((c) => c.regency))].sort();
  } catch { failed = true; }
  return (<main>
    <h1>Daftar batch</h1>
    <form className="filters" method="get" action="/batch">
      <div><label htmlFor="q">Cari kode atau koperasi</label><input id="q" name="q" defaultValue={searchParams.q ?? ""} /></div>
      <div><label htmlFor="regency">Kabupaten</label><select id="regency" name="regency" defaultValue={searchParams.regency ?? ""}><option value="">Semua</option>{regencies.map((r) => <option key={r}>{r}</option>)}</select></div>
      <div><label htmlFor="status">Verifikasi</label><select id="status" name="status" defaultValue={searchParams.status ?? ""}><option value="">Semua</option>{Object.entries(VERIFICATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div><label htmlFor="risk">Risiko</label><select id="risk" name="risk" defaultValue={searchParams.risk ?? ""}><option value="">Semua</option>{Object.entries(RISK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <button type="submit">Terapkan</button>
    </form>
    {failed && <div className="panel bad" role="alert">Daftar batch tidak dapat dimuat. Coba muat ulang halaman.</div>}
    {!failed && <p className="note" role="status">{rows.length} batch ditemukan.</p>}
    <ul className="card-list">{rows.map((r) => (
      <li key={r.code}><Link href={`/batch/${r.code}`}>
        <span className="mono">{r.code}</span><br />{r.cooperative}, {r.regency} · nira {r.sap_type} · {r.distillation_date}<br />
        <VerificationBadge status={r.verification_status} recalled={r.recalled} />
        <span className={`badge ${r.risk.label === "rendah" ? "" : r.risk.label === "sedang" ? "warn-b" : "bad-b"}`}>{RISK_LABEL[r.risk.label]}</span>
        <span className="note">{r.chain_steps} dari 6 tahap rantai</span>
      </Link></li>))}</ul>
  </main>);
}
