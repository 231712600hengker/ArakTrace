import { describe, expect, it } from "vitest";
import type { Actor } from "@/lib/permissions";
import { addBatch, addEvent, getBatchView, getDashboard, listBatches, recallBatch, verifyBatch } from "@/lib/db";

// Menguji mode memori (tanpa Supabase).
describe("lapisan data", () => {
  it("memuat batch kanonik dengan rantai, verifikasi, dan skor", async () => {
    const b = await getBatchView("ark-krg-2610-0001");
    expect(b?.cooperative.name).toContain("Tirta Nira");
    expect(b?.events.length).toBeGreaterThan(3);
    expect(b?.verifications.find((v) => v.check_type === "verifikasi_pihak_ketiga")?.status).toBe("lulus");
    expect(b?.risk.label).toBe("rendah");
  });
  it("batch dengan metanol melebihi batas berisiko tinggi dan ditolak", async () => {
    const b = await getBatchView("ARK-GYR-2608-0003");
    expect(b?.risk.label).toBe("tinggi");
    expect(b?.verifications.find((v) => v.check_type === "uji_lab")?.status).toBe("ditolak");
  });
  it("kode tidak dikenal mengembalikan null", async () => { expect(await getBatchView("ARK-XXX-0000-0000")).toBeNull(); });
  it("daftar mendukung filter", async () => {
    expect((await listBatches({ risk: "tinggi" })).every((r) => r.risk.label === "tinggi")).toBe(true);
    expect((await listBatches({ regency: "Karangasem" })).every((r) => r.regency === "Karangasem")).toBe(true);
  });
  it("alur: catat, verifikasi, lanjutkan ke produsen, urutan rantai dijaga", async () => {
    const code = await addBatch({ cooperative_id: "c1", farmer_id: "f11", sap_type: "aren", distillation_date: "2026-11-03", volume_liters: 50, distill_temp_c: 79, distill_duration_min: 140, equipment_sanitized: true, lab_tested: false, lab_note: "" }, "uji");
    let b = await getBatchView(code);
    expect(b?.verification_status).toBe("self_reported");
    expect(b?.events).toHaveLength(2);
    await verifyBatch(code, "verified", "Verifikator uji", "ok");
    await addEvent(code, { actor_type: "produsen", actor_name: "Produsen Dewata Spirit", event: "QC", event_date: "2026-11-05", quantity_liters: 45, producer_id: "p1", excise_band_no: "MOCK-PITA-1" });
    b = await getBatchView(code);
    expect(b?.producer?.id).toBe("p1");
    expect(b?.excise_band_no).toBe("MOCK-PITA-1");
    let failed = "";
    try { await addEvent(code, { actor_type: "koperasi", actor_name: "x", event: "y", event_date: "2026-11-06" }); } catch (e) { failed = (e as Error).message; }
    expect(failed).toBe("chain_order_invalid");
  });
  it("kode batch baru berurutan per prefiks", async () => {
    const input = { cooperative_id: "c2", sap_type: "lontar", distillation_date: "2026-12-01", volume_liters: 10, distill_temp_c: 78, distill_duration_min: 120, equipment_sanitized: true, lab_tested: false, lab_note: "" };
    const a = await addBatch(input, "uji"); const b = await addBatch(input, "uji");
    expect(a.endsWith("0001")).toBe(true); expect(b.endsWith("0002")).toBe(true);
  });
  it("tampilan publik tidak memuat nominal biaya/harga, hanya statusnya", async () => {
    const b = await getBatchView("ARK-KRG-2610-0001");
    expect(b?.price).toBeNull(); expect(JSON.stringify(b).includes("purchase_price")).toBe(false);
    expect(b?.price_status).toBe("memenuhi");
    expect((await getBatchView("ARK-KRG-2610-0001", { internal: true }))?.price?.floor).toBe(72000);
  });
  it("batas harga: batch di bawah Pasal 9 ditandai ditolak", async () => {
    const b = await getBatchView("ARK-BGL-2608-0001");
    expect(b?.price_status).toBe("di_bawah_batas");
    expect(b?.verifications.find((v) => v.check_type === "harga_batas_bawah")?.status).toBe("ditolak");
  });
  it("anomali volume pada data demo terdeteksi", async () => {
    const b = await getBatchView("ARK-KLK-2609-0001");
    expect(b?.volume_check.status).toBe("tidak_konsisten");
    expect(b?.verifications.find((v) => v.check_type === "konsistensi_volume")?.status).toBe("ditolak");
  });
  it("penulisan menolak jumlah yang melebihi tahap sebelumnya dan jumlah kosong untuk tahap hilir", async () => {
    const code = await addBatch({ cooperative_id: "c3", sap_type: "aren", distillation_date: "2026-11-02", volume_liters: 100, distill_temp_c: 78, distill_duration_min: 150, equipment_sanitized: true, lab_tested: false, lab_note: "", production_cost_per_liter: 50000, purchase_price_per_liter: 62000 }, "uji");
    await verifyBatch(code, "verified", "V", "ok");
    let err = ""; try { await addEvent(code, { actor_type: "produsen", actor_name: "P", event: "QC", event_date: "2026-11-03", quantity_liters: null }); } catch (e) { err = (e as Error).message; }
    expect(err).toBe("quantity_required");
    err = ""; try { await addEvent(code, { actor_type: "produsen", actor_name: "P", event: "QC", event_date: "2026-11-03", quantity_liters: 150 }); } catch (e) { err = (e as Error).message; }
    expect(err).toBe("volume_exceeds_previous");
    await addEvent(code, { actor_type: "produsen", actor_name: "P", event: "QC", event_date: "2026-11-03", quantity_liters: 95 });
    expect((await getBatchView(code))?.volume_check.status).toBe("konsisten");
  });
  it("penarikan: batch ditandai, pemegang hilir dikembalikan, dan tidak dapat dilanjutkan", async () => {
    const r = await recallBatch("ARK-KRG-2609-0002", "uji ulang gagal");
    expect(r.holders.length).toBeGreaterThan(0);
    expect((await getBatchView("ARK-KRG-2609-0002"))?.recalled).toBe(true);
    let err = ""; try { await addEvent("ARK-KRG-2609-0002", { actor_type: "penjual_langsung", actor_name: "X", event: "y", event_date: "2026-11-04", quantity_liters: 1 }); } catch (e) { err = (e as Error).message; }
    expect(err).toBe("batch_recalled");
    err = ""; try { await recallBatch("ARK-KRG-2609-0002", "lagi"); } catch (e) { err = (e as Error).message; }
    expect(err).toBe("already_recalled");
  });
  it("dasbor menyesuaikan peran: produsen tidak menerima nominal harga dan hanya batch terverifikasi", async () => {
    const prod: Actor = { id: "p", email: "p@x", role: "produsen", producer_id: "p1" };
    const d = await getDashboard(prod);
    expect(d.rows.every((r) => r.verification_status === "verified")).toBe(true);
    expect(d.rows.every((r) => r.price === null)).toBe(true);
    const coop: Actor = { id: "k", email: "k@x", role: "koperasi", cooperative_id: "c1" };
    const dk = await getDashboard(coop);
    expect(dk.rows.every((r) => r.cooperative.includes("Tirta Nira"))).toBe(true);
    expect(dk.rows.some((r) => r.price !== null)).toBe(true);
    const ver: Actor = { id: "v", email: "v@x", role: "verifikator" };
    const dv = await getDashboard(ver);
    expect(dv.stats.total).toBeGreaterThan(19);
    expect(dv.rows[0].verification_status).toBe("self_reported"); // antrean verifikasi di atas
  });
});
