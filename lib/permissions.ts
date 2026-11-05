// Aturan hak akses murni (tanpa I/O) agar mudah diuji.
export type Role = "koperasi" | "produsen" | "verifikator" | "admin";
export type Actor = { id: string; email: string; role: Role; cooperative_id?: string; producer_id?: string; dev?: boolean };
export type ActorType = "perajin" | "koperasi" | "produsen" | "distributor" | "sub_distributor" | "penjual_langsung";
export const ACTOR_TYPES: ActorType[] = ["perajin", "koperasi", "produsen", "distributor", "sub_distributor", "penjual_langsung"];
export const CHAIN_ORDER: Record<ActorType, number> = { perajin: 1, koperasi: 2, produsen: 3, distributor: 4, sub_distributor: 5, penjual_langsung: 6 };
export const ACTOR_LABEL: Record<ActorType, string> = { perajin: "Perajin", koperasi: "Koperasi", produsen: "Produsen", distributor: "Distributor", sub_distributor: "Sub distributor", penjual_langsung: "Penjual langsung" };

const ROLES: Role[] = ["koperasi", "produsen", "verifikator", "admin"];

/** Peran dibaca dari app_metadata (hanya bisa diubah lewat service role), bukan user_metadata. */
export function actorFromUser(user: { id: string; email?: string | null; app_metadata?: Record<string, unknown> } | null): Actor | null {
  if (!user) return null;
  const meta = user.app_metadata ?? {};
  const role = meta.role;
  if (typeof role !== "string" || !ROLES.includes(role as Role)) return null;
  return {
    id: user.id, email: user.email ?? "", role: role as Role,
    cooperative_id: typeof meta.cooperative_id === "string" ? meta.cooperative_id : undefined,
    producer_id: typeof meta.producer_id === "string" ? meta.producer_id : undefined,
  };
}

export function canCreateBatch(actor: Actor, cooperativeId: string) {
  if (actor.role === "admin") return true;
  return actor.role === "koperasi" && actor.cooperative_id === cooperativeId;
}

export function canVerify(actor: Actor) { return actor.role === "verifikator" || actor.role === "admin"; }

type BatchRef = { cooperative_id: string; producer_id: string | null; verification_status: string; recalled_at?: string | null };

export function canRecall(actor: Actor) { return actor.role === "verifikator" || actor.role === "admin"; }

/** Peristiwa hulu (perajin/koperasi) dicatat koperasi; peristiwa hilir hanya untuk batch yang sudah diverifikasi. */
export function canAddEvent(actor: Actor, batch: BatchRef, actorType: ActorType): { ok: boolean; reason?: string } {
  if (actor.role === "verifikator") return { ok: false, reason: "role_not_allowed" };
  if (batch.recalled_at) return { ok: false, reason: "batch_recalled" };
  if (actor.role === "admin") return { ok: true };
  const upstream = actorType === "perajin" || actorType === "koperasi";
  if (upstream) {
    if (actor.role === "koperasi" && actor.cooperative_id === batch.cooperative_id) return { ok: true };
    return { ok: false, reason: "role_not_allowed" };
  }
  if (actor.role !== "produsen") return { ok: false, reason: "role_not_allowed" };
  if (batch.verification_status !== "verified") return { ok: false, reason: "batch_not_verified" };
  if (batch.producer_id && batch.producer_id !== actor.producer_id) return { ok: false, reason: "role_not_allowed" };
  return { ok: true };
}
