import Link from "next/link";
import { CodeSearch } from "@/components/CodeSearch";
import { listBatches, getCooperatives } from "@/lib/db";

export const dynamic = "force-dynamic";
const EXAMPLES = ["ARK-KRG-2610-0001", "ARK-KRG-2610-0002", "ARK-BLL-2610-0001", "ARK-GYR-2608-0001"];

export default async function Home() {
  let stats: { label: string; value: number }[] = [];
  try {
    const [batches, coops] = await Promise.all([listBatches({ limit: 500 }), getCooperatives()]);
    stats = [
      { label: "Batch tercatat", value: batches.length }, { label: "Terverifikasi", value: batches.filter((b) => b.verification_status === "verified" && !b.recalled).length },
      { label: "Ditarik dari peredaran", value: batches.filter((b) => b.recalled).length }, { label: "Koperasi terdaftar", value: coops.length },
    ];
  } catch { /* beranda tetap tampil tanpa statistik */ }
  return (<main className="wide">
    <section className="hero">
      <h1>Arak Bali yang bisa ditelusuri dan dipercaya</h1>
      <p className="lead">Masukkan kode batch atau pindai QR pada kemasan untuk melihat asal-usul, rantai pasok, status verifikasi, dan skor risiko sebelum Anda membeli atau menyajikan.</p>
      <CodeSearch />
      <p className="note">Contoh kode (data demo):</p>
      <div className="row">{EXAMPLES.map((code) => <Link key={code} href={`/batch/${code}`} className="button-link secondary btn-sm mono">{code}</Link>)}</div>
      {stats.length > 0 && <div className="stats" role="list" aria-label="Statistik data demo">{stats.map((s) => <div key={s.label} role="listitem" className="stat"><b>{s.value}</b><span>{s.label}</span></div>)}</div>}
    </section>

    <section className="section"><h2>Tiga masalah yang diselesaikan</h2>
      <div className="grid-3">
        <div className="card"><h3>Keamanan produk</h3><p>Hasil uji lab dibaca AI dari sertifikat, diperiksa verifikator, dan batch dengan metanol di atas 0,01% otomatis ditandai berisiko tinggi.</p></div>
        <div className="card"><h3>Asal-usul dan legalitas</h3><p>Setiap batch punya sembilan pemeriksaan: izin, higienitas, uji lab, surat jalan, verifikasi, harga, volume, izin produsen, dan label cukai.</p></div>
        <div className="card"><h3>Keadilan bagi perajin</h3><p>Harga beli dari perajin dicek terhadap batas bawah Pergub (biaya produksi + 20%), sehingga pelanggaran terlihat oleh verifikator.</p></div>
      </div></section>

    <section className="section"><h2>Apa yang dikerjakan rantai pasok</h2>
      <p className="note">Rantai mengikuti Pergub Bali No. 1/2020: perajin, koperasi, produsen, distributor, sub distributor, penjual langsung. Bukan sekadar garis waktu:</p>
      <div className="grid-4">
        <div className="card"><h3>Gerbang verifikasi</h3><p>Batch yang belum diverifikasi tidak dapat masuk ke produsen maupun distribusi.</p></div>
        <div className="card"><h3>Rekonsiliasi volume</h3><p>Jumlah liter tidak boleh bertambah antar tahap. Kelebihan menandakan kemungkinan pencampuran atau pemalsuan.</p></div>
        <div className="card"><h3>Penarikan cepat</h3><p>Jika ditemukan masalah, verifikator menarik batch dan langsung melihat siapa saja pemegangnya.</p></div>
        <div className="card"><h3>Bukti tiap tahap</h3><p>Siapa, kapan, berapa liter, serta dokumen pendukung seperti surat jalan dan pita cukai.</p></div>
      </div></section>

    <section className="section"><h2>Masuk sesuai peran</h2>
      <div className="grid-3">
        <div className="card"><h3>Koperasi</h3><p>Catat batch, unggah sertifikat lab (dibaca AI), pantau status verifikasi dan batas harga.</p><p><Link href="/masuk">Masuk sebagai koperasi</Link></p></div>
        <div className="card"><h3>Verifikator</h3><p>Periksa antrean berurutan menurut risiko, verifikasi atau tolak, dan tarik batch bermasalah.</p><p><Link href="/masuk">Masuk sebagai verifikator</Link></p></div>
        <div className="card"><h3>Produsen</h3><p>Proses batch terverifikasi, catat pita cukai, dan lanjutkan distribusi dengan jumlah liter yang tercatat.</p><p><Link href="/masuk">Masuk sebagai produsen</Link></p></div>
      </div>
      <p className="note">Pembeli dan konsumen tidak perlu masuk: cukup cek kode atau pindai QR.</p></section>

    <section className="section"><h2>AI yang dipakai</h2>
      <div className="grid-3">
        <div className="card"><h3>Baca sertifikat lab</h3><p>Foto sertifikat menjadi data kadar etanol dan metanol, dengan peringatan dan konfirmasi manusia.</p></div>
        <div className="card"><h3>AI Advisor</h3><p>Menjawab pertanyaan perajin dari rujukan regulasi, lengkap dengan sumber. <Link href="/advisor">Coba sekarang</Link>.</p></div>
        <div className="card"><h3>Skor risiko</h3><p>Triase awal agar verifikator memeriksa batch paling berisiko lebih dulu.</p></div>
      </div></section>
  </main>);
}
