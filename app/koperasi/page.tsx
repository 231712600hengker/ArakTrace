"use client";
import Link from "next/link";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { PriceBadge, RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { rupiah } from "@/lib/labels";

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
    <h1>Dasbor koperasi</h1>
    <div className="actions" style={{ marginTop: 0 }}><Link className="button-link" href="/koperasi/batch-baru">Catat batch baru</Link><Link className="button-link secondary" href="/advisor">Tanya AI Advisor</Link></div>
    <StatCards items={[{ label: "Total batch", value: stats.total }, { label: "Menunggu verifikasi", value: stats.menunggu }, { label: "Terverifikasi", value: stats.terverifikasi }, { label: "Ditolak", value: stats.ditolak, alert: true }, { label: "Ditarik", value: stats.ditarik, alert: true }]} />
    {attention.length > 0 && <section className="section"><h2>Perlu tindakan</h2>
      {attention.map((r) => <div key={r.code} className="item attn"><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link> <VerificationBadge status={r.verification_status} recalled={r.recalled} />
        <ul className="warn-list red">{todo(r).filter((t) => !t.startsWith("Menunggu")).map((t) => <li key={t}>{t}</li>)}</ul></div>)}</section>}
    <section className="section"><h2>Semua batch</h2>
      {!rows.length && <p className="note">Belum ada batch. Mulai dengan mencatat batch pertama.</p>}
      {rows.map((r) => (<div key={r.code} className={`item${r.recalled ? " recalled" : ""}`}>
        <h3><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link></h3>
        <p className="note" style={{ margin: "0 0 4px" }}>Nira {r.sap_type} · {r.distillation_date} · {r.volume_liters} liter · {r.regency}</p>
        <VerificationBadge status={r.verification_status} recalled={r.recalled} /><RiskBadge label={r.risk.label} /><PriceBadge status={r.price_status} />
        <ChainMini chain={r.chain} />
        {todo(r).length > 0 && <ul className="warn-list">{todo(r).map((t) => <li key={t}>{t}</li>)}</ul>}
      </div>))}
    </section>
  </main>);
}

export default function KoperasiDashboard() {
  return <RequireRole roles={["koperasi", "admin"]} title="Dasbor koperasi">{() => <Content />}</RequireRole>;
}
