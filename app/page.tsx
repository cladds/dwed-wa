import Image from "next/image";

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-border bg-bg-card p-5">
      <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-3">
        {label}
      </p>
      <p className="font-heading text-gold text-2xl mb-1">{value}</p>
      <p className="font-system text-text-dim text-xs">{sub}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Image src="/logo.svg" alt="" width={36} height={36} />
        <div>
          <h1 className="font-heading text-2xl text-gold tracking-wide">
            The Dark Wheel Archives
          </h1>
          <p className="font-system text-text-dim text-xs mt-0.5">
            Independent Raxxla Hunters // Operations Console
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Dossiers" value="--" sub="// pending connection" />
        <StatCard label="Coordinates" value="--" sub="// pending connection" />
        <StatCard label="Operatives" value="--" sub="// pending connection" />
        <StatCard label="Evidence Items" value="--" sub="// pending connection" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="border border-border bg-bg-card">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                Live Intel Feed
              </h3>
              <span className="font-system text-status-success text-[9px] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-status-success rounded-full inline-block" />
                Monitoring
              </span>
            </div>
            <div className="p-5 min-h-[280px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// awaiting Supabase real-time channel subscription"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-bg-card">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                Recent Dossiers
              </h3>
            </div>
            <div className="p-5 min-h-[120px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// no active dossiers"}
              </p>
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                Priority Coordinates
              </h3>
            </div>
            <div className="p-5 min-h-[120px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// no flagged systems"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
