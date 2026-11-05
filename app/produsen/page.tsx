"use client";
import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/RequireRole";
import { StatCards } from "@/components/StatCards";
import { ChainMini } from "@/components/ChainMini";
import { RiskBadge, VerificationBadge } from "@/components/Badges";
import { useDashboard } from "@/components/useDashboard";
import type { DashboardRow } from "@/lib/db";
import { ACTOR_LABEL, CHAIN_ORDER, type ActorType } from "@/lib/permissions";
import { STEP_DEFAULT_EVENT } from "@/lib/labels";

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
  return (<form onSubmit={submit}>
    <label htmlFor={`t-${row.code}`}>Tahap berikutnya</label>
    <select id={`t-${row.code}`} value={type} onChange={(e) => { const t = e.target.value as ActorType; setType(t); set("event", STEP_DEFAULT_EVENT[t] ?? ""); }}>{options.map((o) => <option key={o} value={o}>{ACTOR_LABEL[o]}</option>)}</select>
    {!own && <><label htmlFor={`n-${row.code}`}>Nama pelaku ({ACTOR_LABEL[type]})</label><input id={`n-${row.code}`} required maxLength={80} value={f.actor_name} onChange={(e) => set("actor_name", e.target.value)} /></>}
    {own && <p className="note">Nama produsen diambil dari akun Anda.</p>}
    <label htmlFor={`e-${row.code}`}>Peristiwa</label><input id={`e-${row.code}`} required maxLength={120} value={f.event} onChange={(e) => set("event", e.target.value)} />
    <div className="row"><div><label htmlFor={`d-${row.code}`}>Tanggal</label><input id={`d-${row.code}`} type="date" required value={f.event_date} onChange={(e) => set("event_date", e.target.value)} /></div>
      <div><label htmlFor={`q-${row.code}`}>Jumlah (liter, maks. {row.last_quantity})</label><input id={`q-${row.code}`} type="number" inputMode="decimal" required min="0.01" step="any" value={f.quantity_liters} onChange={(e) => set("quantity_liters", e.target.value)} /></div></div>
    {own && <><label htmlFor={`p-${row.code}`}>Nomor pita cukai (jika ada)</label><input id={`p-${row.code}`} maxLength={60} value={f.excise_band_no} onChange={(e) => set("excise_band_no", e.target.value)} /></>}
    <p><button disabled={busy} className="btn-sm">{busy ? "Menyimpan…" : "Catat tahap"}</button></p>
    {msg && <p className={`note ${msg.ok ? "" : "bad-text"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
  </form>);
}

function Content() {
  const { data, error, reload } = useDashboard();
  if (error) return <main className="wide"><div className="panel bad" role="alert">{error}</div></main>;
  if (!data) return <main className="wide"><p className="note" role="status">Memuat dasbor…</p></main>;
  const { stats, rows } = data;
  const active = rows.filter((r) => !r.recalled && r.allowed_next.some((t) => CHAIN_ORDER[t] >= CHAIN_ORDER.produsen));
  const rest = rows.filter((r) => !active.includes(r));
  return (<main className="wide">
    <h1>Dasbor produsen</h1>
    <p className="note">Hanya batch yang sudah diverifikasi yang tampil di sini. Jumlah liter tidak boleh bertambah antar tahap; kelebihan menandakan kemungkinan pencampuran atau pemalsuan.</p>
    <StatCards items={[{ label: "Siap diproses", value: stats.siap_diproses }, { label: "Dalam distribusi", value: stats.dalam_distribusi }, { label: "Selesai", value: stats.selesai }, { label: "Ditarik", value: stats.ditarik, alert: true }]} />
    <section className="section"><h2>Perlu dilanjutkan</h2>
      {!active.length && <p className="note">Tidak ada batch yang menunggu tahap berikutnya.</p>}
      {active.map((r) => (<details key={r.code} className="item attn" open={active.length <= 3}>
        <summary><span className="mono">{r.code}</span> · {r.cooperative} · {r.last_quantity} L tersisa</summary>
        <p className="note" style={{ margin: "6px 0" }}>Nira {r.sap_type} · {r.distillation_date} · produksi {r.volume_liters} L</p>
        <VerificationBadge status={r.verification_status} recalled={r.recalled} /><RiskBadge label={r.risk.label} />
        <ChainMini chain={r.chain} />
        {r.volume_status === "tidak_konsisten" && <div className="banner-bad" role="alert"><strong>Volume tidak konsisten</strong>{r.volume_note}</div>}
        <StepForm row={r} onDone={reload} />
        <p className="note"><Link href={`/batch/${r.code}`}>Lihat halaman publik batch</Link></p>
      </details>))}
    </section>
    {rest.length > 0 && <section className="section"><h2>Selesai atau ditarik</h2>
      {rest.map((r) => (<div key={r.code} className={`item${r.recalled ? " recalled" : ""}`}><Link href={`/batch/${r.code}`} className="mono">{r.code}</Link> <VerificationBadge status={r.verification_status} recalled={r.recalled} />
        {r.recalled && <p className="note bad-text" style={{ margin: "4px 0" }}>{r.recall_reason}</p>}<ChainMini chain={r.chain} /></div>))}</section>}
  </main>);
}

export default function ProdusenDashboard() {
  return <RequireRole roles={["produsen", "admin"]} title="Dasbor produsen">{() => <Content />}</RequireRole>;
}
