import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TheoryComments } from "@/components/theories/TheoryComments";
import { TheoryStatusControl } from "@/components/theories/TheoryStatusControl";
import { TheoryMerge } from "@/components/theories/TheoryMerge";

const STATUS_LABELS: Record<string, string> = {
  open_lead: "Open Lead",
  under_investigation: "Investigating",
  promising: "Promising",
  verified: "Verified",
  disproven: "Disproven",
  dead_end: "Dead End",
  cold: "Cold",
};

const STATUS_COLORS: Record<string, string> = {
  open_lead: "border-gold text-gold",
  under_investigation: "border-purple-400 text-purple-400",
  promising: "border-coord-blue text-coord-blue",
  verified: "border-status-success text-status-success",
  disproven: "border-status-danger text-status-danger",
  dead_end: "border-text-dim text-text-dim",
  cold: "border-[#5a6a7a] text-[#5a6a7a]",
};

interface TheoryDetailProps {
  params: { slug: string };
}

export default async function TheoryDetailPage({ params }: TheoryDetailProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: theory } = await supabase
    .from("theories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!theory) notFound();

  // Check if user can manage status
  const { data: { user } } = await supabase.auth.getUser();
  let canManageStatus = false;
  if (user) {
    const { data: operative } = await supabase
      .from("operatives")
      .select("rank")
      .eq("discord_id", user.user_metadata.provider_id ?? user.id)
      .single();
    canManageStatus = ["lead_investigator", "director"].includes(operative?.rank ?? "");
  }

  // Get linked extracted leads with their forum posts
  const { data: linkedLeadsRaw } = await supabase
    .from("extracted_leads")
    .select(`
      *,
      forum_post:forum_posts(
        forum_post_id,
        author_name,
        content_text,
        posted_at,
        page_number,
        post_number
      )
    `)
    .eq("theory_id", theory.id)
    .order("created_at", { ascending: true });

  interface LinkedLead {
    id: string;
    lead_type: string;
    title: string;
    summary: string;
    forum_post: {
      forum_post_id: string;
      author_name: string;
      content_text: string;
      posted_at: string | null;
      page_number: number;
      post_number: number | null;
    } | null;
  }

  const linkedLeads = (linkedLeadsRaw ?? []) as unknown as LinkedLead[];

  return (
    <div>
      <div className="mb-6">
        <Link href="/theories" className="font-system text-text-dim text-xs hover:text-gold transition-colors">
          &lt; Back to Theories
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="border border-border bg-bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-ui text-gold text-[10px] tracking-[0.2em] uppercase">
                {theory.category}
              </span>
              <span className={`font-system text-[9px] tracking-wider uppercase border px-2 py-0.5 ${STATUS_COLORS[theory.status] ?? ""}`}>
                {STATUS_LABELS[theory.status] ?? theory.status}
              </span>
              {theory.source === "forum" && (
                <span className="font-system text-text-faint text-[9px] bg-bg-hover px-2 py-0.5">forum archive</span>
              )}
            </div>
            <h1 className="font-heading text-xl text-gold tracking-wide mb-4">
              {theory.title}
            </h1>
            <p className="font-body text-text-primary text-base leading-relaxed whitespace-pre-wrap">
              {theory.summary}
            </p>
            {theory.original_author && (
              <p className="font-system text-text-faint text-[9px] mt-4">
                Original theorist: {theory.original_author}
                {theory.source_url && (
                  <>
                    {" -- "}
                    <a href={theory.source_url} target="_blank" rel="noopener noreferrer" className="text-coord-blue hover:underline">
                      View original post
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Linked forum posts */}
          <div className="border border-border bg-bg-card">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                Supporting Evidence ({linkedLeads?.length ?? 0} posts)
              </h2>
            </div>
            {linkedLeads && linkedLeads.length > 0 ? (
              <div className="divide-y divide-border">
                {linkedLeads.map((lead) => (
                  <div key={lead.id} className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-ui text-gold text-[9px] tracking-[0.15em] uppercase">
                        {lead.lead_type}
                      </span>
                      <span className="font-body text-text-primary text-sm">{lead.title}</span>
                    </div>
                    <p className="font-body text-text-mid text-sm mb-2">{lead.summary}</p>
                    {lead.forum_post && (
                      <div className="bg-bg-deep border border-border p-3 mt-2">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-system text-gold text-xs">{lead.forum_post.author_name}</span>
                          <span className="font-system text-text-faint text-[9px]">
                            p.{lead.forum_post.page_number} #{lead.forum_post.post_number ?? "?"}
                          </span>
                          {lead.forum_post.posted_at && (
                            <span className="font-system text-text-faint text-[9px]">
                              {new Date(lead.forum_post.posted_at).toLocaleDateString()}
                            </span>
                          )}
                          <a
                            href={`https://forums.frontier.co.uk/threads/168253/post-${lead.forum_post.forum_post_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-system text-coord-blue text-[9px] hover:underline"
                          >
                            View original
                          </a>
                        </div>
                        <p className="font-body text-text-dim text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {lead.forum_post.content_text.substring(0, 800)}
                          {lead.forum_post.content_text.length > 800 ? "..." : ""}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center">
                <p className="font-system text-text-dim text-xs">{"// no linked evidence"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {theory.systems_mentioned.length > 0 && (
            <div className="border border-border bg-bg-card">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                  Systems ({theory.systems_mentioned.length})
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {theory.systems_mentioned.map((sys: string) => (
                  <div key={sys} className="flex items-center gap-2">
                    <span className="font-system text-coord-blue text-xs">{sys}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-border bg-bg-card p-5">
            <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-3">
              Stats
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-system text-text-dim text-xs">Evidence items</span>
                <span className="font-system text-text-primary text-xs">{theory.evidence_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-system text-text-dim text-xs">Forum posts</span>
                <span className="font-system text-text-primary text-xs">{theory.source_post_count}</span>
              </div>
              {(() => {
                const dates = (linkedLeads ?? [])
                  .map(l => l.forum_post?.posted_at)
                  .filter(Boolean)
                  .map(d => new Date(d!))
                  .sort((a, b) => a.getTime() - b.getTime());
                const earliest = dates[0];
                const latest = dates[dates.length - 1];
                return earliest ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-system text-text-dim text-xs">First post</span>
                      <span className="font-system text-text-primary text-xs">{earliest.toLocaleDateString()}</span>
                    </div>
                    {latest && latest.getTime() !== earliest.getTime() && (
                      <div className="flex justify-between">
                        <span className="font-system text-text-dim text-xs">Latest post</span>
                        <span className="font-system text-text-primary text-xs">{latest.toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                ) : null;
              })()}
              <div className="flex justify-between">
                <span className="font-system text-text-dim text-xs">Added to darkwheel</span>
                <span className="font-system text-text-faint text-xs">{new Date(theory.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {canManageStatus && (
            <>
              <TheoryStatusControl theoryId={theory.id} currentStatus={theory.status} />
              <TheoryMerge currentTheoryId={theory.id} />
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TheoryComments theoryId={theory.id} />
      </div>
    </div>
  );
}
