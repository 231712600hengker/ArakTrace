# Ringkasan perubahan v3 (UI lengkap dan rantai pasok yang bekerja)

## Penilaian rantai pasok
Rantai v2 hanya garis waktu isian sendiri dengan satu gerbang. Nilainya rendah karena pihak hilir bisa dicatat tanpa bukti, tidak ada cara mendeteksi pencampuran, tidak menyentuh masalah harga perajin, dan tidak membantu saat ada insiden metanol. v3 menambah empat fungsi yang menjawab masalah di brief:

| Fungsi | Masalah yang dijawab | Kode |
|---|---|---|
| Gerbang verifikasi | Produk belum diperiksa masuk pasar | `lib/permissions.ts` `canAddEvent`, `lib/db.ts` |
| Rekonsiliasi volume | Pencampuran/pemalsuan, produk gelap menyusup | `lib/rules.ts` `volumeCheck`, `addEvent` |
| Batas harga Pasal 9 | Perajin dibayar terlalu rendah | `lib/rules.ts` `priceFloorStatus` |
| Penarikan produk | Respons cepat bila ada insiden keamanan | `lib/db.ts` `recallBatch`, API `/recall` |

## UI
- **Beranda publik** (`app/page.tsx`): pencarian kode, statistik, masalah yang diselesaikan, fungsi rantai, masuk per peran, AI yang dipakai.
- **Navigasi sadar peran** (`components/NavBar.tsx`); login mengarahkan ke dasbor sesuai peran.
- **Dasbor koperasi** `/koperasi` (statistik, perlu tindakan, semua batch) dan `/koperasi/batch-baru` (formulir + OCR + harga).
- **Dasbor verifikator** `/verifikator` (antrean menurut risiko dengan data pemeriksaan, verifikasi/tolak, tarik batch, pemegang).
- **Dasbor produsen** `/produsen` (batch terverifikasi, catat tahap dengan jumlah liter dan pita cukai).
- **Halaman batch publik**: banner penarikan/pemeriksaan gagal, rantai dengan liter, sembilan pemeriksaan, QR.
- Halaman `/rantai` dihapus (digabung ke dasbor); `/produsen` kini dasbor produsen (formulir batch pindah ke `/koperasi/batch-baru`).

## Data dan skema
Skema v3 (idempotent): `production_cost_per_liter`, `purchase_price_per_liter`, `recalled_at`, `recall_reason`, `supply_events.quantity_liters`. Data demo ditambah kasus anomali volume, penarikan, harga di bawah batas, dan batch siap diproses. **Jalankan ulang `supabase/schema.sql` dan `npm run seed`.**

## Diverifikasi di sandbox
43 tes unit lulus (shim, bukan vitest asli), tipe TS tanpa galat sungguhan (dengan stub), sintaks 65 file valid, route API diuji (dasbor, penarikan, validasi harga/volume, 401 di produksi).

## Belum diverifikasi
`npm install/build/test` dengan paket asli, tampilan di peramban (UI belum pernah dirender), login Supabase, Gemini sungguhan, dan RLS. Uji manual setiap dasbor setelah deploy.
