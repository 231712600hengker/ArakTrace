import { ACTOR_LABEL, ACTOR_TYPES, type ActorType } from "@/lib/permissions";

/** Ringkasan 6 tahap rantai: tahap yang sudah tercatat diberi warna, lengkap dengan jumlah liter. */
export function ChainMini({ chain }: { chain: { actor_type: ActorType; quantity_liters: number | null }[] }) {
  return (<ol className="chain-mini" aria-label="Tahap rantai pasok">
    {ACTOR_TYPES.map((type) => { const e = chain.find((x) => x.actor_type === type);
      return <li key={type} className={e ? "done" : ""}>{ACTOR_LABEL[type]}{e?.quantity_liters ? ` · ${e.quantity_liters} L` : ""}</li>; })}
  </ol>);
}
