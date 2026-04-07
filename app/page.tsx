import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

const STATUS_LABELS: Record<string, string> = {
  open_lead: "Open Lead",
  under_investigation: "Under Investigation",
  promising: "Promising",
  verified: "Verified",
  disproven: "Disproven",
  dead_end: "Dead End",
};

const STATUS_COLORS: Record<string, string> = {
  open_lead: "text-gold",
  under_investigation: "text-purple-400",
  promising: "text-coord-blue",
  verified: "text-status-success",
  disproven: "text-status-danger",
  dead_end: "text-text-dim",
  cold: "text-[#5a6a7a]",
};

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch counts
  const [
    { count: openLeads },
    { count: underInvestigation },
    { count: systemCount },
    { count: evidenceCount },
    { count: forumPosts },
    { count: extractedLeads },
  ] = await Promise.all([
    supabase.from("dossiers").select("id", { count: "exact", head: true }).eq("status", "open_lead"),
    supabase.from("dossiers").select("id", { count: "exact", head: true }).eq("status", "under_investigation"),
    supabase.from("system_tickets").select("id", { count: "exact", head: true }),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
    supabase.from("forum_posts").select("id", { count: "exact", head: true }),
    supabase.from("extracted_leads").select("id", { count: "exact", head: true }).eq("status", "unreviewed"),
  ]);

  // Recent dossiers
  const { data: recentDossiers } = await supabase
    .from("dossiers")
    .select("id, slug, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  // Recent system tickets
  const { data: recentSystems } = await supabase
    .from("system_tickets")
    .select("id, system_name, status, score, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  // Recent forum posts (activity feed)
  const { data: recentPosts } = await supabase
    .from("forum_posts")
    .select("id, author_name, content_text, posted_at, page_number, post_number")
    .order("posted_at", { ascending: false })
    .limit(8);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="" width={36} height={36} className="hidden sm:block" />
          <div>
            <h1 className="font-heading text-xl text-gold tracking-wide">
              darkwheel.space
            </h1>
            <p className="font-system text-text-dim text-xs mt-0.5">
              Raxxla Investigation Platform
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/submit/theory"
            className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-4 py-2 hover:bg-gold/20 transition-colors flex-1 sm:flex-none text-center"
          >
            + New Theory
          </Link>
          <Link
            href="/submit/system"
            className="font-ui text-[10px] tracking-[0.15em] uppercase border border-border text-text-mid px-4 py-2 hover:bg-bg-hover transition-colors flex-1 sm:flex-none text-center"
          >
            + Coordinates
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Leads" value={String(openLeads ?? 0)} sub="awaiting review" href="/dossiers" />
        <StatCard label="Under Investigation" value={String(underInvestigation ?? 0)} sub="active operations" href="/dossiers" />
        <StatCard label="Coordinates Tracked" value={String(systemCount ?? 0)} sub="star systems" href="/systems" />
        <StatCard label="Forum Archive" value={String(forumPosts ?? 0)} sub={`${extractedLeads ?? 0} leads extracted`} href="/admin/archive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-bg-card">
            <CardHeader title="Forum Intel Feed" action={{ label: "Archive", href: "/admin/archive" }} />
            <div className="divide-y divide-border">
              {recentPosts && recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div key={post.id} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-system text-gold text-xs">{post.author_name}</span>
                      <span className="font-system text-text-faint text-[9px]">
                        p.{post.page_number} #{post.post_number ?? "?"}
                      </span>
                      {post.posted_at && (
                        <span className="font-system text-text-faint text-[9px]">
                          {new Date(post.posted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-text-mid text-sm line-clamp-2">
                      {post.content_text.substring(0, 200)}
                      {post.content_text.length > 200 ? "..." : ""}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-5 flex items-center justify-center min-h-[200px]">
                  <p className="font-system text-text-dim text-xs">
                    {"// run scraper to populate forum archive"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <CardHeader title="Recent Leads" action={{ label: "View all", href: "/dossiers" }} />
            <div className="divide-y divide-border">
              {recentDossiers && recentDossiers.length > 0 ? (
                recentDossiers.map((d) => (
                  <Link key={d.id} href={`/dossiers/${d.slug}`} className="block px-5 py-3 hover:bg-bg-hover transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-text-primary text-sm">{d.title}</span>
                      <span className={`font-system text-[9px] tracking-wider uppercase ${STATUS_COLORS[d.status] ?? "text-text-dim"}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5 flex items-center justify-center min-h-[80px]">
                  <p className="font-system text-text-dim text-xs">{"// no leads submitted yet"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-bg-card">
            <CardHeader title="Priority Systems" action={{ label: "Map", href: "/map" }} />
            <div className="divide-y divide-border">
              {recentSystems && recentSystems.length > 0 ? (
                recentSystems.map((s) => (
                  <Link key={s.id} href={`/systems/${s.id}`} className="block px-5 py-3 hover:bg-bg-hover transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-system text-coord-blue text-xs">{s.system_name}</span>
                      <span className={`font-system text-[9px] tracking-wider uppercase ${STATUS_COLORS[s.status] ?? "text-text-dim"}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-bg-deep h-1">
                        <div className="bg-gold/40 h-1" style={{ width: `${s.score}%` }} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5 flex items-center justify-center min-h-[100px]">
                  <p className="font-system text-text-dim text-xs">{"// no systems tracked"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-border bg-bg-card">
            <CardHeader title="Archive Stats" />
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-system text-text-dim text-xs">Forum posts scraped</span>
                <span className="font-system text-text-primary text-xs">{forumPosts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-system text-text-dim text-xs">Leads extracted</span>
                <span className="font-system text-gold text-xs">{extractedLeads ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-system text-text-dim text-xs">Evidence items</span>
                <span className="font-system text-text-primary text-xs">{evidenceCount ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
