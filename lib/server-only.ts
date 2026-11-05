// Pengaman ringan pengganti paket `server-only`: modul yang mengimpor file ini
// tidak boleh ikut terbundel ke browser (mencegah kebocoran service role key).
if (typeof window !== "undefined") {
  throw new Error("Modul ini hanya boleh dijalankan di server.");
}
export {};
