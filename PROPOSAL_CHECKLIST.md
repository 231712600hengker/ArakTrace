# Checklist Edit Proposal PDF

File: `docs/proposal/AIWIC2026_NamaTim_ArakTrace.pdf`

**PENTING:** Anda harus punya file source (Word/Google Docs/LibreOffice) dari proposal ini. PDF tidak bisa diedit langsung dengan baik.

---

## Placeholder yang WAJIB Diisi

### 📄 Halaman Judul

- [ ] **Nama Tim** (ganti "NamaTim")
  - Contoh: "TimArakTrace" atau "BaliDigital"

- [ ] **Ketua Tim**
  - Format: Nama Lengkap, NIM
  - Contoh: Ahmad Fauzi, 2141720001

- [ ] **Anggota 1**
  - Format: Nama Lengkap, NIM
  - Contoh: Siti Rahayu, 2141720002

- [ ] **Anggota 2** (jika ada)
  - Format: Nama Lengkap, NIM
  - Contoh: Budi Santoso, 2141720003

- [ ] **Institusi/Universitas**
  - Contoh: Politeknik Negeri Malang

- [ ] **Kategori**
  - Isi: "AI Web Innovation Challenge"

- [ ] **Email Kontak**
  - Email ketua tim
  - Contoh: ahmad.fauzi@student.polinema.ac.id

- [ ] **URL Repository**
  - Sama dengan yang di README.md
  - Contoh: https://github.com/teamname/araktrace-bali

- [ ] **URL Deployment**
  - Sama dengan yang di README.md
  - Contoh: https://araktrace.vercel.app

---

### 📊 Bagian 1: Problem Statement

#### Kotak: "[Tambahkan data kasus keracunan metanol...]"

**PILIH SALAH SATU:**

**Opsi A - ISI DENGAN DATA BERSUMBER (RECOMMENDED):**

Cari data resmi dari:
- Website Dinas Kesehatan Bali
- Website BPOM
- Berita media resmi (Kompas, Tempo, Antara)

Contoh paragraf pengganti:
```
Menurut data BPOM (2025), terdapat XX kasus keracunan metanol dari
minuman beralkohol tradisional di Bali dalam 2 tahun terakhir, dengan
XX korban meninggal dunia. Kasus ini tidak hanya mengancam kesehatan
konsumen, tetapi juga merusak reputasi produk tradisional Bali dan
industri pariwisata.

Sumber: [Sebutkan sumber lengkap, contoh: BPOM RI, Laporan Tahunan
2025, hlm. XX]
```

**Opsi B - HAPUS DAN GANTI DENGAN STATEMENT UMUM:**

Jika tidak menemukan data dalam waktu singkat, hapus kotak dan ganti dengan:
```
Kasus keracunan metanol dari minuman beralkohol ilegal mengancam
kesehatan konsumen dan merusak reputasi produk tradisional Bali serta
industri pariwisata. Ketiadaan sistem traceability yang transparan
membuat pembeli sulit memverifikasi kualitas dan keamanan produk.
```

**JANGAN:** Menulis angka tanpa sumber. Ini lebih buruk dari tidak ada angka.

---

### 🧪 Bagian 9: Testing

#### Teks: "[sesuaikan dengan kenyataan]"

**ISI SETELAH TESTING MANUAL**

Setelah Anda deploy dan test manual (pakai checklist di SUBMISSION_TODO.md), ganti dengan hasil sesungguhnya:

Contoh:
```
Testing dilakukan pada 5 November 2026 di deployment produksi
(https://araktrace.vercel.app):

1. Functional Testing
   - Pencarian batch: 10/10 test cases passed
   - OCR sertifikat lab: 8/10 berhasil (2 gagal karena kualitas foto buruk)
   - AI Advisor: 20/24 pertanyaan dijawab dengan akurat
   - Login & authorization: Semua role berfungsi dengan benar

2. Performance Testing
   - Homepage load time: <2s (3G network)
   - API response time: <500ms (rata-rata)
   - Concurrent users: Ditest dengan 20 user simultan, tidak ada error

3. Compatibility Testing
   - Browser: Chrome 119, Firefox 120, Safari 17, Edge 119 ✓
   - Device: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667) ✓
   - Screen reader: NVDA basic navigation ✓

4. Security Testing
   - Auth bypass: Tidak ditemukan celah
   - SQL injection: Tidak ditemukan vulnerability
   - XSS: Input sanitization berfungsi

Known Issues:
- Rate limiting berbasis in-memory (akan reset saat restart)
- OCR memerlukan gambar berkualitas baik (minimal 1MP)
```

Sesuaikan dengan hasil testing Anda yang sesungguhnya. Jangan copy-paste contoh ini kalau Anda belum test!

---

### 📝 Halaman Terakhir

#### Commit Hash & Tag

**ISI SETELAH GIT TAG DIBUAT**

Langkah:
1. Isi semua [ISI] di README, DISCLOSURE, dll
2. Commit & push
3. Create tag: `git tag -a v1.0-submission -m "Submission"`
4. Push tag: `git push origin v1.0-submission`
5. Get hash: `git rev-parse HEAD`
6. Copy hash ke proposal

Format di proposal:
```
Git Tag: v1.0-submission
Commit Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
Tanggal Commit: 5 November 2026, 14:30 WIB
```

---

## Cara Edit

### Jika source document masih ada:

1. Buka file source (Word/Docs/LibreOffice)
2. Gunakan Find & Replace atau edit manual
3. Isi semua placeholder di atas
4. Review keseluruhan dokumen
5. Ekspor ke PDF dengan nama: `AIWIC2026_NamaTim_ArakTrace.pdf`
   - Ganti "NamaTim" dengan nama tim Anda
   - Contoh: `AIWIC2026_BaliDigital_ArakTrace.pdf`
6. Replace file di `docs/proposal/`

### Jika source document hilang:

**Jangan panik!** Anda bisa:

1. **Extract text dari PDF** (gunakan Adobe Acrobat / online PDF to Word)
2. **Edit di Word**, isi placeholder
3. **Ekspor ulang ke PDF**

ATAU

1. **Buat proposal baru** dari template yang mirip
2. Copy content dari PDF lama (yang tidak placeholder)
3. Isi data yang benar
4. Ekspor ke PDF

---

## Verifikasi Sebelum Submit

### Visual Check:

- [ ] Tidak ada teks "[Tambahkan..." atau "[ISI..." atau "[sesuaikan..."
- [ ] Semua nama tim & anggota terisi
- [ ] URL repo & deployment terisi dan BENAR
- [ ] Data testing terisi dengan hasil real
- [ ] Commit hash terisi (40 karakter hex)
- [ ] Formatting rapi, tidak ada text overlap
- [ ] PDF bisa dibuka di berbagai PDF reader

### Content Check:

- [ ] URL di proposal SAMA dengan URL di README.md
- [ ] Nama tim & anggota SAMA dengan yang di README.md
- [ ] Commit hash VALID (cek dengan `git show <hash>`)
- [ ] Data keracunan metanol ADA SUMBERNYA atau dihapus
- [ ] Hasil testing sesuai kenyataan (jangan fake data)

### File Check:

- [ ] Nama file benar: `AIWIC2026_[NamaTim]_ArakTrace.pdf`
- [ ] Ukuran file wajar (<10MB)
- [ ] File di lokasi: `docs/proposal/`
- [ ] PDF version compatibility (PDF 1.7 atau lebih baru)

---

## Timeline Proposal

**Saat ini:** Proposal masih ada placeholder

**Setelah deploy & test (estimasi H+3 jam):**
- Isi URL deployment
- Isi hasil testing

**Setelah semua [ISI] terisi (estimasi H+4 jam):**
- Isi data tim
- Isi URL repo
- Export PDF pertama kali

**Setelah git tag dibuat (estimasi H+5 jam):**
- Isi commit hash
- Export PDF kedua (FINAL)

**Ready to submit!** (estimasi H+5.5 jam)

---

## Tips

1. **Backup PDF original** sebelum edit
2. **Simpan source document** (Word/Docs) untuk edit di masa depan
3. **Test PDF** di reader lain (Adobe, browser, mobile) sebelum submit
4. **Print to PDF** lebih aman daripada "Save as PDF" untuk compatibility
5. **Jangan edit PDF langsung** dengan editor PDF - hasil biasanya jelek

---

## Jika Masalah

### "Saya tidak punya source document"

Gunakan online converter: PDF to Word (smallpdf.com, ilovepdf.com)
Edit Word, ekspor ulang ke PDF

### "Data keracunan metanol tidak ketemu"

Pilih Opsi B: hapus kotak, pakai statement umum
Jangan mengada-ada data!

### "Belum deploy, belum ada URL"

Deploy dulu, baru isi proposal
Jangan isi URL palsu atau contoh

### "Belum test, tidak tahu hasil testing"

Test dulu dengan checklist di SUBMISSION_TODO.md
Catat hasilnya, baru isi di proposal

---

**Prioritas:** Proposal adalah salah satu deliverable terakhir. Fokus deployment dan testing dulu!

**Good luck! 📄✨**
