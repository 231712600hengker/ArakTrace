type Step = { title: string; detail: string };

/** Ringkasan tindakan utama agar pengguna tahu langkah berikutnya. */
export function RoleGuide({ role, steps }: { role: string; steps: Step[] }) {
  return <section className="role-guide" aria-label={`Alur kerja ${role}`}>
    <p className="eyebrow">Alur kerja {role}</p>
    <ol>{steps.map((step, index) => <li key={step.title}>
      <span aria-hidden="true">{index + 1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>
    </li>)}</ol>
  </section>;
}
