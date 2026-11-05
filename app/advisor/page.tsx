"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
type Source = { doc: string; excerpt_id: string };
type Message = { role: "u" | "a"; text: string; sources?: Source[]; disclaimer?: string; mode?: string };
const SAMPLES = ["Berapa batas maksimal metanol pada minuman beralkohol?", "Apa fungsi koperasi bagi perajin arak?", "Di mana arak dilarang dijual?"];
function AdvisorView() {
  const params = useSearchParams(), router = useRouter(); const batch = params.get("batch")?.trim() || "";
  const [messages, setMessages] = useState<Message[]>([]), [question, setQuestion] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function ask(text: string) {
    if (!text.trim() || busy) return; setBusy(true); setError(""); setQuestion(""); setMessages((items) => [...items, { role: "u", text }]);
    try {
      const response = await fetch("/api/advisor/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, ...(batch ? { batch_code: batch } : {}) }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error === "rate_limited" ? "Terlalu banyak pertanyaan. Tunggu sebentar lalu kirim kembali." : "Jawaban tidak dapat dimuat. Periksa koneksi lalu coba kembali."); return; }
      setMessages((items) => [...items, { role: "a", text: data.answer, sources: data.sources, disclaimer: data.disclaimer, mode: data.mode }]);
    } catch { setError("Jawaban tidak dapat dimuat. Periksa koneksi lalu coba kembali."); } finally { setBusy(false); }
  }
  function clearBatch() { router.replace("/advisor"); }
  return <main><h1>AI Advisor untuk perajin</h1>
    {batch && <div className="chip" role="status">Konteks: batch <span className="mono">{batch}</span> <button type="button" onClick={clearBatch} aria-label="Hapus konteks batch">×</button></div>}
    <div className="row">{SAMPLES.map((sample) => <button key={sample} type="button" onClick={() => ask(sample)} disabled={busy}>{sample}</button>)}</div>
    {busy && <p className="note" role="status">Menyiapkan jawaban dari rujukan…</p>}
    {error && <div className="panel bad" role="alert">{error}</div>}
    {!messages.length && !busy && <p className="note">Belum ada percakapan. Pilih contoh pertanyaan atau tulis pertanyaan Anda.</p>}
    {messages.map((message, index) => <div key={index} className={`panel ${message.role === "u" ? "warn" : ""}`}><div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>{message.role === "a" && <>{message.sources?.length ? <><p className="note" style={{ marginTop: "12px", marginBottom: "4px" }}>Sumber rujukan:</p><ul className="sources">{message.sources.map((source) => <li key={source.excerpt_id}>{source.doc}</li>)}</ul></> : <p className="note">Tidak ada sumber yang cocok.</p>}<p className="note">{message.mode === "fallback" ? "Jawaban cadangan dari rujukan. " : ""}{message.disclaimer}</p></>}</div>)}
    <form className="row" onSubmit={(event) => { event.preventDefault(); ask(question); }}><input aria-label="Pertanyaan" style={{ flex: 1 }} placeholder="Tulis pertanyaan Anda" value={question} onChange={(event) => setQuestion(event.target.value)} /><button disabled={busy}>Kirim</button></form>
  </main>;
}

export default function Advisor() { return <Suspense fallback={<main><p className="note" role="status">Memuat…</p></main>}><AdvisorView /></Suspense>; }
