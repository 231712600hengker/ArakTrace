import { PRICE_LABEL, RISK_LABEL, VERIFICATION_LABEL } from "@/lib/labels";

export function VerificationBadge({ status, recalled }: { status: string; recalled?: boolean }) {
  if (recalled) return <span className="badge bad-b">Ditarik dari peredaran</span>;
  return <span className={`badge ${status === "verified" ? "" : status === "rejected" ? "bad-b" : "warn-b"}`}>{VERIFICATION_LABEL[status] ?? status}</span>;
}
export function RiskBadge({ label }: { label: string }) {
  return <span className={`badge ${label === "rendah" ? "" : label === "sedang" ? "warn-b" : "bad-b"}`}>{RISK_LABEL[label] ?? label}</span>;
}
export function PriceBadge({ status }: { status: string }) {
  return <span className={`badge ${status === "memenuhi" ? "" : status === "di_bawah_batas" ? "bad-b" : "warn-b"}`}>{PRICE_LABEL[status] ?? status}</span>;
}
