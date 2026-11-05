# Panduan deploy langkah demi langkah

Perkiraan waktu 45–60 menit. Semua langkah ini dilakukan tim (butuh akun Anda).

## 1. Siapkan Supabase
1. Buat project di supabase.com.
2. **SQL Editor** → tempel isi `supabase/schema.sql` → Run (aman diulang; **jalankan ulang bila sebelumnya memakai versi lama**, karena v3 menambah kolom harga, penarikan, dan jumlah liter).
3. **Project Settings → API**: salin `Project URL`, `publishable (anon) key`, dan `service_role key`.
4. **Authentication → Providers**: aktifkan Email. Di **Sign In / Providers → Email**, **matikan pendaftaran publik** ("Allow new users to sign up"), agar hanya akun yang Anda buat yang bisa masuk.

## 2. Isi data dan akun (dari komputer Anda)
```bash
cp .env.example .env.local
# isi: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, GEMINI_API_KEY
npm install
npm run seed          # memuat data DEMO tiruan
npm run demo:users    # membuat 3 akun demo; CATAT kata sandi yang tercetak (hanya muncul sekali)
```
Kata sandi **tidak boleh** masuk repo. Kirim ke panitia lewat form/kanal resmi.

## 3. Uji lokal sebelum deploy
```bash
npm test && npm run eval:advisor && npm run build
npm run dev
```
Coba: login koperasi (masuk ke `/koperasi`) → Catat batch baru → isi biaya dan harga → unggah `public/demo/sertifikat-lab-contoh-memenuhi.png` → baca dengan AI → konfirmasi → simpan. Login verifikator (`/verifikator`) → verifikasi. Login produsen (`/produsen`) → catat tahap berikutnya dengan jumlah liter. Buka halaman batch dan periksa QR dengan ponsel. Coba pula tarik sebuah batch dari dasbor verifikator.

## 4. Deploy ke Vercel
1. Push repo ke GitHub (riwayat commit asli; **jangan** commit `.env.local`).
2. vercel.com → Add New → Project → pilih repo.
3. Environment Variables (Production): `GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_DEMO_MODE=true`. Jangan setel `DEMO_OPEN_WRITE`.
4. Deploy. Setelah URL produksi ada, isi `NEXT_PUBLIC_SITE_URL` dengan URL itu lalu Redeploy (agar QR memakai domain yang benar).
5. Salin URL ke README bagian Deployment URL.

## 5. Uji produksi (dari perangkat lain / jaringan lain)
- Cek batch tanpa login; daftar batch; QR terbaca.
- Tanpa login, `/produsen` meminta masuk. Login tiap peran berhasil.
- Advisor menjawab; pertanyaan di luar topik ditolak.
- Coba matikan sementara `GEMINI_API_KEY`: OCR menampilkan pesan dan isian manual tetap bisa; Advisor memberi jawaban cadangan.
- Pantau kuota Gemini selama masa penjurian.

## 6. Kunci versi
```bash
git tag v1.0-submission
git push origin v1.0-submission
git rev-parse HEAD     # catat commit hash untuk formulir
```
Jika repo private, beri akses read-only ke akun GitHub panitia/juri.

## 7. Sebelum submit
Jalankan `npm run presubmit` (Windows) atau `bash scripts/pre-submit.sh`. Semua penanda `[ISI]` di README dan DISCLOSURE harus terisi. Lihat `docs/CHECKLIST_TIM.md`.
