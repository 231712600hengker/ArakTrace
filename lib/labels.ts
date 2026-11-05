// Label tampilan yang aman dipakai di server maupun klien.
export const CHECK_LABEL: Record<string, string> = {
  izin_usaha: "Izin usaha koperasi", higienitas: "Higienitas alat", uji_lab: "Uji laboratorium", surat_jalan: "Surat jalan pengangkutan",
  harga_batas_bawah: "Harga beli ke perajin (batas bawah Pasal 9)", konsistensi_volume: "Konsistensi volume antar tahap",
  verifikasi_pihak_ketiga: "Verifikasi pihak ketiga", izin_produsen: "Izin produsen (IUI, NPPBKC, izin edar)", label_cukai: "Label cukai",
};
export const CHECK_STATUS_LABEL: Record<string, string> = { lulus: "Lulus", belum: "Belum terpenuhi", ditolak: "Ditolak" };
export const VERIFICATION_LABEL: Record<string, string> = { self_reported: "Laporan mandiri", verified: "Terverifikasi", rejected: "Ditolak verifikator" };
export const RISK_LABEL: Record<string, string> = { rendah: "Risiko rendah", sedang: "Risiko sedang", tinggi: "Risiko tinggi" };
export const ROLE_LABEL: Record<string, string> = { koperasi: "Koperasi", produsen: "Produsen", verifikator: "Verifikator", admin: "Admin" };
/** 0.01 -> "0,01" (format Indonesia). */
export const fmtPct = (n: number | null | undefined) => (n === null || n === undefined ? "-" : String(n).replace(".", ","));

export const PRICE_LABEL: Record<string, string> = { memenuhi: "Harga memenuhi batas bawah", di_bawah_batas: "Harga di bawah batas bawah", tidak_dicatat: "Harga belum dicatat" };
export const HOME_BY_ROLE: Record<string, string> = { koperasi: "/koperasi", produsen: "/produsen", verifikator: "/verifikator", admin: "/verifikator" };
/** 60000 -> "Rp 60.000" */
export const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
export const STEP_DEFAULT_EVENT: Record<string, string> = { produsen: "Kontrol kualitas, pengemasan, dan label cukai", distributor: "Distribusi dari produsen", sub_distributor: "Distribusi lanjutan", penjual_langsung: "Diterima penjual langsung", perajin: "Destilasi dan penyetoran bahan baku", koperasi: "Pembelian bahan baku dan pencatatan batch" };
