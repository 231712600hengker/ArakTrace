# Checklist Submission - ACTION ITEMS

Dokumen ini berisi **aksi spesifik** yang WAJIB dilakukan sebelum submit. Status update: 5 November 2026.

---

## ✅ SELESAI (oleh Kiro)

- [x] Fix "HORECA" → "restoran, bar, toko minuman berizin" di README
- [x] Update tanggal di DISCLOSURE.md, SECURITY.md, RELEASE.md
- [x] Lengkapi informasi AI Coding Assistant di DISCLOSURE.md
- [x] Lengkapi Pre-existing Components di DISCLOSURE.md
- [x] Format template untuk Team Members di README

---

## 🔴 WAJIB - ISI SEBELUM PRESUBMIT

### 1. README.md - 3 lokasi

**Lokasi 1** (baris ~43):
```bash
git clone [ISI - URL repository GitHub Anda]
```
Ganti dengan URL repo GitHub Anda, contoh:
```bash
git clone https://github.com/username/araktrace-bali.git
```

**Lokasi 2** (baris ~62):
```markdown
## Deployment URL

[ISI - URL produksi Vercel, contoh: https://araktrace.vercel.app]
```
Ganti dengan URL deployment Vercel Anda setelah deploy.

**Lokasi 3** (baris ~133):
```markdown
## Team Members

[ISI - Lengkapi tabel berikut dengan informasi tim Anda]
```
Isi tabel dengan nama asli, peran, dan kontribusi masing-masing anggota tim.

---

### 2. DISCLOSURE.md - 1 lokasi

**Lokasi** (baris terakhir):
```markdown
**Disusun oleh:** [ISI - Isi dengan nama anggota tim yang menyusun dokumen ini]
```
Isi dengan nama orang yang bertanggung jawab menyusun disclosure.

---

### 3. docs/SUMBER_VERIFIKASI.md - VERIFIKASI WAJIB

**CRITICAL:** Anda HARUS mengecek data/chunks.json dengan naskah resmi:

1. Download naskah resmi:
   - Pergub Bali No. 1/2020: https://jdih.baliprov.go.id/
   - Peraturan BPOM No. 5/2021: https://jdih.pom.go.id/

2. Buka `data/chunks.json` dan cocokkan setiap chunk dengan naskah asli

3. Isi bagian bawah SUMBER_VERIFIKASI.md:
```markdown
- **Diperiksa oleh:** [Nama Anda] / **Tanggal:** [5 November 2026]
- **Perbedaan yang ditemukan dan perbaikannya:** [Isi jika ada perbedaan, atau tulis "Tidak ada perbedaan signifikan"]
```

**PENTING:** Ini adalah dasar jawaban AI Advisor. Kesalahan di sini = jawaban salah ke pengguna.

---

### 4. docs/SECURITY.md - 1 lokasi

**Lokasi** (bagian Contact):
```markdown
**DO** contact:
- [ISI - Email ketua tim atau security contact]
- [ISI - Kontak pribadi team lead]
```
Isi dengan kontak yang bisa dihubungi jika ada security issue.

---

### 5. docs/RELEASE.md - 1 lokasi

**Lokasi** (bagian Contact):
```markdown
- [ISI - Nama dan kontak ketua tim]
- [ISI - Nama dan kontak tech lead]
```
Isi dengan kontak untuk masalah urgent.

---

## 🟠 DEPLOYMENT (sebelum isi URL)

Sebelum mengisi Deployment URL di README, Anda harus:

### Deploy ke Vercel

1. **Push ke GitHub** (jika belum):
```powershell
git add .
git commit -m "Prepare for submission"
git push origin main
```

2. **Create Vercel project**:
   - Login ke https://vercel.com
   - Import repository GitHub Anda
   - Framework: Next.js (auto-detected)

3. **Set Environment Variables** di Vercel dashboard:
   ```
   GEMINI_API_KEY=<your-key>
   GEMINI_MODEL=gemini-2.5-flash-lite
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   NEXT_PUBLIC_SITE_URL=<your-vercel-url>
   ```
   
   **JANGAN SET:** `DEMO_OPEN_WRITE` (ini akan buka write tanpa auth!)

4. **Deploy** - Vercel akan build otomatis

5. **Verifikasi deployment**:
   - Build success di Vercel logs
   - Buka URL yang diberikan Vercel
   - Test fitur utama (lihat section Testing di bawah)

6. **Update README.md** dengan URL Vercel

---

### Setup Supabase untuk Production

1. **Matikan public signup** di Supabase dashboard:
   - Authentication → Settings
   - Disable "Enable email signups"

2. **Jalankan schema** di SQL Editor (jika belum):
   ```sql
   -- Paste isi dari supabase/schema.sql
   ```

3. **Seed data demo**:
   ```powershell
   npm run seed
   npm run demo:users
   ```

4. **Catat password demo accounts** - akan di-print ke console

---

## 🟡 TESTING MANUAL (setelah deploy)

### Test dari jaringan lain / incognito:

1. **Halaman publik** (tanpa login):
   - [ ] Buka homepage, cari kode `ARK-KRG-2610-0001`
   - [ ] Halaman batch muncul dengan data lengkap
   - [ ] QR code ter-generate
   - [ ] Badges status verifikasi muncul
   - [ ] Skor risiko tampil

2. **Login Koperasi**:
   - [ ] Login dengan `koperasi.demo@araktrace.example`
   - [ ] Dashboard koperasi muncul
   - [ ] Buat batch baru
   - [ ] Upload gambar sertifikat (pakai `public/demo/lab-cert-*.png`)
   - [ ] OCR berjalan dan isi form
   - [ ] Konfirmasi dan submit

3. **Login Verifikator**:
   - [ ] Login dengan `verifikator.demo@araktrace.example`
   - [ ] Lihat daftar batch menunggu verifikasi
   - [ ] Verifikasi batch (centang semua pemeriksaan)
   - [ ] Status batch berubah jadi "Terverifikasi"

4. **Login Produsen**:
   - [ ] Login dengan `produsen.demo@araktrace.example`
   - [ ] Lihat batch terverifikasi yang bisa diproses
   - [ ] Lanjutkan rantai pasok (isi pita cukai, distribusi)

5. **AI Advisor**:
   - [ ] Buka `/advisor`
   - [ ] Tanya: "Berapa batas maksimal metanol?"
   - [ ] Jawaban muncul dengan sumber rujukan
   - [ ] Test 5+ pertanyaan untuk trigger rate limit

**Jika ada yang TIDAK berfungsi** → debug dulu sebelum submit!

---

## 🟢 PROPOSAL PDF

### Critical: Edit ulang proposal

File: `docs/proposal/AIWIC2026_NamaTim_ArakTrace.pdf`

**Placeholder yang WAJIB diisi** (buka source Word/Docs-nya):

1. **Halaman judul**:
   - [ ] Nama tim (ganti "NamaTim")
   - [ ] Nama ketua tim + NIM
   - [ ] Nama anggota 1 + NIM
   - [ ] Nama anggota 2 + NIM (jika ada)
   - [ ] Nama institusi
   - [ ] Kategori lomba
   - [ ] Email kontak
   - [ ] URL repository
   - [ ] URL deployment

2. **Bagian 1** (Problem Statement):
   - [ ] Kotak "[Tambahkan data kasus keracunan metanol...]"
   
   **PILIH SALAH SATU:**
   - **Opsi A (recommended):** Cari data resmi (Dinkes Bali, BPOM, media resmi) dan isi dengan angka + sumber
   - **Opsi B:** HAPUS kotak tersebut dan ganti dengan kalimat umum: "Kasus keracunan metanol dari minuman ilegal mengancam kesehatan konsumen dan merusak reputasi produk tradisional Bali."

3. **Bagian 9** (Testing):
   - [ ] Teks "[sesuaikan dengan kenyataan]"
   
   Ganti dengan hasil testing sesungguhnya setelah Anda test manual di atas.

4. **Halaman terakhir**:
   - [ ] Commit hash (isi setelah tag v1.0-submission dibuat, lihat section di bawah)

**Setelah edit:**
```powershell
# Ekspor ulang ke PDF dengan nama yang sama
# Pastikan file di: docs/proposal/AIWIC2026_NamaTim_ArakTrace.pdf
```

---

## 🔵 GIT TAG & COMMIT HASH

### Setelah semua [ISI] terisi dan presubmit pass:

```powershell
# 1. Commit semua perubahan
git add .
git commit -m "Complete submission requirements v1.0"

# 2. Tag sebagai submission version
git tag -a v1.0-submission -m "Submission untuk AI Web Innovation Challenge 2026"

# 3. Push dengan tag
git push origin main
git push origin v1.0-submission

# 4. Dapatkan commit hash
git rev-parse HEAD
# Copy output ini!

# 5. Paste commit hash ke proposal PDF (edit ulang, ekspor lagi)
```

---

## 🟣 VERIFIKASI FINAL - JALANKAN PRESUBMIT

```powershell
npm run presubmit
```

**Harus lolos semua check:**
- ✓ No PLACEHOLDER in data/
- ✓ No [ISI] markers in docs
- ✓ No secrets in git
- ✓ Build successful
- ✓ All tests pass
- ✓ All required files exist

**Jika gagal:** Lihat output error, fix, dan jalankan lagi.

---

## 📝 KIRIM KREDENSIAL DEMO

**JANGAN** commit password ke repo!

**Kirim lewat form/email panitia:**
```
Akun Demo ArakTrace.bali

Koperasi:
Email: koperasi.demo@araktrace.example
Password: [dari output npm run demo:users]

Produsen:
Email: produsen.demo@araktrace.example
Password: [dari output npm run demo:users]

Verifikator:
Email: verifikator.demo@araktrace.example
Password: [dari output npm run demo:users]
```

---

## ⚠️ OPSIONAL TAPI DISARANKAN

### Update Next.js (untuk fix security advisories)

Jika Anda punya waktu:

```powershell
# Backup dulu
git commit -am "Backup before Next.js upgrade"

# Update Next.js
npm install next@14.2.25

# Test
npm run build
npm test

# Jika berhasil, update version di DISCLOSURE.md:
# Ganti "Next.js 14.2.15" → "Next.js 14.2.25"

# Commit
git add package.json package-lock.json DISCLOSURE.md
git commit -m "Update Next.js to 14.2.25 for security fixes"
```

**Jika ada error atau waktu mepet:** SKIP ini. Version 14.2.15 masih aman untuk demo.

---

## 📋 URUTAN KERJA HARI INI

1. ✅ **Deploy dan test** (section 🟠 dan 🟡)
2. ✅ **Isi semua [ISI]** (section 🔴)
3. ✅ **Verifikasi chunks.json** (section 🔴 #3)
4. ✅ **Edit proposal PDF** (section 🟢)
5. ✅ **Tag dan commit hash** (section 🔵)
6. ✅ **Jalankan presubmit** (section 🟣)
7. ✅ **Kirim** (sesuai instruksi panitia)

---

## ✨ TIPS TERAKHIR

- **Deadline tracking:** Set alarm 2 jam sebelum deadline
- **Backup:** Setelah presubmit pass, backup repo: `git bundle create araktrace-backup.bundle --all`
- **Screenshot:** Ambil screenshot setiap halaman yang berfungsi untuk dokumentasi
- **Stay calm:** Jika ada error, baca pelan-pelan. Sebagian besar error adalah typo di env vars

**Good luck! 🚀**
