# Persiapan Technical Verification

Semua anggota harus bisa menjawab tanpa membaca catatan. Jawaban singkat dan lokasi kode:

**Tunjukkan kode yang memanggil AI.**
`app/api/lab-ocr/route.ts` (Gemini vision, fetch ke `generativelanguage.googleapis.com`, `responseMimeType: application/json`, suhu 0) dan `app/api/advisor/chat/route.ts` (retrieval `lib/rag.ts` lalu Gemini).

**Mengapa Gemini?** (jawab dengan alasan tim) Contoh: mendukung gambar dan teks dalam satu API, ada paket gratis untuk prototipe, model `flash-lite` cepat dan murah. Model dapat diganti lewat `GEMINI_MODEL`.

**Apa yang dikirim ke model dan bagaimana privasinya?**
OCR: gambar sertifikat dari pengguna terautentikasi. Advisor: pertanyaan, potongan rujukan, data batch non-pribadi. Tidak ada data pribadi (perajin memakai alias), kunci hanya di server, UI mengingatkan agar tidak mengunggah dokumen berisi data pribadi.

**Bagaimana jika AI/API gagal?**
OCR: kunci kosong → 503 + pesan; timeout 20 dtk → 502; 429 → pesan batas; keluaran tak terbaca → 502; selalu ada isian manual. Advisor: timeout 10 dtk, jawaban cadangan dari teks rujukan. Lihat `lib/ocr.ts` dan route terkait.

**Apa yang mencegah AI salah membaca angka lab?**
Validasi rentang 0–100, peringatan keyakinan < 0,6, peringatan metanol tak terbaca atau melebihi batas, dan **konfirmasi manusia wajib** sebelum simpan; verifikator tetap memeriksa dokumen asli. OCR tidak mendeteksi dokumen palsu.

**Jalankan dengan input berbeda dari video.**
Siapkan batch baru dengan suhu/durasi lain, gambar sertifikat `melebihi` di `public/demo/`, dan pertanyaan Advisor baru. Pastikan Anda tahu hasil yang diharapkan.

**Apakah skor risiko itu model yang valid?**
Tidak. Koefisien dilatih di `ml/train_risk_model.py` pada data sintetis yang labelnya dibangkitkan dari aturan domain; model mempelajari ulang aturan itu. Dipakai untuk triase, bukan prediksi nyata. Aturan keras: metanol > 0,01% selalu tinggi.

**Bagaimana retrieval Advisor bekerja?**
BM25 leksikal (`lib/rag.ts`): token tanpa kata umum, kata kunci kurasi berbobot 3, ambang skor dan minimal dua istilah cocok (atau satu bila pertanyaan hanya satu istilah). Tanpa rujukan relevan, Gemini tidak dipanggil.

**Bagian mana yang sudah ada sebelum kompetisi?**
[ISI] Siapkan jawaban jujur sesuai `DISCLOSURE.md`.

**Apa gunanya rantai pasok? Bukankah hanya garis waktu?**
Tidak hanya itu. Empat fungsi nyata: (1) gerbang: tahap hilir hanya untuk batch terverifikasi (`canAddEvent`); (2) rekonsiliasi volume: jumlah liter tidak boleh bertambah antar tahap, dicek saat menulis (`addEvent`) dan saat menampilkan (`volumeCheck` di `lib/rules.ts`), sehingga pencampuran/pemalsuan terdeteksi; (3) batas harga Pasal 9: harga beli ≥ biaya produksi + 20%, nominal hanya untuk koperasi dan verifikator; (4) penarikan: verifikator menarik batch dan melihat pemegang hilir (`recallBatch`). Batasan: rantai linear, tahap hilir dicatat akun produsen.

**Mengapa nominal harga tidak tampil di publik?**
`getBatchView` secara default membuang nominal dan hanya mengirim status; hanya `getDashboard` untuk peran koperasi/verifikator/admin yang menyertakannya. Diuji di `lib/db.test.ts`.

**Bagaimana hak akses ditegakkan?**
`lib/auth.ts` membaca sesi Supabase; peran dari `app_metadata`; aturan di `lib/permissions.ts`; tiap route tulis memanggil `requireActor`. Di produksi tanpa auth, semua endpoint tulis 401. RLS menolak akses langsung klien; service role hanya di server.

**Bagaimana QR dibuat?**
`lib/qr.ts` (mode byte, koreksi galat M, versi 1–9, Reed-Solomon GF(256), 8 mask). Diverifikasi dengan decoder QR (OpenCV) pada beragam panjang data. QR belum anti-salin.

**Apa batasan terbesar?**
Data demo; verifikasi bergantung manusia; model sintetis; QR bisa disalin; RLS per peran belum ada; pengujian tidak mencakup Supabase asli.

**Latihan:** minta anggota lain membuka repo dan menjelaskan satu alur dari klik sampai database tanpa melihat catatan.
