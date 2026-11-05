import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth";

/** Mengembalikan peran pengguna saat ini (tanpa id internal) agar UI dapat menyesuaikan tampilan. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ actor: null });
  return NextResponse.json({ actor: { email: actor.email, role: actor.role, cooperative_id: actor.cooperative_id, producer_id: actor.producer_id, dev: actor.dev === true } });
}
