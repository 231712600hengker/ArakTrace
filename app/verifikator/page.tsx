"use client";
import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { PriceBadge, RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { ACTOR_LABEL, CHAIN_ORDER } from "@/lib/permissions";
import { fmtPct, rupiah } from "@/lib/labels";

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
  return (<div className="item attn">
    <h3><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link></h3>
    <p className="note" style={{ margin: "0 0 4px" }}>{r.cooperative}, {r.regency} · nira {r.sap_type} · {r.distillation_date}</p>
    <RiskBadge label={r.risk.label} /><PriceBadge status={r.price_status} />
    <dl className="kv">
      <div><dt>Suhu / durasi</dt><dd>{r.distill_temp_c} °C / {r.distill_duration_min} menit</dd></div>
      <div><dt>Alat dibersihkan</dt><dd>{r.equipment_sanitized ? "Ya (laporan mandiri)" : "Belum dikonfirmasi"}</dd></div>
      <div><dt>Volume produksi</dt><dd>{r.volume_liters} L</dd></div>
      <div><dt>Metanol / etanol</dt><dd>{r.lab.tested ? `${fmtPct(r.lab.methanol_pct)}% / ${fmtPct(r.lab.ethanol_pct)}%` : "Tidak ada hasil lab"}</dd></div>
      <div><dt>Laboratorium</dt><dd>{r.lab.name || "-"}{r.lab.source === "ocr" ? " (dibaca AI)" : ""}</dd></div>
      <div><dt>Surat jalan</dt><dd>{r.surat_jalan_no ?? "Belum ada"}</dd></div>
      {r.price && <div><dt>Biaya / dibayar (batas)</dt><dd>{rupiah(r.price.cost)} / {rupiah(r.price.paid)} ({rupiah(r.price.floor)})</dd></div>}
    </dl>
    {list.length > 0 && <ul className={`warn-list${list.some((c) => c.red) ? " red" : ""}`}>{list.map((c) => <li key={c.text}>{c.text}</li>)}</ul>}
    <label htmlFor={`n-${r.code}`}>Catatan (wajib bila menolak)</label>
    <input id={`n-${r.code}`} maxLength={300} style={{ width: "100%" }} value={note} onChange={(e) => setNote(e.target.value)} />
    <div className="actions"><button type="button" disabled={busy} onClick={() => decide("verified")}>Verifikasi</button><button type="button" className="btn-danger" disabled={busy} onClick={() => decide("rejected")}>Tolak</button></div>
  </div>);
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
  return (<details className="item">
    <summary><span className="mono">{r.code}</span> · {r.cooperative} · {holders.length ? `${holders.length} pemegang hilir` : "belum ke hilir"}</summary>
    <VerificationBadge status={r.verification_status} /><RiskBadge label={r.risk.label} /><PriceBadge status={r.price_status} />
    <ChainMini chain={r.chain} />
    {r.volume_status === "tidak_konsisten" && <div className="banner-bad" role="alert"><strong>Volume tidak konsisten</strong>{r.volume_note}</div>}
    <p className="note" style={{ margin: "6px 0" }}><strong>Siapa yang memegang:</strong> {holders.length ? holders.map((h) => `${ACTOR_LABEL[h.actor_type]} ${h.actor_name}`).join(" → ") : "belum ada pemegang hilir"}</p>
    <label htmlFor={`r-${r.code}`}>Alasan penarikan</label>
    <input id={`r-${r.code}`} maxLength={300} style={{ width: "100%" }} value={reason} onChange={(e) => setReason(e.target.value)} />
    <div className="actions"><button type="button" className="btn-danger" disabled={busy} onClick={recall}>Tarik dari peredaran</button><Link className="button-link secondary" href={`/batch/${r.code}`}>Halaman publik</Link></div>
  </details>);
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
    <h1>Dasbor verifikator</h1>
    <StatCards items={[{ label: "Menunggu verifikasi", value: stats.menunggu }, { label: "Berisiko tinggi", value: stats.berisiko_tinggi, alert: true }, { label: "Terverifikasi", value: stats.terverifikasi }, { label: "Ditolak", value: stats.ditolak }, { label: "Ditarik", value: stats.ditarik, alert: true }]} />
    {msg && <div className={`panel ${msg.ok ? "" : "bad"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</div>}
    <section className="section"><h2>Antrean verifikasi</h2>
      <p className="note">Diurutkan dari risiko tertinggi. Periksa dokumen asli di luar sistem (hasil uji lab, surat jalan) sebelum memutuskan.</p>
      {!queue.length && <p className="note">Tidak ada batch yang menunggu verifikasi.</p>}
      {queue.map((r) => <QueueItem key={r.code} r={r} onDone={done} />)}</section>
    <section className="section"><h2>Terverifikasi: pantau dan tarik bila perlu</h2>
      {!verified.length && <p className="note">Belum ada batch terverifikasi.</p>}
      {verified.map((r) => <VerifiedItem key={r.code} r={r} onDone={done} />)}</section>
    {recalled.length > 0 && <section className="section"><h2>Ditarik dari peredaran</h2>
      {recalled.map((r) => (<div key={r.code} className="item recalled"><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link> <VerificationBadge status={r.verification_status} recalled />
        <p className="note bad-text" style={{ margin: "4px 0" }}>{r.recall_reason}</p><ChainMini chain={r.chain} />
        <p className="note">Pemegang: {r.chain.filter((e) => CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen).map((e) => `${ACTOR_LABEL[e.actor_type]} ${e.actor_name}`).join(" → ") || "belum ada pemegang hilir"}</p></div>))}</section>}
    {rejected.length > 0 && <section className="section"><details><summary><strong>Ditolak ({rejected.length})</strong></summary>
      {rejected.map((r) => <div key={r.code} className="item"><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link> <VerificationBadge status={r.verification_status} /><p className="note" style={{ margin: "4px 0" }}>{r.verification_note}</p></div>)}</details></section>}
  </main>);
}

export default function Verifikator() {
  return <RequireRole roles={["verifikator", "admin"]} title="Dasbor verifikator">{() => <Content />}</RequireRole>;
}
