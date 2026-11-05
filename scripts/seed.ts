import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import seed from "../data/seed.json";
import { scoreRisk } from "../lib/risk";

config({ path: ".env.local" });

async function must<T extends { error: unknown }>(label: string, op: PromiseLike<T>) {
  const result = await op;
  if (result.error) { console.error(`Gagal pada ${label}`); throw result.error; }
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk seed.");
  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  // Urutan mengikuti kunci asing: koperasi/produsen -> perajin -> batch -> peristiwa rantai.
  await must("cooperatives", supabase.from("cooperatives").upsert(seed.cooperatives, { onConflict: "id" }));
  await must("producers", supabase.from("producers").upsert(seed.producers, { onConflict: "id" }));
  await must("farmers", supabase.from("farmers").upsert(seed.farmers, { onConflict: "id" }));
  const batches = seed.batches.map((batch) => {
    const risk = scoreRisk(batch);
    return { ...batch, verified_at: batch.verified_by ? `${batch.distillation_date}T08:00:00Z` : null, risk_score: risk.score, risk_label: risk.label, risk_factors: risk.factors };
  });
  await must("batches", supabase.from("batches").upsert(batches, { onConflict: "code" }));
  await must("supply_events", supabase.from("supply_events").upsert(seed.events, { onConflict: "batch_code,step" }));
  console.log(`Seed selesai (data DEMO tiruan): ${seed.cooperatives.length} koperasi, ${seed.producers.length} produsen, ${seed.farmers.length} perajin, ${batches.length} batch, ${seed.events.length} peristiwa rantai.`);
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
