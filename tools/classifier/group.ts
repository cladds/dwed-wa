import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// --- Config ---
const BATCH_SIZE = 50;

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

async function main() {
  console.log("\n=== Theory Grouper ===\n");

  // Get approved leads that haven't been grouped into theories yet
  const { data: ungrouped, error } = await supabase
    .from("extracted_leads")
    .select("id, title, summary, lead_type, systems_mentioned, confidence, original_author, source_url")
    .is("theory_id", null)
    .eq("status", "imported")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error(`DB error: ${error.message}`);
    return;
  }

  if (!ungrouped || ungrouped.length === 0) {
    console.log("No ungrouped leads to process.");
    return;
  }

  console.log(`${ungrouped.length} ungrouped leads to cluster\n`);

  // Get existing theories for matching
  const { data: existingTheories } = await supabase
    .from("theories")
    .select("id, title, slug, category, systems_mentioned");

  const theoriesList = (existingTheories ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
  }));

  // Build the leads summary for Claude
  const leadsText = ungrouped.map((lead, i) => {
    return `[${i}] ${lead.lead_type.toUpperCase()} | ${lead.title}\n    ${lead.summary.substring(0, 200)}\n    Systems: ${(lead.systems_mentioned ?? []).join(", ") || "none"}`;
  }).join("\n\n");

  const existingText = theoriesList.length > 0
    ? theoriesList.map((t) => `- "${t.title}" (${t.category})`).join("\n")
    : "(no existing theories yet)";

  const prompt = `You are grouping investigation leads about Raxxla from Elite Dangerous into coherent theories.

EXISTING THEORIES:
${existingText}

UNGROUPED LEADS:
${leadsText}

Group these leads into theories. Be VERY aggressive about merging. If leads share the same broad topic, system, or investigation angle, they belong together.

Examples of leads that MUST be merged:
- "Raxxla access via permits" + "Raxxla locked behind conditions" = one theory about access mechanisms
- "Dark Wheel missions in system X" + "Dark Wheel missions in system Y" = one theory about Dark Wheel missions
- Any lore references about the same topic = one theory

Rules:
- If a lead could fit an existing theory, assign it there (use the exact existing title)
- Aim for BROAD umbrella theories, not narrow specific ones
- 5-15 theories total is ideal, not 50 separate ones
- Give each new theory a clear, concise title (max 60 chars)
- Choose a category: theory | system | lore | mechanic | evidence
- Write a 1-2 sentence summary that synthesizes all grouped leads

Return JSON:
\`\`\`json
[
  {
    "theory_title": "SAP 8 Core Container Investigation",
    "category": "mechanic",
    "summary": "Investigation into SAP 8 Core containers delivered via Dark Wheel missions, their cryptographic significance, and the systems involved in the delivery network.",
    "is_existing": false,
    "lead_indices": [0, 3, 7]
  }
]
\`\`\`

For existing theories, set is_existing: true and use the exact title.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("No JSON found in response");
      return;
    }

    interface GroupResult {
      theory_title: string;
      category: string;
      summary: string;
      is_existing: boolean;
      lead_indices: number[];
    }

    const groups: GroupResult[] = JSON.parse(jsonMatch[0]);
    console.log(`Claude grouped into ${groups.length} theories\n`);

    let created = 0;
    let linked = 0;

    for (const group of groups) {
      let theoryId: string;

      if (group.is_existing) {
        // Find existing theory
        const existing = theoriesList.find((t) => t.title === group.theory_title);
        if (!existing) {
          console.log(`  Warning: existing theory "${group.theory_title}" not found, creating new`);
          group.is_existing = false;
        } else {
          theoryId = existing.id;
          console.log(`  Linking ${group.lead_indices.length} leads to existing: "${group.theory_title}"`);
        }
      }

      if (!group.is_existing) {
        // Collect all systems from grouped leads
        const allSystems = new Set<string>();
        for (const idx of group.lead_indices) {
          const lead = ungrouped[idx];
          if (lead?.systems_mentioned) {
            lead.systems_mentioned.forEach((s: string) => allSystems.add(s));
          }
        }

        // Get first lead's author for attribution
        const firstLead = ungrouped[group.lead_indices[0]];

        const slug = slugify(group.theory_title);
        const { data: newTheory, error: insertErr } = await supabase
          .from("theories")
          .insert({
            title: group.theory_title,
            slug: slug + "-" + Date.now().toString(36),
            summary: group.summary,
            category: group.category,
            source: "forum",
            systems_mentioned: Array.from(allSystems),
            source_post_count: group.lead_indices.length,
            evidence_count: group.lead_indices.length,
            original_author: firstLead?.original_author ?? null,
            source_url: firstLead?.source_url ?? null,
          })
          .select("id")
          .single();

        if (insertErr) {
          console.error(`  Error creating theory: ${insertErr.message}`);
          continue;
        }

        theoryId = newTheory!.id;
        created++;
        console.log(`  Created theory: "${group.theory_title}" (${group.lead_indices.length} leads)`);
      }

      // Link leads to theory
      for (const idx of group.lead_indices) {
        const lead = ungrouped[idx];
        if (!lead) continue;

        await supabase
          .from("extracted_leads")
          .update({ theory_id: theoryId! })
          .eq("id", lead.id);

        linked++;
      }

      // Update theory counts
      const { count } = await supabase
        .from("extracted_leads")
        .select("id", { count: "exact", head: true })
        .eq("theory_id", theoryId!);

      await supabase
        .from("theories")
        .update({
          evidence_count: count ?? 0,
          source_post_count: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", theoryId!);
    }

    console.log(`\nDone. Created ${created} theories, linked ${linked} leads.`);
    console.log(`Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

  } catch (err) {
    console.error(`API error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

main().catch(console.error);
