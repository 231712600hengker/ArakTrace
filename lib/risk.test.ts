import fixtures from "@/data/risk-fixtures.json";
import { scoreRisk } from "@/lib/risk";
import { describe, expect, it } from "vitest";
describe("scoreRisk", () => { it("sesuai fixture dari ml/train_risk_model.py dalam toleransi 0.01", () => { for (const fixture of fixtures) expect(scoreRisk(fixture.input).score).toBeCloseTo(fixture.expected_score, 2); }); });
