import { qrSvgPath } from "@/lib/qr";

/** QR sebagai satu elemen SVG (tanpa dependensi, tanpa layanan eksternal). */
export function QrCode({ value, label, size = 176 }: { value: string; label: string; size?: number }) {
  let qr: { d: string; size: number };
  try { qr = qrSvgPath(value); } catch { return <p className="note">QR tidak dapat dibuat untuk tautan ini.</p>; }
  return (
    <svg viewBox={`0 0 ${qr.size} ${qr.size}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges" className="qr">
      <rect width={qr.size} height={qr.size} fill="#fff" />
      <path d={qr.d} fill="#16241E" />
    </svg>
  );
}
