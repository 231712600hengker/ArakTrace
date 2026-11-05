import "@/lib/server-only";
import { headers } from "next/headers";

/** URL dasar situs untuk isi QR: NEXT_PUBLIC_SITE_URL bila diatur, selain itu dari header permintaan. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
