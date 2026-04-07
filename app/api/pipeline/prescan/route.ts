import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = 25;
const MAX_BATCHES = 1;

export async function POST() {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check how many unprocessed posts remain
  const { count: remaining } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("ai_processed", false);

  const maxBatches = MAX_BATCHES;

  let totalProcessed = 0;
  let totalExtracted = 0;
  let batchNum = 0;

  for (let batch = 0; batch < maxBatches; batch++) {
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("id, forum_post_id, author_name, content_text, posted_at, page_number, post_number")
      .eq("ai_processed", false)
      .order("page_number", { ascending: true })
      .limit(BATCH_SIZE);

    if (!posts || posts.length === 0) break;
    batchNum++;

    const postsText = posts.map((p, i) => {
      // Strip quoted text and signatures more aggressively
      let content = p.content_text;
      // Remove "Username said:" quoted blocks
      content = content.replace(/^.*? said:[\s\S]*?(?=\n[A-Z]|\n\n)/gm, "");
      // Remove signature blocks
      content = content.replace(/---[\s\S]*$/m, "");
      // Truncate aggressively to keep API calls fast
      content = content.length > 800 ? content.substring(0, 800) + "\n[...truncated]" : content;
      return `--- POST ${i + 1} ---\nid: ${p.forum_post_id} | ${p.author_name} | p.${p.page_number} #${p.post_number ?? "?"}\n${content}`;
    }).join("\n\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system: `You extract investigation leads from Elite Dangerous Raxxla forum posts. Be selective: skip casual chat, "I agree" posts, off-topic discussion, and posts that just quote others without adding anything new.

Strip out:
- Quoted text from other users
- Forum signatures
- Broken image/media references

Only extract posts with: original theories, specific system names with reasoning, evidence analysis, lore connections, game mechanic discoveries, or developer/author clue analysis.

For each extracted item, assign a broad theory group from these known categories:
- Raxxla Location Theories
- Dark Wheel Faction & Missions
- Witchspace & Hyperspace Anomalies
- Lore & Developer Clues
- Permit-Locked Systems
- Game Mechanics & Scanning
- Constellation & Star Patterns
- Formidine Rift & Generation Ships
- Codex & Listening Posts
- The Club & Powerplay
- Historical Expeditions & Findings

Reuse these names. Only create a new group if it genuinely doesn't fit any existing one.`,
          messages: [{ role: "user", content: `Extract leads from these forum posts. Return JSON array:
[{"forum_post_id":"id","items":[{"lead_type":"theory|system|evidence|lore|mechanic","title":"short title max 80 chars","summary":"1-3 sentences of the actual finding, not meta-commentary","systems_mentioned":["System"],"confidence":"low|medium|high","group":"Broad Theory Group Name"}]}]

Skip posts with no substantive content. Posts:\n${postsText}` }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          // Batch all lead inserts into one call
          const leadsToInsert: Array<{ forum_post_id: string; lead_type: string; title: string; summary: string; systems_mentioned: string[]; confidence: string; original_author: string; source_url: string }> = [];
          for (const r of results) {
            const post = posts.find(p => p.forum_post_id === r.forum_post_id);
            if (!post) continue;
            for (const item of r.items) {
              leadsToInsert.push({
                forum_post_id: post.id,
                lead_type: item.lead_type,
                title: item.title,
                summary: item.summary,
                systems_mentioned: item.systems_mentioned ?? [],
                confidence: item.confidence ?? "low",
                original_author: post.author_name,
                source_url: `https://forums.frontier.co.uk/threads/168253/post-${post.forum_post_id}`,
              });
            }
          }
          if (leadsToInsert.length > 0) {
            await supabase.from("extracted_leads").insert(leadsToInsert);
            totalExtracted += leadsToInsert.length;
          }
        }
      }

      await supabase.from("forum_posts").update({ ai_processed: true, ai_processed_at: new Date().toISOString() }).in("id", posts.map(p => p.id));
      totalProcessed += posts.length;
    } catch {
      // Mark as processed to avoid infinite loops on bad posts
      await supabase.from("forum_posts").update({ ai_processed: true, ai_processed_at: new Date().toISOString() }).in("id", posts.map(p => p.id));
      totalProcessed += posts.length;
    }
  }

  const { count: stillRemaining } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("ai_processed", false);

  return NextResponse.json({
    processed: totalProcessed,
    extracted: totalExtracted,
    batches: batchNum,
    remaining: stillRemaining ?? 0,
    startedWith: remaining ?? 0,
  });
}
