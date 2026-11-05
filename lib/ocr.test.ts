import { describe, expect, it } from "vitest";
import { parseLabOcr } from "@/lib/ocr";

const good = '{"is_lab_report": true, "lab_name": "Lab Contoh", "report_date": "2026-10-01", "ethanol_pct": 38.5, "methanol_pct": "0,004", "verdict": "memenuhi", "confidence": 0.92}';

describe("parseLabOcr", () => {
  it("mengurai JSON valid, termasuk koma desimal dan pagar kode", () => {
    const r = parseLabOcr("```json\n" + good + "\n```");
    expect(r?.fields.methanol_pct).toBe(0.004);
    expect(r?.fields.ethanol_pct).toBe(38.5);
    expect(r?.warnings).toHaveLength(0);
  });
  it("menolak keluaran yang bukan objek JSON", () => {
    expect(parseLabOcr("bukan json")).toBeNull();
    expect(parseLabOcr("[1,2]")).toBeNull();
  });
  it("membuang angka di luar rentang dan menandai peringatan", () => {
    const r = parseLabOcr('{"is_lab_report": true, "lab_name": "x", "ethanol_pct": 400, "methanol_pct": -1, "verdict": "apa saja", "confidence": 5}');
    expect(r?.fields.ethanol_pct).toBeNull();
    expect(r?.fields.methanol_pct).toBeNull();
    expect(r?.fields.verdict).toBe("tidak_jelas");
    expect(r?.fields.confidence).toBe(1);
    expect(r?.warnings.some((w) => w.includes("metanol tidak terbaca"))).toBe(true);
  });
  it("memberi peringatan bila metanol melebihi batas atau bukan laporan lab", () => {
    const r = parseLabOcr('{"is_lab_report": false, "lab_name": "", "methanol_pct": 0.05, "confidence": 0.3}');
    expect(r?.warnings.some((w) => w.includes("melebihi batas"))).toBe(true);
    expect(r?.warnings.some((w) => w.includes("tidak terdeteksi"))).toBe(true);
    expect(r?.warnings.some((w) => w.includes("keyakinan"))).toBe(true);
  });
});
