# Checklist yang hanya bisa dikerjakan tim

## Isi dokumen
- [ ] README: Deployment URL, URL repository, Team Members (cari penanda `[ISI]`)
- [ ] DISCLOSURE: daftar AI coding assistant yang benar, pre-existing components, tanggal, penyusun
- [ ] `docs/SECURITY.md` dan `docs/RELEASE.md`: isi penanda `[ISI]` yang tersisa
- [ ] Proposal PDF: nama tim, anggota, instansi, kontak, tautan, commit hash; ekspor ulang bila diedit

## Verifikasi fakta
- [ ] Cocokkan `data/chunks.json` dengan naskah resmi (`docs/SUMBER_VERIFIKASI.md`)
- [ ] Cari sumber angka kasus keracunan metanol/arak (Dinas Kesehatan, BPOM, berita resmi) bila dikutip di proposal
- [ ] Putuskan pembacaan hukum Pasal 12 Pergub tentang lokasi penjualan (lihat `docs/PROJECT_BRIEF_REVISI.md`)

## Teknis
- [ ] `npm ci`, `npm test`, `npm run build`, `npm run eval:advisor` hijau di komputer Anda
- [ ] Supabase: schema, seed, akun demo, pendaftaran publik dimatikan
- [ ] Vercel: env var terisi, `NEXT_PUBLIC_SITE_URL` diatur, uji dari jaringan lain
- [ ] Repo di GitHub dengan riwayat commit asli, tanpa `.env.local`; tag `v1.0-submission`; commit hash dicatat
- [ ] Kuota Gemini cukup untuk masa penjurian
- [ ] Setiap anggota dapat menjelaskan kode (lihat `docs/TECHNICAL_VERIFICATION_QA.md`)

## Pengiriman
- [ ] Kredensial akun demo dikirim lewat kanal panitia (bukan repo)
- [ ] Jika finalis: video ≤ 5 menit (`docs/VIDEO_DEMO_SCRIPT.md`), tag `v2.0-final`, catatan improvement
