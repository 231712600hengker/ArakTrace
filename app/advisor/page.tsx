"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
type Source = { doc: string; excerpt_id: string };
type Message = { role: "u" | "a"; text: string; sources?: Source[]; disclaimer?: string; mode?: string };
const SAMPLES = [
  "Berapa batas maksimal metanol pada minuman beralkohol?",
  "Apa fungsi koperasi bagi perajin arak?",
  "Di mana arak dilarang dijual?",
];

function AdvisorView() {
  const params = useSearchParams(), router = useRouter();
  const batch = params.get("batch")?.trim() || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true); setError(""); setQuestion("");
    setMessages((items) => [...items, { role: "u", text }]);
    try {
      const response = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, ...(batch ? { batch_code: batch } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error === "rate_limited" ? "Terlalu banyak pertanyaan. Tunggu sebentar lalu kirim kembali." : "Jawaban tidak dapat dimuat. Periksa koneksi lalu coba kembali.");
        return;
      }
      setMessages((items) => [...items, { role: "a", text: data.answer, sources: data.sources, disclaimer: data.disclaimer, mode: data.mode }]);
    } catch { setError("Jawaban tidak dapat dimuat. Periksa koneksi lalu coba kembali."); } finally { setBusy(false); }
  }

  function clearBatch() { router.replace("/advisor"); }

  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 20px 48px" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          textAlign: "center",
          background: "linear-gradient(135deg,#F0FAF5 0%,#E8F5F0 100%)",
          border: "1px solid #B9D6C5",
          borderRadius: "var(--radius)",
          padding: "32px 24px 24px",
          marginBottom: "24px",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "12px" }}
        >
          🤖
        </motion.div>
        <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.5rem,4vw,2rem)" }}>AI Advisor ArakTrace</h1>
        <p className="note" style={{ maxWidth: "50ch", margin: "0 auto", fontSize: "15px" }}>
          Ajukan pertanyaan seputar regulasi arak Bali, standar produksi, atau keamanan pangan.
        </p>
      </motion.div>

      {/* ── Disclaimer ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          background: "var(--amber-light)",
          border: "2px solid var(--amber)",
          borderRadius: "var(--radius)",
          padding: "16px 20px",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>⚠️</span>
        <div>
          <strong style={{ display: "block", color: "var(--amber-ink)", marginBottom: "4px" }}>Status rujukan: belum diverifikasi tim.</strong>
          <span className="note" style={{ color: "var(--amber-ink)" }}>
            Jawaban dan sitasi Advisor hanya berasal dari kurasi demo. Cocokkan dengan naskah resmi atau dinas terkait sebelum dijadikan keputusan.
          </span>
        </div>
      </motion.div>

      {/* ── Chip konteks batch ── */}
      <AnimatePresence>
        {batch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            transition={{ duration: 0.2 }}
            className="chip"
            role="status"
            style={{ marginBottom: "16px" }}
          >
            Konteks: batch <span className="mono">{batch}</span>
            <button type="button" onClick={clearBatch} aria-label="Hapus konteks batch">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Topik Rekomendasi ── */}
      <p className="note" style={{ margin: "16px 0 8px", fontWeight: 600 }}>
        💡 Topik regulasi yang sering ditanyakan:
      </p>
      <div className="advisor-samples">
        {SAMPLES.map((sample) => (
          <motion.button
            key={sample}
            type="button"
            onClick={() => ask(sample)}
            disabled={busy}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {sample}
          </motion.button>
        ))}
      </div>

      {/* ── Riwayat percakapan ── */}
      <div style={{ margin: "20px 0" }}>
        {!messages.length && !busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="empty-state"
            style={{ padding: "40px 24px" }}
          >
            <div className="icon">💬</div>
            <p>Belum ada percakapan. Pilih salah satu topik di atas atau ajukan pertanyaan Anda seputar regulasi arak Bali.</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`chat-bubble ${message.role === "u" ? "user" : "ai"}`}
            >
              {message.role === "u" && (
                <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8, marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  👤 Anda
                </div>
              )}
              {message.role === "a" && (
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-dark)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  🤖 AI Advisor
                </div>
              )}
              <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
              {message.role === "a" && (
                <>
                  {message.sources?.length ? (
                    <>
                      <p className="note" style={{ marginTop: "12px", marginBottom: "4px" }}>📚 Sumber rujukan:</p>
                      <ul className="sources">{message.sources.map((source) => <li key={source.excerpt_id}>{source.doc}</li>)}</ul>
                    </>
                  ) : (
                    <p className="note" style={{ marginTop: "8px" }}>Tidak ada sumber yang cocok.</p>
                  )}
                  <p className="note" style={{ marginTop: "8px", fontStyle: "italic" }}>
                    {message.mode === "fallback" ? "Jawaban cadangan dari rujukan. " : ""}{message.disclaimer}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Loading state ── */}
        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="chat-bubble ai"
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--green-dark)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: ".05em" }}>
                🤖 AI Advisor
              </div>
              <span className="note">Menyiapkan jawaban</span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="panel bad"
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <form
        onSubmit={(event) => { event.preventDefault(); ask(question); }}
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          position: "sticky",
          bottom: "16px",
          background: "#fff",
          padding: "16px",
          borderRadius: "var(--radius)",
          border: "2px solid var(--line)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <input
          aria-label="Pertanyaan"
          style={{ flex: 1, minWidth: "200px" }}
          placeholder="Tulis pertanyaan seputar regulasi arak Bali…"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <motion.button
          disabled={busy}
          style={{ minWidth: "90px" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {busy ? "⏳" : "📨 Kirim"}
        </motion.button>
      </form>
    </main>
  );
}

export default function Advisor() {
  return (
    <Suspense fallback={<main><p className="note" role="status">Memuat…</p></main>}>
      <AdvisorView />
    </Suspense>
  );
}
