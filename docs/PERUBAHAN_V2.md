# Ringkasan perubahan v2 (penggabungan dua zip + penyempurnaan)

Dasar: `araktrace-bali-fixed-2` (data nyata, stopword, eval) digabung dengan `araktrace-bali-main` (Supabase SSR), lalu disempurnakan mengikuti langkah-langkah di percakapan.

## Perubahan
| Area | Perubahan |
|---|---|
| Fondasi | `server-only` diganti `lib/server-only.ts` (tanpa dependensi); `package.json` dan lockfile sinkron |
| Data | Skema v2 (`supabase/schema.sql`): `producers`, `farmers`, `supply_events`, kolom verifikasi/lab/cukai/`is_demo`, RLS aktif. Generator data demo deterministik (`scripts/generate-demo-data.mjs`): 6 koperasi, 3 produsen, 18 perajin, 20 batch, 63 peristiwa rantai |
| Rantai pasok | Perajin → koperasi → produsen → distributor → sub distributor → penjual langsung; tahap hilir hanya untuk batch terverifikasi |
| Auth | Supabase Auth + peran di `app_metadata`; `lib/auth.ts`, `lib/permissions.ts`; halaman `/masuk`, `/verifikator`, `/rantai`; akun demo via `npm run demo:users` |
| AI | OCR sertifikat lab (Gemini vision) dengan validasi dan konfirmasi; retrieval BM25; uji retrieval 24 pertanyaan (bukan evaluasi akurasi jawaban Gemini); prompt Advisor lebih tahan injeksi |
| Model risiko | `ml/train_risk_model.py` (data sintetis, seed tetap) → `data/model.json` v1.0.0-synthetic; aturan keras metanol > 0,01% |
| Fitur | QR per batch (`lib/qr.ts`), daftar batch + filter, banner DATA DEMO, 9 pemeriksaan (izin koperasi, higienitas, uji lab, surat jalan, verifikasi, parameter harga, volume, izin produsen, label cukai) |
| Dokumen | README, DISCLOSURE, SECURITY, architecture diperbarui; `docs/`: panduan deploy, checklist tim, sumber verifikasi, brief revisi, naskah video, Q&A verifikasi teknis, proposal PDF |

## Yang sudah diverifikasi (di sandbox, tanpa jaringan)
- 29 tes unit lulus (dijalankan lewat shim sementara; **vitest asli belum dijalankan**).
- Uji retrieval Advisor 24/24 lolos; hasil ini tidak memvalidasi kebenaran jawaban Gemini atau kecukupan sitasinya.
- Type-check TypeScript tanpa galat sungguhan (dengan stub untuk paket yang tidak terpasang) dan sintaks 47 file TS/TSX valid.
- Route API diuji (validasi, 401 di produksi tanpa auth, alur verifikasi/rantai) dengan shim `next/server`.
- QR diverifikasi dengan decoder OpenCV pada versi 1–9.

## Yang BELUM diverifikasi (harus Anda uji)
- `npm install`, `npm run build`, dan `npm test` dengan paket asli.
- Login Supabase Auth, RLS, penyimpanan Supabase asli, `npm run seed`, `npm run demo:users`.
- Panggilan Gemini sungguhan (OCR dan Advisor) dan kuota.
- Tampilan di peramban (tidak ada uji visual halaman Next.js).
- Kecocokan `data/chunks.json` dengan naskah resmi (`docs/SUMBER_VERIFIKASI.md`).
