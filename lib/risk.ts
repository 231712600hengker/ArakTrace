import model from "@/data/model.json";
export const DISCLAIMER = "Skor risiko adalah triase awal berbasis data yang dimasukkan, bukan pengganti uji laboratorium. Keamanan minuman, termasuk kadar metanol, hanya dapat dipastikan lewat uji lab.";
type Input = { distill_temp_c: number; distill_duration_min: number; equipment_sanitized: boolean; lab_tested: boolean; lab_methanol_pct?: number | null };
type Model = { version: string; intercept: number; coef: Record<string, number>; labels: Record<string, string>; thresholds: { rendah: number; sedang: number } };
const riskModel = model as Model;
/** Rumus dan urutan fitur didokumentasikan di ml/FEATURES.md. */
export function riskFeatures(input: Input): Record<string, number> { return { temp_dev: Math.abs(input.distill_temp_c - 78) / 10, short_duration: input.distill_duration_min < 90 ? 1 : 0, not_sanitized: input.equipment_sanitized ? 0 : 1, no_lab: input.lab_tested ? 0 : 1 }; }
export function scoreRisk(input: Input) {
  const features = riskFeatures(input); let z = riskModel.intercept;
  const factors: { name: string; detail: string }[] = [];
  for (const name of Object.keys(riskModel.coef)) { const contribution = riskModel.coef[name] * (features[name] ?? 0); z += contribution; if (contribution > 0.3) factors.push({ name, detail: riskModel.labels[name] ?? name }); }
  const score = Math.round(100 / (1 + Math.exp(-z))) / 100;
  let label = score < riskModel.thresholds.rendah ? "rendah" : score < riskModel.thresholds.sedang ? "sedang" : "tinggi";
  // Aturan keras di luar model: hasil lab yang melebihi batas metanol selalu berisiko tinggi.
  if (methanolStatus(input.lab_methanol_pct) === "melebihi") {
    label = "tinggi";
    factors.unshift({ name: "methanol_over_limit", detail: `Hasil lab melebihi batas metanol ${String(METHANOL_LIMIT_PCT).replace(".", ",")}% b/v` });
  }
  return { score, label, factors, version: riskModel.version };
}

/** Batas metanol minuman beralkohol: 0,01 % b/v (Peraturan BPOM No. 5 Tahun 2021 Pasal 4; lihat data/chunks.json, id bpom-pasal-4). */
export const METHANOL_LIMIT_PCT = 0.01;
export type MethanolStatus = "tidak_ada_data" | "memenuhi" | "melebihi";
export function methanolStatus(pct: number | null | undefined): MethanolStatus {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "tidak_ada_data";
  return pct <= METHANOL_LIMIT_PCT ? "memenuhi" : "melebihi";
}
