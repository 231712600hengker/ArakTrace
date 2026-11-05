# Project Brief (revisi)

Revisi ini menjawab kekurangan brief awal: klaim tanpa sumber, janji yang tidak punya fitur, dan benturan dengan alur hukum.

## 1. Latar belakang
Pergub Bali No. 1 Tahun 2020 melegalkan dan mengatur minuman fermentasi/destilasi khas Bali, termasuk arak, dengan alur resmi **perajin → koperasi → produsen → distributor → sub distributor → penjual langsung**. Standar keamanan mengacu antara lain pada Peraturan BPOM No. 5 Tahun 2021 (batas metanol 0,01% b/v). Masalah yang dituju: sulitnya pembeli memverifikasi asal-usul dan keamanan, serta sulitnya perajin kecil mengakses informasi regulasi dan standar.

> **Yang perlu ditambahkan tim:** angka dan sumber kasus keracunan metanol, ukuran sentra produksi (misalnya Karangasem), dan margin perajin. Jangan menulis angka tanpa rujukan. Tempat mencari: Dinas Kesehatan Provinsi Bali, BPOM, Dinas Koperasi, berita dari media resmi.

## 2. Solusi
Aplikasi web yang (a) mencatat batch dan rantai pasok sesuai alur Pergub, (b) menampilkan status verifikasi pihak ketiga, tujuh pemeriksaan, dan skor risiko untuk pembeli lewat kode/QR, (c) memakai AI untuk membaca sertifikat lab dan menjawab pertanyaan perajin dari rujukan regulasi.

**Perubahan penting dari brief awal**
- **Bukan "memotong perantara".** Koperasi dan produsen adalah mata rantai wajib menurut Pergub (Pasal 7–10). Nilai yang ditawarkan: transparansi harga dan asal-usul serta posisi tawar koperasi, bukan melewati koperasi.
- **Data tidak hanya diisi sendiri.** Ada peran verifikator, OCR sertifikat lab, dan aturan bahwa tahap hilir hanya untuk batch terverifikasi.
- **Cukai dan izin menjadi pemeriksaan eksplisit:** surat jalan (Pasal 8), IUI/NPPBKC/izin edar produsen (Pasal 1 butir 11), label cukai.
- **AI Advisor dibatasi:** hanya menjawab dari rujukan, menolak di luar topik, tidak pernah menyatakan produk pasti aman.

## 3. Peran dan fitur MVP (berfungsi)
| Peran | Fitur |
|---|---|
| Koperasi | Catat batch, unggah sertifikat lab (OCR + konfirmasi), catat tahap hulu |
| Verifikator | Verifikasi atau tolak batch dengan catatan |
| Produsen | Lanjutkan rantai batch terverifikasi (produsen, distributor, dst.), nomor pita cukai |
| Pembeli | Cek batch lewat kode/QR, daftar dan filter batch, skor risiko, tanya Advisor |

## 4. Isu hukum yang harus diputuskan tim
Pasal 12 Pergub (menurut `data/chunks.json`) melarang penjualan di sejumlah tempat, **termasuk penginapan**, dan menyebut penjualan hanya di tempat tertentu sesuai peraturan perundang-undangan. Brief awal menyebut hotel sebagai pembeli utama. Sebelum proposal dikirim, tim perlu membaca naskah resmi dan memutuskan sasaran pembeli yang sesuai (misalnya restoran, bar, atau toko minuman berizin, bukan "hotel" secara umum), lalu menyesuaikan bahasa proposal. Saya tidak dapat memastikan tafsir hukumnya; ini perlu rujukan ke naskah resmi atau Dinas terkait.

## 5. Dampak dan ukuran keberhasilan (target pilot, bukan klaim)
- Jumlah koperasi pilot yang mencatat batch.
- Persentase batch dengan hasil lab terlampir dan terverifikasi.
- Waktu verifikasi per batch.
- Jumlah pemindaian QR oleh pembeli.

## 6. Risiko dan mitigasi
| Risiko | Mitigasi |
|---|---|
| Data diisi sendiri tidak akurat | Verifikator, OCR dokumen lab, aturan gerbang sebelum hilir |
| QR disalin ke produk gelap | Roadmap: QR unik per kemasan terikat label cukai/segel |
| Saran AI keliru | Jawaban hanya dari rujukan, sumber ditampilkan, penolakan di luar topik, disclaimer uji lab |
| Perajin sulit memakai web | Roadmap: WhatsApp/suara, bahasa Bali, pendampingan koperasi |
| Biaya dan keberlanjutan | Roadmap: model langganan untuk produsen/koperasi atau kerja sama dinas |

## 7. Pengembangan lanjutan
Pilot satu koperasi nyata, integrasi data lab terakreditasi, kebijakan RLS per peran, embedding untuk retrieval, QR anti-salin, dan notifikasi ke verifikator.
