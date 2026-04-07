import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = 30;
const MAX_BATCHES = 50; // Safety cap per request

export async function POST() {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let totalProcessed = 0;
  let totalExtracted = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("id, forum_post_id, author_name, content_text, posted_at, page_number, post_number")
      .eq("ai_processed", false)
      .order("page_number", { ascending: true })
      .limit(BATCH_SIZE);

    if (!posts || posts.length === 0) break;

    const postsText = posts.map((p, i) => {
      const content = p.content_text.length > 1500 ? p.content_text.substring(0, 1500) + "\n[...truncated]" : p.content_text;
      return `--- POST ${i + 1} ---\nid: ${p.forum_post_id} | ${p.author_name} | p.${p.page_number} #${p.post_number ?? "?"}\n${content}`;
    }).join("\n\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system: "You extract investigation leads from Elite Dangerous Raxxla forum posts. Be selective: skip casual chat. Only extract posts with theories, system names, evidence, or lore analysis.",
          messages: [{ role: "user", content: `Extract leads. Return JSON: [{"forum_post_id":"id","items":[{"lead_type":"theory|system|evidence|lore|mechanic","title":"short","summary":"1-3 sentences","systems_mentioned":["System"],"confidence":"low|medium|high"}]}]\n\nPosts:\n${postsText}` }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          for (const r of results) {
            const post = posts.find(p => p.forum_post_id === r.forum_post_id);
            if (!post) continue;
            for (const item of r.items) {
              await supabase.from("extracted_leads").insert({
                forum_post_id: post.id,
                lead_type: item.lead_type,
                title: item.title,
                summary: item.summary,
                systems_mentioned: item.systems_mentioned ?? [],
                confidence: item.confidence ?? "low",
                original_author: post.author_name,
                source_url: `https://forums.frontier.co.uk/threads/168253/post-${post.forum_post_id}`,
              });
              totalExtracted++;
            }
          }
        }
      }

      await supabase.from("forum_posts").update({ ai_processed: true, ai_processed_at: new Date().toISOString() }).in("id", posts.map(p => p.id));
      totalProcessed += posts.length;
    } catch {
      await supabase.from("forum_posts").update({ ai_processed: true, ai_processed_at: new Date().toISOString() }).in("id", posts.map(p => p.id));
      totalProcessed += posts.length;
    }
  }

  return NextResponse.json({ processed: totalProcessed, extracted: totalExtracted });
}
