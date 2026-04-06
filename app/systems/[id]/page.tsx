interface SystemDetailProps {
  params: { id: string };
}

export default function SystemDetailPage({ params }: SystemDetailProps) {
  return (
    <div>
      <p className="font-system text-coord-blue text-xs mb-4 tracking-widest uppercase">
        System Ticket // {params.id}
      </p>
      <h1 className="font-heading text-2xl text-gold tracking-wide mb-6">
        System Detail
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-bg-card p-6">
            <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
              What We Know
            </h2>
            <p className="font-system text-text-dim text-xs">
              {"// awaiting Supabase connection"}
            </p>
          </div>

          <div className="border border-border bg-bg-card p-6">
            <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
              Intel Threads
            </h2>
            <p className="font-system text-text-dim text-xs">
              {"// no threads yet"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-bg-card p-6">
            <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
              Coordinates
            </h2>
            <p className="font-system text-coord-blue text-xs">
              {"// pending EDSM enrichment"}
            </p>
          </div>

          <div className="border border-border bg-bg-card p-6">
            <h2 className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase mb-4">
              Evidence
            </h2>
            <p className="font-system text-text-dim text-xs">
              {"// no evidence submitted"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
