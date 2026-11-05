// Membuat akun demo untuk juri/penguji lewat Supabase Admin API (service role).
// Peran disimpan di app_metadata (tidak dapat diubah pengguna sendiri).
// Jalankan: npm run demo:users   (butuh SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local)
// Kata sandi dibaca dari DEMO_PASSWORD (opsional); jika kosong dibangkitkan acak dan dicetak SEKALI di terminal.
// JANGAN menyimpan kata sandi di repository; kirim ke panitia lewat kanal/form resmi.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomBytes } from "node:crypto";

config({ path: ".env.local" });

const ACCOUNTS = [
  { email: "koperasi.demo@araktrace.example", app_metadata: { role: "koperasi", cooperative_id: "c1" } },
  { email: "produsen.demo@araktrace.example", app_metadata: { role: "produsen", producer_id: "p1" } },
  { email: "verifikator.demo@araktrace.example", app_metadata: { role: "verifikator" } },
];

async function main() {
  const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const password = process.env.DEMO_PASSWORD || randomBytes(12).toString("base64url");
  for (const account of ACCOUNTS) {
    const { error } = await supabase.auth.admin.createUser({ email: account.email, password, email_confirm: true, app_metadata: account.app_metadata });
    console.log(`${account.email}: ${error ? `dilewati (${error.message})` : "dibuat"}`);
  }
  console.log(`\nKata sandi akun demo (simpan di tempat aman, jangan di repo): ${password}`);
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
