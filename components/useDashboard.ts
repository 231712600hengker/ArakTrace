"use client";
import { useCallback, useEffect, useState } from "react";
import type { DashboardRow, DashboardStats } from "@/lib/db";

export type DashboardData = { stats: DashboardStats; rows: DashboardRow[] };

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    fetch("/api/dashboard").then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(); setData(d); setError(""); })
      .catch(() => setError("Data dasbor tidak dapat dimuat. Periksa koneksi lalu muat ulang."));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}
