"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useMe } from "@/components/useMe";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/labels";

export default function Masuk() {
  const me = useMe();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) { setError("Email atau kata sandi tidak sesuai."); return; }
      const role = String((data.user.app_metadata as Record<string, unknown> | undefined)?.role ?? "");
      if (!HOME_BY_ROLE[role]) { setError("Akun ini belum memiliki peran. Hubungi admin."); await supabase.auth.signOut(); return; }
      window.location.assign(HOME_BY_ROLE[role]);
    } catch { setError("Layanan masuk belum dikonfigurasi atau tidak dapat dihubungi."); }
    finally { setBusy(false); }
  }
  async function logout() { try { await createClient().auth.signOut(); } finally { window.location.assign("/masuk"); } }

  return <main><h1>Masuk</h1>
    {me === undefined && <p className="note" role="status">Memeriksa sesi…</p>}
    {me && me.dev && <div className="panel warn"><strong>Mode pengembangan lokal</strong><br />Supabase Auth belum dikonfigurasi, jadi Anda bertindak sebagai admin tanpa login. Di produksi, login wajib. Buka dasbor:
      <div className="actions"><Link className="button-link btn-sm" href="/koperasi">Koperasi</Link><Link className="button-link btn-sm" href="/verifikator">Verifikator</Link><Link className="button-link btn-sm" href="/produsen">Produsen</Link></div></div>}
    {me && !me.dev && <div className="panel"><strong>{me.email}</strong><br />Peran: {ROLE_LABEL[me.role] ?? me.role}
      <div className="actions"><Link className="button-link" href={HOME_BY_ROLE[me.role]}>Buka dasbor</Link><button type="button" className="secondary" style={{ background: "#fff", color: "var(--green)" }} onClick={logout}>Keluar</button></div></div>}
    {me === null && <form onSubmit={login}>
      <p className="note">Akun dipakai oleh koperasi, produsen, dan verifikator. Setelah masuk, Anda langsung diarahkan ke dasbor sesuai peran. Pembeli dapat mengecek batch tanpa masuk.</p>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Kata sandi</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="note bad-text" role="alert">{error}</p>}
      <p><button disabled={busy}>{busy ? "Masuk…" : "Masuk"}</button></p>
    </form>}
  </main>;
}
