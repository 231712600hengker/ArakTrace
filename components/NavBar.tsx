"use client";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useMe } from "@/components/useMe";
import { createClient } from "@/utils/supabase/client";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/labels";

export function NavBar() {
  const me = useMe();
  async function logout() { try { await createClient().auth.signOut(); } finally { window.location.assign("/"); } }
  return (<nav aria-label="Navigasi utama">
    <Link href="/" className="brand" aria-label="ArakTrace Bali, beranda"><Logo /></Link>
    <Link href="/batch">Daftar batch</Link>
    <Link href="/advisor">AI Advisor</Link>
    {me && <Link href={HOME_BY_ROLE[me.role]}>Dasbor {ROLE_LABEL[me.role]}</Link>}
    {me === null && <Link href="/masuk" className="nav-cta">Masuk</Link>}
    {me && !me.dev && <button type="button" className="nav-btn" onClick={logout}>Keluar</button>}
  </nav>);
}
