import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth";
import { OCR_PROMPT, parseLabOcr } from "@/lib/ocr";

const MAX_BASE64 = 5_500_000; // ~4 MB gambar
const MIME = ["image/jpeg", "image/png", "image/webp"];
const TIMEOUT_MS = 20000;

/** Membaca sertifikat lab dengan Gemini vision. Hasil hanya usulan; pengguna wajib mengonfirmasi sebelum disimpan. */
export async function POST(req: Request) {
  const auth = await requireActor(["koperasi", "admin"]);
  if ("response" in auth) return auth.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "validation_failed" }, { status: 400 }); }
  const data = String(body.image_base64 ?? ""); const mime = String(body.mime_type ?? "");
  if (!MIME.includes(mime) || !data || !/^[A-Za-z0-9+/=]+$/.test(data)) return NextResponse.json({ error: "validation_failed", message: "Gunakan gambar JPEG, PNG, atau WebP." }, { status: 400 });
  if (data.length > MAX_BASE64) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "ai_unavailable", message: "Pembacaan otomatis tidak tersedia. Isi hasil lab secara manual." }, { status: 503 });

  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: controller.signal,
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: OCR_PROMPT }, { inline_data: { mime_type: mime, data } }] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } }),
    });
    if (r.status === 429) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    if (!r.ok) return NextResponse.json({ error: "ai_failed", message: "Pembacaan otomatis gagal. Isi hasil lab secara manual." }, { status: 502 });
    const json = await r.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = typeof text === "string" ? parseLabOcr(text) : null;
    if (!result) return NextResponse.json({ error: "ai_unreadable", message: "Hasil AI tidak dapat dipahami. Isi hasil lab secara manual." }, { status: 502 });
    return NextResponse.json({ ...result, mode: "llm", needs_confirmation: true });
  } catch {
    return NextResponse.json({ error: "ai_failed", message: "Pembacaan otomatis gagal. Isi hasil lab secara manual." }, { status: 502 });
  } finally { clearTimeout(timer); }
}
