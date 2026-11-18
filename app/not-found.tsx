import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <span className="eyebrow">Errore 404</span>
      <h1 className="font-serif text-4xl text-ink sm:text-5xl">
        Pagina non trovata
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-graphite">
        Il pezzo che cerchi potrebbe essere stato spostato o non è più
        disponibile. Torna alla collezione e lasciati ispirare.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-sm bg-ink px-7 py-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-gold"
        >
          Torna alla Home
        </Link>
        <Link
          href="/gioielli"
          className="inline-flex items-center justify-center rounded-sm border border-line px-7 py-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold"
        >
          Esplora i Gioielli
        </Link>
      </div>
    </div>
  );
}
