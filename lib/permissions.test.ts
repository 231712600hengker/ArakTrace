import { describe, expect, it } from "vitest";
import { actorFromUser, canAddEvent, canCreateBatch, canRecall, canVerify, type Actor } from "@/lib/permissions";

const coop: Actor = { id: "1", email: "k@x", role: "koperasi", cooperative_id: "c1" };
const prod: Actor = { id: "2", email: "p@x", role: "produsen", producer_id: "p1" };
const ver: Actor = { id: "3", email: "v@x", role: "verifikator" };
const admin: Actor = { id: "4", email: "a@x", role: "admin" };
const verified = { cooperative_id: "c1", producer_id: null, verification_status: "verified" };
const pending = { cooperative_id: "c1", producer_id: null, verification_status: "self_reported" };

describe("actorFromUser", () => {
  it("membaca peran dari app_metadata saja", () => {
    expect(actorFromUser({ id: "1", email: "a@b", app_metadata: { role: "koperasi", cooperative_id: "c1" } })?.cooperative_id).toBe("c1");
    expect(actorFromUser({ id: "1", email: "a@b", app_metadata: { role: "superuser" } })).toBeNull();
    expect(actorFromUser({ id: "1", email: "a@b" })).toBeNull();
    expect(actorFromUser(null)).toBeNull();
  });
});

describe("hak akses", () => {
  it("koperasi hanya boleh membuat batch untuk koperasinya sendiri", () => {
    expect(canCreateBatch(coop, "c1")).toBe(true);
    expect(canCreateBatch(coop, "c2")).toBe(false);
    expect(canCreateBatch(prod, "c1")).toBe(false);
    expect(canCreateBatch(ver, "c1")).toBe(false);
    expect(canCreateBatch(admin, "c9")).toBe(true);
  });
  it("hanya verifikator dan admin yang boleh memverifikasi", () => {
    expect(canVerify(ver)).toBe(true); expect(canVerify(admin)).toBe(true);
    expect(canVerify(coop)).toBe(false); expect(canVerify(prod)).toBe(false);
  });
  it("tahap hilir hanya untuk batch terverifikasi dan oleh produsen", () => {
    expect(canAddEvent(prod, verified, "produsen").ok).toBe(true);
    expect(canAddEvent(prod, pending, "produsen")).toEqual({ ok: false, reason: "batch_not_verified" });
    expect(canAddEvent(coop, verified, "distributor").ok).toBe(false);
    expect(canAddEvent(ver, verified, "produsen").ok).toBe(false);
  });
  it("koperasi hanya mencatat tahap hulu pada batch koperasinya", () => {
    expect(canAddEvent(coop, pending, "koperasi").ok).toBe(true);
    expect(canAddEvent(coop, { ...pending, cooperative_id: "c2" }, "koperasi").ok).toBe(false);
  });
  it("produsen lain tidak boleh melanjutkan batch yang sudah dipegang produsen berbeda", () => {
    expect(canAddEvent(prod, { ...verified, producer_id: "p2" }, "distributor").ok).toBe(false);
    expect(canAddEvent(prod, { ...verified, producer_id: "p1" }, "distributor").ok).toBe(true);
  });
  it("batch yang ditarik tidak dapat dilanjutkan oleh siapa pun", () => {
    const recalled = { ...verified, recalled_at: "2026-11-02T00:00:00Z" };
    expect(canAddEvent(prod, recalled, "distributor")).toEqual({ ok: false, reason: "batch_recalled" });
    expect(canAddEvent(admin, recalled, "distributor").ok).toBe(false);
  });
  it("hanya verifikator dan admin yang boleh menarik batch", () => {
    expect(canRecall(ver)).toBe(true); expect(canRecall(admin)).toBe(true);
    expect(canRecall(coop)).toBe(false); expect(canRecall(prod)).toBe(false);
  });
});
