import "@/lib/server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { actorFromUser, type Actor, type Role } from "@/lib/permissions";

const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// Tanpa Supabase Auth, tulis-data hanya terbuka saat pengembangan lokal atau jika DEMO_OPEN_WRITE=true dipasang sengaja.
const openWrite = () => process.env.NODE_ENV !== "production" || process.env.DEMO_OPEN_WRITE === "true";

export async function getActor(): Promise<Actor | null> {
  if (!authConfigured()) return openWrite() ? { id: "dev", email: "dev@lokal", role: "admin", dev: true } : null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return actorFromUser(data.user);
  } catch { return null; }
}

export async function requireActor(roles: Role[]): Promise<{ actor: Actor } | { response: NextResponse }> {
  const actor = await getActor();
  if (!actor) return { response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  if (!roles.includes(actor.role)) return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { actor };
}
