import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT, BATCH_PROMPT } from "./prompts.js";

// --- Config ---
const BATCH_SIZE = 20;        // Posts per API call
const BATCHES_PER_RUN = 25;   // 500 posts per run
const DELAY_BETWEEN_CALLS = 1000; // 1s between API calls

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

// --- Types ---
interface ExtractedItem {
  lead_type: string;
  title: string;
  summary: string;
  systems_mentioned: string[];
  coordinates: Record<string, number> | null;
  confidence: string;
}

interface PostExtraction {
  forum_post_id: string;
  items: ExtractedItem[];
}

// --- Main ---
async function main() {
  // Get unprocessed posts
  const { data: unprocessedCount } = await supabase
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("ai_processed", false);

  console.log(`\n=== Raxxla Thread Classifier ===`);
  console.log(`Unprocessed posts remaining: ${unprocessedCount}\n`);

  let totalExtracted = 0;
  let totalProcessed = 0;

  for (let batch = 0; batch < BATCHES_PER_RUN; batch++) {
    // Fetch next batch of unprocessed posts
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

    console.log(`Batch ${batch + 1}/${BATCHES_PER_RUN}: Processing ${posts.length} posts (pages ${posts[0].page_number}-${posts[posts.length - 1].page_number})`);

    // Build prompt with post content
    const postsText = posts.map((p, i) => {
      const header = `--- POST ${i + 1} ---`;
      const meta = `forum_post_id: ${p.forum_post_id} | Author: ${p.author_name} | Page: ${p.page_number} | #${p.post_number ?? "?"} | Date: ${p.posted_at ?? "unknown"}`;
      // Truncate very long posts
      const content = p.content_text.length > 2000
        ? p.content_text.substring(0, 2000) + "\n[...truncated]"
        : p.content_text;
      return `${header}\n${meta}\n${content}\n`;
    }).join("\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: BATCH_PROMPT + postsText,
          },
        ],
      });

      // Extract JSON from response
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log("  No JSON found in response, marking as processed");
      } else {
        const extractions: PostExtraction[] = JSON.parse(jsonMatch[0]);

        // Store extracted leads
        for (const extraction of extractions) {
          // Find the DB id for this forum_post_id
          const post = posts.find((p) => p.forum_post_id === extraction.forum_post_id);
          if (!post) continue;

          for (const item of extraction.items) {
            const sourceUrl = `https://forums.frontier.co.uk/threads/168253/post-${post.forum_post_id}`;
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

            if (insertError) {
              console.error(`  Insert error: ${insertError.message}`);
            } else {
              totalExtracted++;
            }
          }
        }

        console.log(`  Extracted ${extractions.reduce((sum, e) => sum + e.items.length, 0)} leads from ${extractions.length} posts`);
      }

      // Mark all posts in this batch as processed
      const postIds = posts.map((p) => p.id);
      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", postIds);

      totalProcessed += posts.length;

      // Token usage
      console.log(`  Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  API error: ${msg}`);
      // Mark as processed anyway to avoid infinite loops
      const postIds = posts.map((p) => p.id);
      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", postIds);
    }

    // Delay
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS));
  }

  console.log(`\nDone. Processed: ${totalProcessed} posts, Extracted: ${totalExtracted} leads`);
}

main().catch(console.error);
