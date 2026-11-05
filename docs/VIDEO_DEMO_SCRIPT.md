# Naskah video demo (maks 5 menit, 16:9, minimal 1080p)

Syarat panduan: tampilkan aplikasi sungguhan (bukan slide), minimal 50% durasi demo, alur *clean-start* dari input ke output. Rekam di URL produksi. Gunakan subtitle.

Persiapan: tiga jendela peramban/profil (koperasi, verifikator, produsen) sudah login (jalankan seed ulang sebelum merekam agar data awal bersih); buka `public/demo/sertifikat-lab-contoh-memenuhi.png` di folder; siapkan ponsel untuk memindai QR.

| Waktu | Bagian | Yang ditampilkan | Narasi (contoh) |
|---|---|---|---|
| 0:00–0:30 | Problem | Judul + satu kalimat konteks | "Arak Bali sah menurut Pergub 1/2020, tetapi pembeli sulit memastikan asal-usul dan keamanannya, terutama kadar metanol." |
| 0:30–1:00 | Solution | Halaman depan | "ArakTrace mencatat rantai pasok sesuai Pergub, memverifikasi data, dan memakai AI untuk membaca sertifikat lab dan menjawab perajin." |
| 1:00–3:30 | Demo | (1) Beranda: tunjukkan cek kode dan contoh. (2) Login koperasi: otomatis ke dasbor; "Catat batch baru", isi data dan harga, unggah sertifikat, AI mengisi etanol/metanol dan peringatan, konfirmasi, simpan. (3) Login verifikator: antrean menurut risiko, periksa data, verifikasi. (4) Login produsen: batch siap diproses; catat tahap produsen dengan jumlah liter; coba jumlah melebihi tahap sebelumnya dan tunjukkan penolakan. (5) Buka halaman batch: rantai dengan liter, sembilan pemeriksaan, QR (pindai dengan ponsel). (6) Buka `ARK-KLK-2609-0001` (anomali volume) dan `ARK-BGL-2608-0001` (harga di bawah batas). (7) Verifikator menarik batch: tunjukkan daftar pemegang dan banner merah di halaman publik. (8) Tanya Advisor soal metanol dan satu pertanyaan di luar topik | Jelaskan singkat setiap langkah; tekankan bahwa rantai pasok bekerja: gerbang verifikasi, volume, harga, penarikan |
| 3:30–4:30 | AI & arsitektur | Diagram dari proposal; potongan kode `app/api/lab-ocr/route.ts` dan `lib/rag.ts` | "Gemini vision membaca sertifikat; keluaran divalidasi dan wajib dikonfirmasi. Advisor memakai BM25 atas rujukan regulasi lalu Gemini; bila tak ada rujukan, sistem menolak. Skor risiko dari regresi logistik pada data sintetis, bukan pengganti uji lab." |
| 4:30–5:00 | Impact & future | Slide ringkas atau halaman daftar batch | "Data masih demo. Selanjutnya: pilot koperasi, QR anti-salin, data lab terakreditasi, WhatsApp untuk perajin." |

Tips: tampilkan kegagalan terkendali sekali (matikan kunci AI di lingkungan uji atau unggah gambar bukan sertifikat) agar juri melihat penanganan error. Jangan memalsukan hasil; editing hanya untuk memotong waktu tunggu.
