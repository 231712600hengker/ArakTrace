# AI & Technology Disclosure

Dokumen ini mengikuti Lampiran C Panduan Peserta AI Web Innovation Challenge, Bali DigiFest 2026. Pernyataan di bawah harus selalu sama dengan isi repository.

| Komponen | Isi |
|---|---|
| Nama Produk | ArakTrace.bali |
| Framework / Frontend | Next.js 14.2.15 (App Router), React 18.3.1, TypeScript 5.6.3 (strict), CSS kustom |
| Backend / Runtime | Next.js API Routes (serverless), Node.js 18+ |
| Database / Storage | Supabase (PostgreSQL) dengan RLS aktif; Supabase Auth untuk login dan peran. Mode memori hanya untuk pengembangan lokal |
| Hosting / Deployment | Vercel (aplikasi), Supabase (database/auth) |
| AI Model / API / Method | (1) Google Gemini API, model `gemini-2.5-flash-lite` (dapat diubah lewat `GEMINI_MODEL`): vision untuk OCR sertifikat lab dan teks untuk AI Advisor. (2) Retrieval BM25 buatan sendiri. (3) Regresi logistik (scikit-learn) untuk skor risiko |
| Peran AI dalam Produk | OCR sertifikat lab menjadi data terstruktur (dikonfirmasi manusia); Advisor menjawab dari rujukan regulasi dengan sumber; skor risiko untuk triase verifikator |
| Dataset / Data Source | Kurasi/parafrase rujukan yang diklaim bersumber dari Pergub Bali No. 1/2020, Peraturan BPOM No. 5/2021, Dewi dkk. (2022); **belum diverifikasi tim terhadap naskah primer**. Seluruh data operasional **tiruan** (`scripts/generate-demo-data.mjs`, seed tetap). Data latih model risiko **sintetis** (`ml/train_risk_model.py`) |
| Open-source Libraries | next, react, react-dom, framer-motion (MIT, transisi & mikro-interaksi UI dasbor/advisor); @supabase/supabase-js, @supabase/ssr (MIT); typescript (Apache-2.0); vitest, tsx, dotenv, @types/* (MIT/BSD); scikit-learn dan numpy (BSD, hanya untuk pelatihan lokal) |
| Template / Boilerplate | Struktur proyek Next.js standar (`create-next-app`); file middleware/klien Supabase SSR mengikuti pola dokumentasi resmi Supabase |
| AI Coding Assistant | GitHub Copilot, Kiro, dan Claude (Anthropic) dipakai sebagai asisten pengembangan. Seluruh kode diperiksa, dimodifikasi, dan diuji oleh tim. Tidak ada kode yang digunakan tanpa review dan pemahaman penuh |
| Pre-existing Components | Seluruh kode dikembangkan untuk kompetisi ini (November 2026). Tidak ada komponen pre-existing dari proyek sebelumnya. Struktur proyek Next.js mengikuti pola standar `create-next-app` dan dokumentasi resmi Supabase SSR |
| Third-party Assets / Credits | Font Inter dan JetBrains Mono (SIL OFL, Google Fonts via `next/font`). Gambar `public/demo/*.png` dibuat tim (sertifikat tiruan berlabel "DEMO") |

## Rincian yang perlu diketahui juri

### Yang benar-benar memakai AI
1. **OCR sertifikat lab** (`app/api/lab-ocr/route.ts`): gambar yang diunggah pengguna terautentikasi dikirim ke Gemini; keluaran divalidasi (`lib/ocr.ts`), hasil hanya mengisi formulir dan **wajib dikonfirmasi** pengguna. Gagal/timeout menghasilkan pesan dan isian manual.
2. **AI Advisor** (`app/api/advisor/chat/route.ts`, `lib/rag.ts`): pertanyaan diproses BM25 atas `data/chunks.json`; bila tak ada rujukan relevan, Gemini tidak dipanggil dan sistem menolak dengan jujur. Prompt sistem membatasi jawaban pada konteks dan mengabaikan instruksi di dalam pertanyaan.
3. **Skor risiko** (`lib/risk.ts`): regresi logistik 4 fitur. Koefisien (`data/model.json`) dilatih oleh `ml/train_risk_model.py` pada data sintetis yang labelnya dibangkitkan dari aturan domain ditambah derau. Model ini **mempelajari ulang aturan tersebut**, bukan prediktor tervalidasi. Metrik di `ml/training_report.json` berlaku pada data sintetis saja. Parameter ambang metanol adalah konfigurasi demo dari kurasi rujukan yang belum diverifikasi tim.

### Yang bukan AI
Rekonsiliasi volume, batas harga Pergub Pasal 9, gerbang verifikasi, dan penarikan produk (`lib/rules.ts`, `lib/db.ts`) adalah logika deterministik. Nominal biaya produksi dan harga beli dari perajin tidak ditampilkan ke publik dan tidak dikirim ke model AI (data batch untuk Advisor hanya memuat tampilan publik).

### Data dan privasi
- Tidak ada data pribadi: perajin memakai alias, seluruh nama/nomor izin tiruan.
- Data dikirim ke Google (Gemini): gambar sertifikat (OCR); pertanyaan, potongan rujukan, dan data batch non-pribadi (Advisor). Antarmuka mengingatkan pengguna agar tidak mengunggah dokumen berisi data pribadi.
- Tidak ada kunci/rahasia di repository; `.env.example` hanya memuat nama variabel. `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server.

### Penyuntingan kurasi pada rujukan
Field `keywords` di `data/chunks.json` adalah petunjuk pencarian buatan tim (bukan bagian teks regulasi). Teks regulasi merupakan kutipan/parafrase dari sumber di README dan perlu dicocokkan ulang dengan naskah resmi (`docs/SUMBER_VERIFIKASI.md`).

### Batasan yang diakui
Lihat bagian Known Limitations di `README.md` dan risiko tersisa di `docs/SECURITY.md`.

## Pernyataan

Kami menyatakan bahwa informasi di atas benar dan lengkap. Kami bertanggung jawab atas penggunaan teknologi, source code, data, library, API, model AI, dan aset yang digunakan pada produk.

**Terakhir diperbarui:** 5 November 2026
**Disusun oleh:** Sion Felix Saragih (Ketua Tim / Machine Learning)
