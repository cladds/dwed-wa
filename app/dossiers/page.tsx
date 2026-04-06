export default function DossiersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl text-gold tracking-wide">
          Dossier Board
        </h1>
        <a
          href="/submit/dossier"
          className="font-ui text-xs tracking-[0.2em] uppercase border border-border-gold text-text-mid px-4 py-2 hover:text-gold hover:border-gold transition-colors"
        >
          New Dossier
        </a>
      </div>

      <div className="border border-border bg-bg-card p-8 flex items-center justify-center min-h-[200px]">
        <p className="font-system text-text-dim text-xs">
          {"// awaiting Supabase connection to load dossiers"}
        </p>
      </div>
    </div>
  );
}
