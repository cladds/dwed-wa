import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ArchiveReview } from "@/components/archive/ArchiveReview";

export default async function ArchivePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Stats
  const { count: totalPosts } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true });

  const { count: processedPosts } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("ai_processed", true);

  const { count: unreviewedLeads } = await supabase
    .from("extracted_leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "unreviewed");

  const { count: importedLeads } = await supabase
    .from("extracted_leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "imported");

  // Get unreviewed leads with their source posts
  const { data: leads } = await supabase
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
    .eq("status", "unreviewed")
    .order("confidence", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Forum Archive
        </h1>
        <p className="font-system text-text-dim text-xs">
          The Quest to Find Raxxla // Thread 168253
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-border bg-bg-card p-4">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-2">Total Posts</p>
          <p className="font-heading text-gold text-xl">{totalPosts ?? 0}</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-2">AI Processed</p>
          <p className="font-heading text-gold text-xl">{processedPosts ?? 0}</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-2">Needs Review</p>
          <p className="font-heading text-status-warning text-xl">{unreviewedLeads ?? 0}</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-2">Imported</p>
          <p className="font-heading text-status-success text-xl">{importedLeads ?? 0}</p>
        </div>
      </div>

      <ArchiveReview leads={leads ?? []} />
    </div>
  );
}
