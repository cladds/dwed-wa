interface DossierDetailProps {
  params: { slug: string };
}

export default function DossierDetailPage({ params }: DossierDetailProps) {
  return (
    <div>
      <p className="font-system text-coord-blue text-xs mb-4 tracking-widest uppercase">
        Dossier // {params.slug}
      </p>
      <h1 className="font-heading text-2xl text-gold tracking-wide mb-6">
        Dossier Detail
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-bg-card p-6 min-h-[300px]">
          <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
            Hypothesis
          </h2>
          <p className="font-system text-text-dim text-xs">
            {"// awaiting Supabase connection"}
          </p>
        </div>

        <div className="border border-border bg-bg-card p-6">
          <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
            Linked Coordinates
          </h2>
          <p className="font-system text-text-dim text-xs">
            {"// no linked system tickets"}
          </p>
        </div>
      </div>
    </div>
  );
}
