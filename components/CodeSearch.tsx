"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CodeSearch() {
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) { setError("Masukkan kode batch, lalu pilih Cek batch."); return; }
    router.push(`/batch/${encodeURIComponent(code.trim())}`);
  }
  return (<form onSubmit={submit} className="search" role="search">
    <input className="mono" aria-label="Kode batch" placeholder="ARK-KRG-2610-0001" value={code} onChange={(e) => { setCode(e.target.value); setError(""); }} />
    <button type="submit">Cek batch</button>
    {error && <p className="note bad-text" role="alert" style={{ flexBasis: "100%", margin: 0 }}>{error}</p>}
  </form>);
}
