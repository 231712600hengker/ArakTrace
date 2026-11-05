/** Penanda wajib selama data masih tiruan agar tidak disalahpahami sebagai data produk/entitas nyata. */
export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return null;
  return <div className="demo-banner" role="note"><strong>DATA DEMO.</strong> Semua nama koperasi, produsen, perajin, nomor izin, nomor pita cukai, dan hasil laboratorium di situs ini adalah tiruan untuk keperluan lomba, bukan data entitas atau produk nyata.</div>;
}
