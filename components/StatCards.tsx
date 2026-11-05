export function StatCards({ items }: { items: { label: string; value: number; alert?: boolean }[] }) {
  return <div className="stats" role="list">{items.map((i) => <div key={i.label} role="listitem" className={`stat${i.alert && i.value > 0 ? " alert" : ""}`}><b>{i.value}</b><span>{i.label}</span></div>)}</div>;
}
