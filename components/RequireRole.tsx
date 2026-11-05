"use client";
import Link from "next/link";
import { useMe, type Me } from "@/components/useMe";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/labels";

type Role = "koperasi" | "produsen" | "verifikator" | "admin";

/** Membatasi halaman untuk peran tertentu; memberi arahan yang jelas bila belum masuk atau salah peran. */
export function RequireRole({ roles, title, children }: { roles: Role[]; title: string; children: (me: NonNullable<Me>) => React.ReactNode }) {
  const me = useMe();
  if (me === undefined) return <main><h1>{title}</h1><p className="note" role="status">Memeriksa sesi…</p></main>;
  if (me === null) return <main><h1>{title}</h1><div className="panel warn" role="alert">Masuk diperlukan untuk membuka halaman ini. <Link href="/masuk">Masuk</Link>.</div></main>;
  if (!roles.includes(me.role)) return <main><h1>{title}</h1><div className="panel warn" role="alert">Halaman ini untuk peran lain. Anda masuk sebagai {ROLE_LABEL[me.role]}; <Link href={HOME_BY_ROLE[me.role]}>buka dasbor Anda</Link>.</div></main>;
  return <>{children(me)}</>;
}
