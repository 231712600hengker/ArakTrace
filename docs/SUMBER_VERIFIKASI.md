# Daftar verifikasi sumber rujukan

`data/chunks.json` adalah dasar jawaban AI Advisor. Teks ini ditulis dari kutipan/parafrase dan **belum saya (pengembang) cocokkan dengan naskah resmi**; tim wajib melakukannya sebelum submit. Cari naskah resmi di situs JDIH Provinsi Bali, JDIH BPOM, atau basis data peraturan pemerintah.

| id | Sumber | Yang harus dicek |
|---|---|---|
| pergub-pasal-1 | Pergub Bali 1/2020 Pasal 1 butir 8, 10, 11 | Definisi Minuman Fermentasi/Destilasi Khas Bali, Perajin, Produsen (IUI, Izin Edar, NPPBKC) |
| pergub-pasal-3 | Pasal 3 | Tujuan peraturan |
| pergub-pasal-5 | Pasal 5 ayat (1) dan (4) | Jenis minuman; larangan alkohol sintetis |
| pergub-pasal-6 | Pasal 6 | Label merah, jerigen ≤ 1 liter, peran koperasi |
| pergub-pasal-7-8 | Pasal 7, 8 | Alur perajin → koperasi → produsen; surat jalan kepala desa |
| pergub-pasal-9-10 | Pasal 9, 10 | Harga batas bawah ≥ 20% di atas biaya produksi; kewajiban produsen |
| pergub-pasal-11-12 | Pasal 11, 12 | Rantai distribusi; **daftar tempat terlarang (termasuk "penginapan")**; larangan untuk anak di bawah umur |
| pergub-pasal-14-15 | Pasal 14, 15 | Pembinaan dan pengawasan |
| pergub-pasal-17 | Pasal 17 | Sanksi administratif |
| bpom-pasal-1-3 | Peraturan BPOM 5/2021 Pasal 1–3 | Definisi minuman beralkohol tradisional, metanol |
| bpom-pasal-4 | Pasal 4 | **Batas metanol 0,01% b/v** (dipakai juga oleh `lib/risk.ts`: `METHANOL_LIMIT_PCT`) |
| bpom-lampiran-1-arak-tuak | Lampiran I | Standar mutu arak (etanol ≥ 30% v/v) |
| jurnal-proses-arak, jurnal-hasil-arak | Dewi dkk. (2022), JPPSI 5(1) | Parafrase sesuai artikel; satu studi kasus satu desa, jangan digeneralisasi |

Setelah dicocokkan, catat tanggal dan nama pemeriksa di bawah ini.

- **Diperiksa oleh:** [ISI - Nama anggota tim yang memverifikasi] / **Tanggal:** [ISI - Tanggal verifikasi]
- **Perbedaan yang ditemukan dan perbaikannya:** [ISI - Catat jika ada pasal yang berbeda atau perlu diperbaiki, atau tulis "Tidak ada perbedaan signifikan"]

**PENTING:** Verifikasi ini WAJIB dilakukan sebelum submission. Akses naskah resmi:
- Pergub Bali No. 1/2020: https://jdih.baliprov.go.id/
- Peraturan BPOM No. 5/2021: https://jdih.pom.go.id/

Catatan: bila nomor pasal atau angka di naskah resmi berbeda, ubah `data/chunks.json`, `METHANOL_LIMIT_PCT` di `lib/risk.ts`, dan jalankan `npm run eval:advisor`.
