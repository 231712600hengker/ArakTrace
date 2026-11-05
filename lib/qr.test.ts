import { describe, expect, it } from "vitest";
import { qrMatrix, qrSvgPath } from "@/lib/qr";

describe("qrMatrix", () => {
  it("memilih versi sesuai panjang data dan konsisten (deterministik)", () => {
    expect(qrMatrix("ARK-KRG-2610-0001")).toHaveLength(25); // versi 2
    expect(qrMatrix("https://contoh.example/batch/ARK-KRG-2610-0001")).toHaveLength(33); // versi 4
    expect(qrMatrix("abc")).toEqual(qrMatrix("abc"));
  });
  it("memuat tiga pola pencari di sudut dan modul gelap tetap", () => {
    const m = qrMatrix("ARK-KRG-2610-0001"); const n = m.length;
    for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) { expect(m[r][c]).toBe(true); expect(m[r + 3][c + 3]).toBe(true); expect(m[r + 1][c + 1]).toBe(false); }
    expect(m[n - 8][8]).toBe(true);
  });
  it("menolak teks yang terlalu panjang", () => { expect(() => qrMatrix("x".repeat(200))).toThrow(); });
  it("menghasilkan path SVG dengan quiet zone", () => { const { d, size } = qrSvgPath("ARK", 4); expect(size).toBe(21 + 8); expect(d.length).toBeGreaterThan(50); });
});
