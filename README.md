# ArakTrace.bali

Platform traceability rantai pasok dan AI untuk arak tradisional Bali, dikembangkan untuk **AI Web Innovation Challenge, Bali DigiFest 2026**.

> **DATA DEMO.** Semua nama koperasi, produsen, perajin, nomor izin, nomor pita cukai, dan hasil laboratorium dalam repo ini adalah **tiruan**. Hanya teks regulasi untuk AI Advisor yang berasal dari sumber nyata (lihat Third-party Resources).

## Description

ArakTrace.bali mencatat batch produksi arak sepanjang rantai yang diatur Pergub Bali No. 1 Tahun 2020 (perajin → koperasi → produsen → distributor → sub distributor → penjual langsung), menampilkan status verifikasi dan skor risiko untuk pembeli lewat kode/QR batch, serta menyediakan AI untuk (1) membaca sertifikat uji laboratorium dari foto dan (2) menjawab pertanyaan perajin tentang regulasi dan produksi aman.

## Problem & Target User

**Masalah.** Produk arak yang tidak memenuhi standar keamanan (terutama kadar metanol) merusak kepercayaan konsumen dan pariwisata, sementara pembeli formal sulit memverifikasi asal-usul, legalitas, dan kualitas produk. Perajin kecil sulit mengakses informasi regulasi dan standar produksi. Data traceability yang hanya diisi sendiri oleh produsen tidak cukup dipercaya.

**Pengguna.**
- **Koperasi dan perajin:** mencatat batch, mengunggah sertifikat lab (dibaca AI), bertanya ke AI Advisor.
- **Verifikator (Dinas/lembaga pemeriksa):** memeriksa dan memverifikasi batch.
- **Produsen dan pelaku distribusi:** melanjutkan rantai pasok batch yang sudah terverifikasi.
- **Pembeli (restoran, bar, toko minuman berizin, penjual, konsumen):** memeriksa batch lewat kode/QR tanpa perlu login.

## Key Features

**Beranda publik** (cek kode/QR tanpa login) dan **dasbor sesuai peran** setelah masuk: koperasi (`/koperasi`), verifikator (`/verifikator`), produsen (`/produsen`).

| Fitur | Status |
|---|---|
| Cek batch lewat kode, daftar batch dengan filter, dan QR per batch | Berfungsi |
| **Rantai pasok yang bekerja, bukan sekadar garis waktu:** (1) gerbang verifikasi sebelum tahap hilir, (2) **rekonsiliasi volume** (jumlah liter tidak boleh bertambah antar tahap; indikasi pencampuran/pemalsuan), (3) **batas harga Pergub Pasal 9** (harga beli perajin ≥ biaya produksi + 20%, nominal tidak dibuka ke publik), (4) **penarikan produk** dengan daftar pemegang hilir | Berfungsi |
| Sembilan pemeriksaan per batch: izin koperasi, higienitas, uji lab, surat jalan, verifikasi pihak ketiga, harga batas bawah, konsistensi volume, izin produsen, label cukai | Berfungsi |
| Koperasi: catat batch, unggah sertifikat lab (**dibaca AI**, wajib konfirmasi), pantau tindakan yang perlu dilakukan | Berfungsi (OCR butuh `GEMINI_API_KEY`) |
| Verifikator: antrean menurut risiko dengan data pemeriksaan, verifikasi/tolak, tarik batch, lihat pemegang | Berfungsi |
| Produsen: lanjutkan batch terverifikasi (pita cukai, distribusi, jumlah liter) | Berfungsi |
| Skor risiko (regresi logistik) + aturan keras metanol melebihi batas 0,01% b/v | Berfungsi |
| **AI Advisor** (RAG BM25 + Gemini) dengan sumber rujukan dan penolakan di luar topik | Berfungsi |
| Login dan peran (Supabase Auth); hak akses ditegakkan di server | Berfungsi (butuh Supabase) |

Rekonsiliasi volume, batas harga, dan penarikan adalah **logika deterministik** (`lib/rules.ts`), bukan AI.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript strict, CSS kustom
- **Backend:** Next.js API Routes (serverless)
- **Database & Auth:** Supabase (PostgreSQL, RLS aktif, Supabase Auth)
- **AI:** Gemini API (vision untuk OCR sertifikat, teks untuk Advisor), BM25 buatan sendiri untuk retrieval, regresi logistik (scikit-learn) untuk skor risiko
- **QR:** pembangkit buatan sendiri tanpa dependensi (`lib/qr.ts`)
- **Hosting:** Vercel
- **Pengujian:** Vitest

## AI Implementation

| Komponen | Input → Output | Mengapa AI diperlukan | Kode |
|---|---|---|---|
| **OCR sertifikat lab** (Gemini vision) | Foto sertifikat → JSON (nama lab, tanggal, kadar etanol/metanol, kesimpulan, keyakinan) | Menutup celah "data diisi sendiri": angka lab diekstrak dari dokumen, bukan diketik ulang. Hasil hanya usulan; pengguna wajib mengonfirmasi. | `app/api/lab-ocr/route.ts`, `lib/ocr.ts` |
| **AI Advisor** (RAG) | Pertanyaan (+ konteks batch) → jawaban bersumber | Perajin bertanya dengan bahasa sehari-hari; jawaban hanya dari rujukan regulasi (`data/chunks.json`) | `app/api/advisor/chat/route.ts`, `lib/rag.ts` |
| **Skor risiko** (regresi logistik) | Suhu, durasi, kebersihan alat, status lab → skor 0–1 + faktor | Triase awal agar verifikator memprioritaskan batch | `lib/risk.ts`, `data/model.json`, `ml/train_risk_model.py` |

**Penanganan kegagalan.** OCR tanpa kunci/timeout/keluaran tak terbaca → pesan jelas dan isian manual. Advisor gagal → teks rujukan mentah sebagai jawaban cadangan. Keluaran OCR divalidasi ketat (rentang angka, format tanggal) sebelum dipakai.

**Data yang dikirim ke model.** OCR: gambar sertifikat yang diunggah pengguna. Advisor: pertanyaan, potongan rujukan, dan (bila dipilih) data batch non-pribadi. Tidak ada data pribadi yang dikumpulkan; perajin memakai alias.

**Batasan jujur.** Model risiko dilatih pada **data sintetis** yang dibangkitkan dari aturan domain (lihat `ml/train_risk_model.py`); ia mempelajari ulang aturan itu dan **bukan** model prediktif tervalidasi. AUC pada data sintetis (0,756) tidak mencerminkan kinerja nyata. Keamanan produk, termasuk metanol, hanya dipastikan lewat uji laboratorium.

## Architecture / Data Flow

```
Browser ──► Next.js Pages ──► API Routes ──┬─► Supabase Auth (peran) + PostgreSQL (RLS, akses via service role di server)
                                           ├─► BM25 (lib/rag.ts) ─► data/chunks.json ─┐
                                           ├─► Gemini API: OCR sertifikat / Advisor ◄─┘
                                           └─► lib/risk.ts ─► data/model.json
Pembeli: kode/QR ─► /batch/[code] ─► rantai, 9 pemeriksaan, skor risiko
```

Diagram lengkap: `docs/architecture.md`.

## Installation / Run Instructions

Prasyarat: Node.js 18+, npm. Supabase dan Gemini bersifat opsional untuk pengembangan lokal (ada mode memori dan jawaban cadangan).

```bash
git clone [ISI - URL repository GitHub Anda]
cd araktrace
npm install
cp .env.example .env.local      # isi variabel yang diperlukan
npm run dev                     # http://localhost:3000
npm test                        # unit test
npm run eval:advisor            # evaluasi retrieval (24 pertanyaan)
```

Dengan Supabase (wajib untuk deployment): jalankan `supabase/schema.sql` di SQL Editor (aman diulang; wajib dijalankan ulang bila sebelumnya memakai v2), isi `.env.local`, lalu `npm run seed` dan `npm run demo:users`. Panduan langkah demi langkah: `docs/DEPLOY_STEP_BY_STEP.md`.

Data demo dapat dibangkitkan ulang dengan `npm run demo:data`; model risiko dilatih ulang dengan `npm run ml:train` (Python, `pip install -r ml/requirements.txt`).

## Deployment URL

[ISI - URL produksi Vercel, contoh: https://araktrace.vercel.app]

## Demo Account

Aplikasi memiliki login. **Kredensial akun demo untuk juri dikirim lewat form/kanal panitia, bukan di repo ini.** Akun dibuat dengan `npm run demo:users`:

| Peran | Email | Fungsi |
|---|---|---|
| Koperasi | `koperasi.demo@araktrace.example` | Dasbor, catat batch, unggah sertifikat lab |
| Produsen | `produsen.demo@araktrace.example` | Dasbor, lanjutkan rantai batch terverifikasi |
| Verifikator | `verifikator.demo@araktrace.example` | Dasbor, verifikasi/tolak, tarik batch |

Setelah masuk, pengguna langsung diarahkan ke dasbor sesuai peran. Pencarian batch, daftar batch, dan AI Advisor dapat dicoba tanpa login. Kode contoh:

| Kode | Menunjukkan |
|---|---|
| `ARK-KRG-2610-0001` | Terverifikasi, rantai lengkap, semua pemeriksaan wajar |
| `ARK-KRG-2610-0002` | Laporan mandiri (menunggu verifikator) |
| `ARK-BLL-2610-0001` | Risiko tinggi |
| `ARK-GYR-2608-0003` | Metanol melebihi batas, ditolak |
| `ARK-KLK-2609-0001` | **Anomali volume** (jumlah di sub distributor melebihi tahap sebelumnya) |
| `ARK-GYR-2608-0001` | **Ditarik dari peredaran** (menampilkan pemegang hilir) |
| `ARK-BLL-2608-0001` | Terverifikasi dan **siap diproses produsen** (dipakai demo akun produsen) |
| `ARK-BGL-2608-0001` | Harga beli di bawah batas bawah Pasal 9 | Contoh gambar sertifikat untuk uji OCR: `public/demo/`.

## Known Limitations

1. **Seluruh data operasional adalah tiruan.** Belum ada koperasi pilot atau data lapangan.
2. **Verifikasi bergantung pada verifikator manusia.** Sistem tidak memvalidasi keaslian dokumen lab; OCR hanya membaca angka dari gambar dan tidak mendeteksi pemalsuan.
3. **QR belum anti-salin.** QR hanya mengarah ke URL batch. Pada produk nyata perlu QR unik per kemasan yang terikat label cukai/segel.
4. **Model risiko berbasis data sintetis**, bukan hasil validasi lapangan.
5. **Rujukan Advisor terbatas** pada 14 potongan di `data/chunks.json`; retrieval leksikal (BM25), bukan embedding. Teks regulasi perlu dicocokkan ulang dengan naskah resmi (`docs/SUMBER_VERIFIKASI.md`).
6. **Rantai berbentuk garis lurus:** satu distributor/sub distributor/penjual per batch (belum ada pemecahan batch ke banyak penerima). Tahap hilir dicatat oleh akun produsen berdasarkan dokumen (distributor dan penjual belum punya akun sendiri).
7. **Rate limit dan cache Advisor ada di memori** per instance serverless, sehingga tidak ketat pada skala besar.
8. **Pengujian otomatis tidak mencakup Supabase asli dan Supabase Auth** (hanya mode memori dan logika hak akses); alur login perlu diuji manual setelah deploy.
9. **Hak akses ditegakkan di kode server** (service role melewati RLS). RLS menolak akses langsung klien; kebijakan RLS per peran belum dibuat.

## Third-party Resources / Credits

- **Library:** Next.js, React, TypeScript, @supabase/supabase-js, @supabase/ssr, Vitest, tsx, dotenv (semua lisensi permisif; lihat `DISCLOSURE.md`).
- **Layanan:** Google Gemini API, Supabase, Vercel.
- **Font:** Inter dan JetBrains Mono (Google Fonts, SIL OFL) lewat `next/font`.
- **Sumber rujukan Advisor** (`data/chunks.json`): Peraturan Gubernur Bali No. 1 Tahun 2020; Peraturan BPOM No. 5 Tahun 2021; Dewi dkk. (2022), *Kajian Etnosains Proses Pembuatan Arak Bali di Desa Tri Eka Buana*, JPPSI 5(1) (diparafrasekan).
- **Aset buatan tim:** `public/demo/*.png` (contoh sertifikat tiruan), logo.

## Team Members

[ISI - Lengkapi tabel berikut dengan informasi tim Anda]

| Nama | Peran | Kontribusi Utama |
|---|---|---|
| [Nama 1] | Ketua / Full-stack Developer | Arsitektur sistem, API, integrasi AI |
| [Nama 2] | AI/ML Developer | Model risiko, RAG, OCR integration |
| [Nama 3] | Frontend Developer | UI/UX, responsive design |
