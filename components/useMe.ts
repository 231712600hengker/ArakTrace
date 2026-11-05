"use client";
import { useEffect, useState } from "react";

export type Me = { email: string; role: "koperasi" | "produsen" | "verifikator" | "admin"; cooperative_id?: string; producer_id?: string; dev: boolean } | null;

/** undefined = sedang memuat, null = belum masuk. */
export function useMe(): Me | undefined {
  const [me, setMe] = useState<Me | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetch("/api/me").then((r) => r.json()).then((d) => { if (alive) setMe(d.actor ?? null); }).catch(() => { if (alive) setMe(null); });
    return () => { alive = false; };
  }, []);
  return me;
}
