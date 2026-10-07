const PAIRS = [
  ['한국어', 'English'],
  ['日本語', 'Español'],
  ['中文', 'Français'],
  ['한국어', 'Português'],
  ['日本語', 'English'],
  ['中文', 'Deutsch'],
  ['한국어', 'Bahasa'],
  ['日本語', 'Italiano'],
];

/** An endless strip of the language pairs Overset localizes. Pauses on hover. */
export function LanguageTicker() {
  const row = PAIRS.map(([from, to], i) => (
    <li key={i} className="flex shrink-0 items-center gap-3 px-6 text-[clamp(20px,2.6vw,34px)] font-semibold tracking-[-0.02em]">
      <span className="font-kr text-ink">{from}</span>
      <span className="text-accent" aria-hidden>→</span>
      <span className="text-ink-muted">{to}</span>
      <span className="ml-6 size-1.5 rounded-full bg-ink/20" aria-hidden />
    </li>
  ));
  return (
    <section aria-label="Supported language pairs" className="fx-ticker mt-6 overflow-hidden border-y border-line bg-white py-6">
      <div className="fx-ticker-track flex w-max">
        <ul className="flex">{row}</ul>
        {/* Second copy makes the loop seamless; hidden from screen readers. */}
        <ul className="flex" aria-hidden>{row}</ul>
      </div>
    </section>
  );
}
