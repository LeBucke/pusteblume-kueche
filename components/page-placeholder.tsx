/** Leere Seite mit Überschrift, bis das zugehörige Paket sie füllt. */
export function PagePlaceholder({
  title,
  paket,
}: {
  title: string;
  paket: string;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-2 text-lg text-muted">Kommt mit Paket {paket}.</p>
    </div>
  );
}
