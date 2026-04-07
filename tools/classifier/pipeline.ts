import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * Full pipeline: pre-scan -> group -> generate theory summaries -> insert
 *
 * Run after scraping is complete.
 *
 * Step 1: Pre-scan all unprocessed posts, extract leads with theme tags
 * Step 2: Batch all leads, cluster into umbrella theories
 * Step 3: Generate clean summaries for each theory
 * Step 4: Insert theories + linked leads into the theories table
 */

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!anthropicKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: anthropicKey });
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

// ============================================================
// STEP 1: Pre-scan posts into extracted_leads
// ============================================================
async function prescan() {
  console.log("\n=== STEP 1: Pre-scan posts ===\n");

  const BATCH_SIZE = 30;
  let totalProcessed = 0;
  let totalExtracted = 0;
  let batch = 0;

  while (true) {
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("id, forum_post_id, author_name, content_text, posted_at, page_number, post_number")
      .eq("ai_processed", false)
      .order("page_number", { ascending: true })
      .limit(BATCH_SIZE);

    if (!posts || posts.length === 0) break;
    batch++;

    const pageRange = `${posts[0].page_number}-${posts[posts.length - 1].page_number}`;
    process.stdout.write(`Batch ${batch}: ${posts.length} posts (p.${pageRange}) `);

    const postsText = posts.map((p, i) => {
      const content = p.content_text.length > 1500
        ? p.content_text.substring(0, 1500) + "\n[...truncated]"
        : p.content_text;
      return `--- POST ${i + 1} ---\nid: ${p.forum_post_id} | ${p.author_name} | p.${p.page_number} #${p.post_number ?? "?"} | ${p.posted_at ?? "?"}\n${content}`;
    }).join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: `You extract investigation leads from Elite Dangerous Raxxla forum posts. Be selective: skip casual chat, agreements, off-topic. Only extract posts with actual theories, system names, evidence, or lore analysis. Strip quoted text and signatures.`,
        messages: [{
          role: "user",
          content: `Extract leads from these posts. Return JSON array:
[{"forum_post_id":"id","items":[{"lead_type":"theory|system|evidence|lore|mechanic","title":"short title","summary":"1-3 sentences","systems_mentioned":["System"],"confidence":"low|medium|high","theme":"broad theme tag"}]}]

Theme tags should be broad: "access-mechanisms", "dark-wheel-faction", "witchspace", "developer-clues", "system-investigation", "game-mechanics", "stellar-cartography", "formidine-rift", "codex-data", "lore-analysis", "permit-systems", "npc-tracking", "mission-chains"

Posts:\n\n${postsText}`,
        }],
      });

      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      let extracted = 0;

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
              coordinates: item.coordinates ?? null,
              confidence: item.confidence ?? "low",
              original_author: post.author_name,
              source_url: `https://forums.frontier.co.uk/threads/168253/post-${post.forum_post_id}`,
            });
            extracted++;
          }
        }
      }

      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", posts.map(p => p.id));

      totalProcessed += posts.length;
      totalExtracted += extracted;
      console.log(`-> ${extracted} leads`);

    } catch (err) {
      console.log(`-> ERROR: ${err instanceof Error ? err.message : String(err)}`);
      await supabase
        .from("forum_posts")
        .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
        .in("id", posts.map(p => p.id));
      totalProcessed += posts.length;
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nPre-scan complete: ${totalProcessed} posts, ${totalExtracted} leads\n`);
}

// ============================================================
// STEP 2: Batch group all leads into umbrella theories
// ============================================================
async function groupAll() {
  console.log("\n=== STEP 2: Group leads into theories ===\n");

  // Get ALL extracted leads that aren't in a theory yet
  const { data: allLeads } = await supabase
    .from("extracted_leads")
    .select("id, title, summary, lead_type, systems_mentioned, confidence, original_author, source_url")
    .is("theory_id", null)
    .order("created_at", { ascending: true });

  if (!allLeads || allLeads.length === 0) {
    console.log("No ungrouped leads.");
    return;
  }

  console.log(`${allLeads.length} leads to group\n`);

  // Process in chunks of 80 for the grouper
  const CHUNK_SIZE = 80;
  const allTheories = new Map<string, { title: string; category: string; summary: string; leadIds: string[]; systems: Set<string>; firstAuthor: string | null; firstUrl: string | null }>();

  for (let i = 0; i < allLeads.length; i += CHUNK_SIZE) {
    const chunk = allLeads.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(allLeads.length / CHUNK_SIZE);

    process.stdout.write(`Chunk ${chunkNum}/${totalChunks} (${chunk.length} leads) `);

    const existingTheoryNames = Array.from(allTheories.keys());
    const existingContext = existingTheoryNames.length > 0
      ? `\nExisting theories to merge into:\n${existingTheoryNames.map(t => `- "${t}"`).join("\n")}\n`
      : "";

    const leadsText = chunk.map((l, idx) => {
      return `[${idx}] ${l.lead_type.toUpperCase()} | ${l.title}\n    ${l.summary.substring(0, 150)}\n    Systems: ${(l.systems_mentioned ?? []).join(", ") || "none"}`;
    }).join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `Group these Raxxla investigation leads into broad umbrella theories.
${existingContext}
Rules:
- Merge aggressively into BROAD topics (aim for 10-20 total theories)
- Reuse existing theory names when leads fit
- Each theory: title (max 60 chars), category (theory|system|lore|mechanic|evidence), summary (2 sentences)

Leads:\n${leadsText}\n\nReturn JSON: [{"theory_title":"...","category":"...","summary":"...","is_existing":true/false,"lead_indices":[0,3,7]}]`,
        }],
      });

      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const groups = JSON.parse(jsonMatch[0]);
        for (const group of groups) {
          const key = group.theory_title;
          if (!allTheories.has(key)) {
            const firstLead = chunk[group.lead_indices[0]];
            allTheories.set(key, {
              title: key,
              category: group.category,
              summary: group.summary,
              leadIds: [],
              systems: new Set(),
              firstAuthor: firstLead?.original_author ?? null,
              firstUrl: firstLead?.source_url ?? null,
            });
          }
          const theory = allTheories.get(key)!;
          for (const idx of group.lead_indices) {
            const lead = chunk[idx];
            if (lead) {
              theory.leadIds.push(lead.id);
              (lead.systems_mentioned ?? []).forEach((s: string) => theory.systems.add(s));
            }
          }
        }
        console.log(`-> ${groups.length} groups`);
      } else {
        console.log(`-> no groups`);
      }

    } catch (err) {
      console.log(`-> ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  // Now insert all theories
  console.log(`\nCreating ${allTheories.size} theories...\n`);

  for (const [title, theory] of allTheories) {
    const slug = slugify(title) + "-" + Date.now().toString(36);

    const { data: newTheory } = await supabase
      .from("theories")
      .insert({
        title: theory.title,
        slug,
        summary: theory.summary,
        category: theory.category,
        source: "forum",
        systems_mentioned: Array.from(theory.systems),
        source_post_count: theory.leadIds.length,
        evidence_count: theory.leadIds.length,
        original_author: theory.firstAuthor,
        source_url: theory.firstUrl,
      })
      .select("id")
      .single();

    if (newTheory) {
      // Link leads to theory and mark as imported
      for (const leadId of theory.leadIds) {
        await supabase
          .from("extracted_leads")
          .update({ theory_id: newTheory.id, status: "imported" })
          .eq("id", leadId);
      }
      console.log(`  "${title}" (${theory.leadIds.length} leads, ${theory.systems.size} systems)`);
    }
  }

  console.log(`\nGrouping complete: ${allTheories.size} theories created\n`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const step = process.argv[2] ?? "all";

  if (step === "prescan" || step === "all") {
    await prescan();
  }

  if (step === "group" || step === "all") {
    await groupAll();
  }

  // Auto-populate system cache for galaxy map
  if (step === "all" || step === "group") {
    console.log("=== Populating system cache ===");
    const { data: theories } = await supabase.from("theories").select("systems_mentioned");
    const allSystems = new Set<string>();
    for (const t of theories ?? []) {
      for (const s of t.systems_mentioned ?? []) allSystems.add(s);
    }
    const { data: cached } = await supabase.from("system_cache").select("system_name");
    const existing = new Set((cached ?? []).map(c => c.system_name.toLowerCase()));
    const toFetch = Array.from(allSystems).filter(s => !existing.has(s.toLowerCase()));
    console.log(`${toFetch.length} new systems to look up on EDSM`);

    for (const sys of toFetch.slice(0, 50)) {
      try {
        const res = await fetch(`https://www.edsm.net/api-v1/system?systemName=${encodeURIComponent(sys)}&showCoordinates=1&showInformation=1`);
        if (res.ok) {
          const data = await res.json();
          if (data?.coords) {
            await supabase.from("system_cache").upsert({
              system_name: data.name,
              coord_x: data.coords.x,
              coord_y: data.coords.y,
              coord_z: data.coords.z,
              edsm_id: String(data.id ?? ""),
              id64: String(data.id64 ?? ""),
              allegiance: data.information?.allegiance ?? null,
              fetched_at: new Date().toISOString(),
            }, { onConflict: "system_name" });
            process.stdout.write(".");
          }
        }
        await new Promise(r => setTimeout(r, 1200));
      } catch { /* skip */ }
    }
    console.log(`\nDone.`);
  }
}

main().catch(console.error);
