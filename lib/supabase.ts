import "@/lib/server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** Klien ini hanya boleh dipanggil dari kode server. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.warn("[ArakTrace] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY kosong; memakai data seed di memori.");
    client = null;
    return client;
  }
  client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}
