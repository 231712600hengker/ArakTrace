// Aturan bisnis murni (tanpa I/O) untuk rantai pasok: batas harga dan rekonsiliasi volume.
import { ACTOR_LABEL, CHAIN_ORDER, type ActorType } from "@/lib/permissions";

/** Pergub Bali No. 1 Tahun 2020 Pasal 9: harga beli koperasi minimal 20% di atas biaya produksi yang disepakati (data/chunks.json: pergub-pasal-9-10). */
export const PRICE_FLOOR_MARGIN = 0.2;
export type PriceStatus = "tidak_dicatat" | "memenuhi" | "di_bawah_batas";
export const priceFloor = (cost: number) => Math.round(cost * (1 + PRICE_FLOOR_MARGIN) * 100) / 100;

export function priceFloorStatus(cost: number | null | undefined, paid: number | null | undefined): PriceStatus {
  if (cost === null || cost === undefined || paid === null || paid === undefined || !(cost > 0) || !(paid > 0)) return "tidak_dicatat";
  return paid >= priceFloor(cost) ? "memenuhi" : "di_bawah_batas";
}

export type VolumeStatus = "belum_ada_hilir" | "konsisten" | "tidak_konsisten";
type VolumeEvent = { step: number; actor_type: ActorType; quantity_liters: number | null };
const EPSILON = 0.0001;

/**
 * Jumlah liter tidak boleh bertambah antar tahap (hanya boleh tetap atau berkurang karena susut/sisa).
 * Pertambahan menandakan kemungkinan pencampuran dengan produk lain atau pemalsuan dokumen.
 */
export function volumeCheck(batchVolume: number, events: VolumeEvent[]): { status: VolumeStatus; note: string; last_quantity: number } {
  let previous = batchVolume; let downstream = 0;
  for (const e of [...events].sort((a, b) => a.step - b.step)) {
    if (e.quantity_liters === null) continue;
    if (e.quantity_liters > previous + EPSILON) {
      return { status: "tidak_konsisten", last_quantity: e.quantity_liters, note: `Jumlah di tahap ${ACTOR_LABEL[e.actor_type]} (${e.quantity_liters} L) melebihi tahap sebelumnya (${previous} L). Indikasi pencampuran atau pemalsuan; perlu diperiksa.` };
    }
    if (CHAIN_ORDER[e.actor_type] >= CHAIN_ORDER.produsen) downstream += 1;
    previous = e.quantity_liters;
  }
  if (downstream === 0) return { status: "belum_ada_hilir", last_quantity: previous, note: "Belum ada tahap hilir yang dapat direkonsiliasi." };
  const loss = Math.round((batchVolume - previous) * 100) / 100;
  return { status: "konsisten", last_quantity: previous, note: `Jumlah antar tahap konsisten: ${batchVolume} L pada produksi menjadi ${previous} L di tahap terakhir (selisih ${loss} L).` };
}
