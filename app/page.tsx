import Image from "next/image";
import Link from "next/link";

function StatCard({ label, value, sub, href }: { label: string; value: string; sub: string; href?: string }) {
  const inner = (
    <div className="border border-border bg-bg-card p-5 hover:bg-bg-hover transition-colors">
      <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-3">
        {label}
      </p>
      <p className="font-heading text-gold text-2xl mb-1">{value}</p>
      <p className="font-system text-text-dim text-xs">{sub}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function CardHeader({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="px-5 py-3 border-b border-border flex items-center justify-between">
      <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
        {title}
      </h3>
      {action && (
        <Link href={action.href} className="font-system text-text-faint text-[9px] tracking-wider uppercase hover:text-gold transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="" width={36} height={36} />
          <div>
            <h1 className="font-heading text-xl text-gold tracking-wide">
              darkwheel.space
            </h1>
            <p className="font-system text-text-dim text-xs mt-0.5">
              Raxxla Investigation Platform
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/submit/dossier"
            className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-4 py-2 hover:bg-gold/20 transition-colors"
          >
            + New Lead
          </Link>
          <Link
            href="/submit/system"
            className="font-ui text-[10px] tracking-[0.15em] uppercase border border-border text-text-mid px-4 py-2 hover:bg-bg-hover transition-colors"
          >
            + Coordinates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Leads" value="--" sub="awaiting review" href="/dossiers?status=open_lead" />
        <StatCard label="Under Investigation" value="--" sub="active operations" href="/dossiers?status=under_investigation" />
        <StatCard label="Coordinates Tracked" value="--" sub="star systems" href="/systems" />
        <StatCard label="Evidence Items" value="--" sub="submitted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-bg-card">
            <CardHeader title="Live Intel Feed" action={{ label: "View all", href: "/dossiers" }} />
            <div className="p-5 min-h-[280px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// awaiting real-time channel subscription"}
              </p>
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <CardHeader title="Recent Activity" />
            <div className="p-5 min-h-[120px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// no recent activity"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-bg-card">
            <CardHeader title="Priority Leads" action={{ label: "View all", href: "/dossiers?status=promising" }} />
            <div className="p-5 min-h-[160px] flex items-center justify-center">
              <p className="font-system text-text-dim text-xs">
                {"// no promising leads"}
              </p>
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <CardHeader title="Your Profile" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-system text-text-dim text-xs">Rank</span>
                <span className="font-system text-gold text-xs">Recruit</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-system text-text-dim text-xs">Contributions</span>
                <span className="font-system text-text-primary text-xs">0</span>
              </div>
              <div className="w-full bg-bg-deep h-1 mt-2">
                <div className="bg-gold/40 h-1" style={{ width: "0%" }} />
              </div>
              <p className="font-system text-text-faint text-[9px] mt-1">
                10 points to Investigator
              </p>
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <CardHeader title="Flagged Systems" action={{ label: "Map", href: "/map" }} />
            <div className="p-5 min-h-[100px] flex items-center justify-center">
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
