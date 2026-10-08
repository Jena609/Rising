export function PageHeader({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-water">{eyebrow}</p> : null}
      <h1 className="mt-1 font-serif text-3xl text-navy sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-muted">{lede}</p>
    </header>
  );
}
