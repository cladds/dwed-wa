import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT, BATCH_PROMPT } from "./prompts.js";

// --- Config ---
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "30", 10);
const BATCHES_PER_RUN = parseInt(process.env.MAX_BATCHES ?? "50", 10);
const DELAY_BETWEEN_CALLS = 800;

// --- Clients ---
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!anthropicKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: anthropicKey });
const supabase = createClient(supabaseUrl, supabaseKey);

// Track groups across batches for consistency
const groupCounts = new Map<string, number>();

// --- Types ---
interface ExtractedItem {
  lead_type: string;
  title: string;
  summary: string;
  systems_mentioned: string[];
  coordinates: Record<string, number> | null;
  confidence: string;
  group: string;
}

interface PostExtraction {
  forum_post_id: string;
  items: ExtractedItem[];
}

// --- Main ---
async function main() {
  const { count } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("ai_processed", false);

  console.log(`\n=== Raxxla Thread Classifier ===`);
  console.log(`Unprocessed posts: ${count ?? "unknown"}`);
  console.log(`Config: ${BATCH_SIZE} posts/batch, ${BATCHES_PER_RUN} batches max\n`);

  let totalExtracted = 0;
  let totalProcessed = 0;
  let totalCost = 0;

  for (let batch = 0; batch < BATCHES_PER_RUN; batch++) {
    const { data: posts, error } = await supabase
      .from("forum_posts")
      .select("id, forum_post_id, author_name, content_text, posted_at, page_number, post_number")
      .eq("ai_processed", false)
      .order("page_number", { ascending: true })
      .order("post_number", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error(`DB error: ${error.message}`);
      break;
    }

    if (!posts || posts.length === 0) {
      console.log("No more unprocessed posts.");
      break;
    }

    const pageRange = `${posts[0].page_number}-${posts[posts.length - 1].page_number}`;
    process.stdout.write(`Batch ${batch + 1}/${BATCHES_PER_RUN}: ${posts.length} posts (p.${pageRange}) `);

    // Include existing group names for consistency
    const groupContext = groupCounts.size > 0
      ? `\nExisting theory groups so far: ${Array.from(groupCounts.entries()).map(([g, c]) => `"${g}" (${c})`).join(", ")}\nReuse these group names when applicable.\n`
      : "";

    const postsText = posts.map((p, i) => {
      const content = p.content_text.length > 1500
        ? p.content_text.substring(0, 1500) + "\n[...truncated]"
        : p.content_text;
      return `--- POST ${i + 1} ---\nforum_post_id: ${p.forum_post_id} | ${p.author_name} | p.${p.page_number} #${p.post_number ?? "?"} | ${p.posted_at ?? "?"}\n${content}\n`;
    }).join("\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: groupContext + BATCH_PROMPT + postsText,
        }],
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      let batchExtracted = 0;

      if (jsonMatch) {
        const extractions: PostExtraction[] = JSON.parse(jsonMatch[0]);

        for (const extraction of extractions) {
          const post = posts.find((p) => p.forum_post_id === extraction.forum_post_id);
          if (!post) continue;

          for (const item of extraction.items) {
            const sourceUrl = `https://forums.frontier.co.uk/threads/168253/post-${post.forum_post_id}`;

            // Track group for cross-batch consistency
            const group = item.group ?? "Uncategorised";
            groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);

            const { error: insertError } = await supabase
              .from("extracted_leads")
              .insert({
                forum_post_id: post.id,
                lead_type: item.lead_type,
                title: item.title,
                summary: item.summary,
                systems_mentioned: item.systems_mentioned ?? [],
                coordinates: item.coordinates,
                confidence: item.confidence ?? "low",
                original_author: post.author_name,
                source_url: sourceUrl,
              });

            if (!insertError) {
              batchExtracted++;
              totalExtracted++;
            }
          }
        }
      }

      // Mark batch as processed
      const postIds = posts.map((p) => p.id);
      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", postIds);

      totalProcessed += posts.length;

      const inputCost = (response.usage.input_tokens / 1000000) * 0.25;
      const outputCost = (response.usage.output_tokens / 1000000) * 1.25;
      totalCost += inputCost + outputCost;

      console.log(`-> ${batchExtracted} leads | ${response.usage.input_tokens}/${response.usage.output_tokens} tokens | $${(inputCost + outputCost).toFixed(4)}`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`-> ERROR: ${msg}`);
      // Mark as processed to avoid loops
      const postIds = posts.map((p) => p.id);
      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", postIds);
      totalProcessed += posts.length;
    }

    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${totalProcessed} posts`);
  console.log(`Extracted: ${totalExtracted} leads`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);

  if (groupCounts.size > 0) {
    console.log(`\nTheory groups found:`);
    const sorted = Array.from(groupCounts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [group, count] of sorted) {
      console.log(`  ${count}x ${group}`);
    }
  }
}

main().catch(console.error);
