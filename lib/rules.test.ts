import { describe, expect, it } from "vitest";
import { priceFloor, priceFloorStatus, volumeCheck } from "@/lib/rules";

describe("batas harga (Pergub Pasal 9)", () => {
  it("batas bawah = biaya produksi + 20%", () => { expect(priceFloor(50000)).toBe(60000); });
  it("menilai memenuhi, di bawah batas, dan tidak dicatat", () => {
    expect(priceFloorStatus(50000, 60000)).toBe("memenuhi");
    expect(priceFloorStatus(50000, 59999)).toBe("di_bawah_batas");
    expect(priceFloorStatus(null, 60000)).toBe("tidak_dicatat");
    expect(priceFloorStatus(50000, undefined)).toBe("tidak_dicatat");
  });
});

describe("rekonsiliasi volume", () => {
  const ev = (step: number, actor_type: any, quantity_liters: number | null) => ({ step, actor_type, quantity_liters });
  it("belum ada hilir bila hanya tahap hulu", () => { expect(volumeCheck(100, [ev(1, "perajin", 100), ev(2, "koperasi", 100)]).status).toBe("belum_ada_hilir"); });
  it("konsisten bila jumlah tetap atau menyusut", () => {
    const r = volumeCheck(100, [ev(1, "perajin", 100), ev(2, "koperasi", 100), ev(3, "produsen", 96), ev(4, "distributor", 96), ev(5, "sub_distributor", 90)]);
    expect(r.status).toBe("konsisten"); expect(r.last_quantity).toBe(90);
  });
  it("tidak konsisten bila jumlah bertambah (indikasi pencampuran)", () => {
    const r = volumeCheck(100, [ev(1, "perajin", 100), ev(2, "koperasi", 100), ev(3, "produsen", 96), ev(4, "distributor", 120)]);
    expect(r.status).toBe("tidak_konsisten"); expect(r.note).toContain("Distributor");
  });
  it("tahap produsen yang melebihi volume produksi juga ditandai", () => { expect(volumeCheck(50, [ev(3, "produsen", 80)]).status).toBe("tidak_konsisten"); });
});
