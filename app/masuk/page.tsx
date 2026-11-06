"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useMe } from "@/components/useMe";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/labels";

export default function Masuk() {
  const me = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) {
        setError("Email atau kata sandi tidak sesuai.");
        return;
      }
      const role = String((data.user.app_metadata as Record<string, unknown> | undefined)?.role ?? "");
      if (!HOME_BY_ROLE[role]) {
        setError("Akun ini belum memiliki peran terdaftar. Hubungi administrator.");
        await supabase.auth.signOut();
        return;
      }
      window.location.assign(HOME_BY_ROLE[role]);
    } catch {
      setError("Layanan autentikasi belum dikonfigurasi atau tidak dapat dihubungi.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await createClient().auth.signOut();
    } finally {
      window.location.assign("/masuk");
    }
  }

  return (
    <main style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "32px 28px",
        boxShadow: "var(--shadow)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "2.8rem", lineHeight: 1, marginBottom: "8px" }}>🔐</div>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.6rem" }}>Masuk ke ArakTrace</h1>
          <p className="note" style={{ margin: 0, fontSize: "14px" }}>
            Akses khusus pemangku kepentingan: Koperasi, Verifikator, dan Produsen.
          </p>
        </div>

        {me === undefined && <p className="note" role="status" style={{ textAlign: "center" }}>Memeriksa sesi pengguna…</p>}

        {me && me.dev && (
          <div className="panel warn" style={{ marginTop: 0 }}>
            <strong>Mode Pengembangan Lokal</strong>
            <p className="note" style={{ margin: "4px 0 12px" }}>
              Supabase Auth belum diaktifkan secara lokal. Anda dapat langsung membuka dasbor peran:
            </p>
            <div className="actions" style={{ marginTop: 0 }}>
              <Link className="button-link btn-sm" href="/koperasi">🏘️ Koperasi</Link>
              <Link className="button-link btn-sm" href="/verifikator">🔍 Verifikator</Link>
              <Link className="button-link btn-sm" href="/produsen">🏭 Produsen</Link>
            </div>
          </div>
        )}

        {me && !me.dev && (
          <div className="panel" style={{ marginTop: 0, borderLeftColor: "var(--green)" }}>
            <strong style={{ fontSize: "15px" }}>{me.email}</strong>
            <p className="note" style={{ margin: "4px 0 16px" }}>
              Peran aktif: <strong>{ROLE_LABEL[me.role] ?? me.role}</strong>
            </p>
            <div className="actions" style={{ marginTop: 0 }}>
              <Link className="button-link" href={HOME_BY_ROLE[me.role]}>Buka Dasbor</Link>
              <button type="button" className="secondary" style={{ background: "#fff", color: "var(--green)" }} onClick={logout}>
                Keluar
              </button>
            </div>
          </div>
        )}

        {me === null && (
          <form onSubmit={login}>
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="email">Alamat Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                placeholder="nama@instansi.example"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="panel bad" role="alert" style={{ margin: "0 0 16px" }}>{error}</div>}

            <button disabled={busy} style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: 700 }}>
              {busy ? "⏳ Memeriksa Kredensial…" : "Masuk ke Sistem"}
            </button>

            <p className="note" style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
              💡 Konsumen & publik dapat memeriksa batch langsung melalui halaman utama tanpa perlu masuk.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
