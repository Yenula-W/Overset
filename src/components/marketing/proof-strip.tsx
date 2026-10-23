/** Plain product facts under the hero. No customer numbers or logos until they are real. */
const FACTS = [
  ["KO · JA · ZH", "Source languages"],
  ["Original size", "Pages exported untouched"],
  ["10 pages", "Free every month"],
  ["You review", "Nothing ships unchecked"],
];

export function ProofStrip() {
  return (
    <section aria-label="Overset at a glance" className="mk-shell">
      <dl className="m-0 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-4">
        {FACTS.map(([value, label], i) => (
          <div key={value} className={`px-6 py-6 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`}>
            <dt className="mk-mono order-2 text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">{label}</dt>
            <dd className="m-0 mt-2 text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[-0.02em]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
