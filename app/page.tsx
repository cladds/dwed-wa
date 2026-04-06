export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="font-heading text-4xl md:text-6xl text-gold mb-6 tracking-wide">
        The Dark Wheel Archives
      </h1>
      <p className="font-body text-text-mid text-lg md:text-xl max-w-2xl mb-8">
        Collaborative investigation platform for the Independent Raxxla Hunters.
        A classified dossier system crossed with a spatial evidence database.
      </p>
      <div className="font-system text-coord-blue text-sm tracking-widest uppercase mb-12">
        Sol: 0.00 / 0.00 / 0.00
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <a
          href="/dossiers"
          className="border border-border-gold bg-bg-card p-6 hover:bg-bg-hover transition-colors group"
        >
          <h2 className="font-ui text-gold text-sm tracking-[0.2em] uppercase mb-2">
            Dossiers
          </h2>
          <p className="font-body text-text-dim text-sm">
            Active investigation theories and hypotheses
          </p>
        </a>

        <a
          href="/systems"
          className="border border-border-gold bg-bg-card p-6 hover:bg-bg-hover transition-colors group"
        >
          <h2 className="font-ui text-gold text-sm tracking-[0.2em] uppercase mb-2">
            Coordinates
          </h2>
          <p className="font-body text-text-dim text-sm">
            System tickets under investigation
          </p>
        </a>

        <a
          href="/map"
          className="border border-border-gold bg-bg-card p-6 hover:bg-bg-hover transition-colors group"
        >
          <h2 className="font-ui text-gold text-sm tracking-[0.2em] uppercase mb-2">
            Galaxy Chart
          </h2>
          <p className="font-body text-text-dim text-sm">
            Spatial overlay of investigation zones
          </p>
        </a>
      </div>

      <section className="mt-16 w-full max-w-2xl">
        <h3 className="font-ui text-text-faint text-xs tracking-[0.3em] uppercase mb-4">
          Live Intel Feed
        </h3>
        <div className="border border-border bg-bg-card p-4 min-h-[120px] flex items-center justify-center">
          <p className="font-system text-text-dim text-xs">
            {"// awaiting connection to Supabase real-time channel"}
          </p>
        </div>
      </section>
    </div>
  );
}
