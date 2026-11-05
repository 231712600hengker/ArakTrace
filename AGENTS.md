Proyek: ArakTrace.bali, aplikasi web untuk lomba AI Web Innovation Challenge (Bali DigiFest 2026).
Fungsi: (1) pembeli memasukkan kode batch dan melihat asal-usul, status verifikasi, dan skor risiko; (2) koperasi mencatat batch baru dan mendapat kode otomatis; (3) AI Advisor (RAG + Gemini) menjawab dari dokumen resmi dan data batch.
Stack: Next.js 14 App Router, TypeScript strict, API Routes sebagai backend, Supabase, Gemini API (REST), deploy di Vercel.
Aturan wajib:
- UI dalam Bahasa Indonesia. Error API selalu { "error": "kode_singkat", ... }.
- Jangan pernah menaruh secret di kode atau repo; gunakan env var dan perbarui .env.example.
- Jangan mengarang isi regulasi, pasal, atau standar. Konten rujukan hanya dari data/chunks.json yang diisi tim; tandai kekurangan sebagai TODO.
- Skor risiko adalah triase, bukan jaminan keamanan; jangan pernah menyatakan minuman "pasti aman".
- Jangan menambah dependency tanpa alasan yang dijelaskan. Jalankan `npm run build` sebelum menyatakan selesai.
- Commit kecil dengan pesan jelas. Di akhir, laporkan: file yang diubah, cara menguji, dan hal yang belum selesai.