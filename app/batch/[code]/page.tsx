import { notFound } from "next/navigation";
import Link from "next/link";
import { getBatchView } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { QrCode } from "@/components/QrCode";
import { VerificationBadge } from "@/components/Badges";
import { ACTOR_LABEL, ACTOR_TYPES } from "@/lib/permissions";
import { CHECK_LABEL, CHECK_STATUS_LABEL, RISK_LABEL, fmtPct } from "@/lib/labels";
import { METHANOL_LIMIT_PCT } from "@/lib/risk";

export const dynamic = "force-dynamic";

export default async function BatchPage({ params }: { params: { code: string } }) {
  const b = await getBatchView(decodeURIComponent(params.code));
  if (!b) notFound();
  const cls = b.risk.label === "rendah" ? "" : b.risk.label === "sedang" ? "warn" : "bad";
  const url = `${siteUrl()}/batch/${b.code}`;
  const failed = b.verifications.filter((v) => v.status === "ditolak");
  return (<main>
    <h1>Batch <span className="mono">{b.code}</span></h1>
    <p><VerificationBadge status={b.verification_status} recalled={b.recalled} />{b.is_demo && <span className="badge warn-b">Data demo</span>}</p>
    {b.recalled && <div className="banner-bad" role="alert"><strong>Batch ini ditarik dari peredaran</strong>Jangan dijual atau disajikan. Alasan: {b.recall_reason || "tidak dicantumkan"}.</div>}
    {!b.recalled && failed.length > 0 && <div className="banner-bad" role="alert"><strong>{failed.length} pemeriksaan tidak terpenuhi</strong>{failed.map((v) => CHECK_LABEL[v.check_type]).join(", ")}. Lihat rinciannya di bawah.</div>}
    <div className="panel"><strong>{b.cooperative.name}</strong><br />{b.cooperative.village}, {b.cooperative.regency}<br />
      Nira {b.sap_type}, destilasi {b.distillation_date}, {b.volume_liters} liter{b.farmer && <><br />Perajin: {b.farmer.alias}</>}</div>

    <h2>Rantai pasok</h2>
    <ol className="timeline">
      {ACTOR_TYPES.map((type) => {
        const event = b.events.find((e) => e.actor_type === type);
        return event
          ? <li key={type}><strong>{ACTOR_LABEL[type]}: {event.actor_name}</strong><br /><span className="note">{event.event} · {event.event_date}{event.quantity_liters ? ` · ${event.quantity_liters} liter` : ""}</span></li>
          : <li key={type} className="pending"><span className="note">{ACTOR_LABEL[type]}: belum tercatat</span></li>;
      })}
    </ol>
    <p className="note">Urutan mengikuti Pergub Bali No. 1 Tahun 2020. Batch yang belum diverifikasi tidak dapat dilanjutkan ke produsen atau distributor, dan jumlah liter tidak boleh bertambah antar tahap.</p>

    <h2>Pemeriksaan ({b.verifications.filter((v) => v.status === "lulus").length} dari {b.verifications.length} terpenuhi)</h2>
    {b.verifications.map((v) => (<div key={v.check_type} className={"panel " + (v.status === "lulus" ? "" : v.status === "ditolak" ? "bad" : "warn")}>
      <strong>{CHECK_LABEL[v.check_type] ?? v.check_type}: {CHECK_STATUS_LABEL[v.status]}</strong><br />{v.note}</div>))}
    {b.lab_tested && b.lab_methanol_pct !== null && <p className="note">Kadar metanol dilaporkan {fmtPct(b.lab_methanol_pct)}% b/v; batas {fmtPct(METHANOL_LIMIT_PCT)}% b/v (Peraturan BPOM No. 5 Tahun 2021 Pasal 4).{b.lab_ethanol_pct !== null && <> Kadar etanol dilaporkan {fmtPct(b.lab_ethanol_pct)}% v/v.</>}</p>}

    <h2>Skor risiko</h2>
    <div className={"panel " + cls}><strong>{RISK_LABEL[b.risk.label]} (skor: {b.risk.score})</strong>
      <ul>{b.risk.factors.map((f) => <li key={f.name}>{f.detail}</li>)}</ul>
      <span className="note">Model {b.risk.version}</span></div>
    <p className="note">{b.disclaimer}</p>

    <h2>QR batch</h2>
    <div className="row" style={{ alignItems: "center" }}><QrCode value={url} label={`QR menuju halaman batch ${b.code}`} /><div><p className="mono">{b.code}</p><p className="note">Pindai untuk membuka halaman ini. Pada produk nyata, QR harus tercetak unik pada kemasan dan terkait label cukai agar tidak mudah disalin.</p></div></div>
    <p className="no-print"><Link className="button-link" href={`/advisor?batch=${encodeURIComponent(b.code)}`}>Tanya Advisor tentang batch ini</Link></p>
  </main>);
}
