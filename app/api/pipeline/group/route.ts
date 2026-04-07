import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

export async function POST() {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: allLeads } = await supabase
    .from("extracted_leads")
    .select("id, title, summary, lead_type, systems_mentioned, confidence, original_author, source_url")
    .is("theory_id", null)
    .order("created_at", { ascending: true });

  if (!allLeads || allLeads.length === 0) {
    return NextResponse.json({ theoriesCreated: 0, leadsGrouped: 0 });
  }

  // Also fetch existing theories so we can merge into them
  const { data: existingTheories } = await supabase
    .from("theories")
    .select("id, title, category, summary, systems_mentioned, evidence_count");

  const existingMap = new Map<string, string>();
  for (const t of existingTheories ?? []) {
    existingMap.set(t.title.toLowerCase(), t.id);
  }

  const CHUNK_SIZE = 80;
  const allTheories = new Map<string, {
    title: string;
    category: string;
    summary: string;
    leadIds: string[];
    systems: Set<string>;
    firstAuthor: string | null;
    firstUrl: string | null;
    existingId: string | null;
  }>();

  // Seed with existing theories
  for (const t of existingTheories ?? []) {
    allTheories.set(t.title, {
      title: t.title,
      category: t.category,
      summary: t.summary,
      leadIds: [],
      systems: new Set(t.systems_mentioned ?? []),
      firstAuthor: null,
      firstUrl: null,
      existingId: t.id,
    });
  }

  for (let i = 0; i < allLeads.length; i += CHUNK_SIZE) {
    const chunk = allLeads.slice(i, i + CHUNK_SIZE);
    const existingNames = Array.from(allTheories.keys());
    const existingCtx = existingNames.length > 0
      ? `\nExisting theories (REUSE these names when a lead fits):\n${existingNames.map(t => `- "${t}"`).join("\n")}\n`
      : "";

    const leadsText = chunk.map((l, idx) =>
      `[${idx}] ${l.lead_type.toUpperCase()} | ${l.title}\n    ${l.summary.substring(0, 200)}\n    Systems: ${(l.systems_mentioned ?? []).join(", ") || "none"}\n    Author: ${l.original_author ?? "unknown"}`
    ).join("\n\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: `Group these Raxxla investigation leads into broad umbrella theories.
${existingCtx}
RULES:
- Merge AGGRESSIVELY. Aim for 15-30 total theories across the entire dataset, not per chunk.
- ALWAYS reuse an existing theory name if the lead is even loosely related.
- Theories should be broad: "Raxxla Location Theories" not "Raxxla might be in System X".
- Each lead MUST be assigned to exactly one theory.
- If a lead is low-quality noise, still assign it to the closest theory.
- Write a good 2-3 sentence summary for new theories explaining what the investigation thread is about.

Known major Raxxla theory areas:
- Raxxla Location Theories (where Raxxla physically is)
- Dark Wheel Faction & Missions (faction activities, trust-building)
- Witchspace & Hyperspace Anomalies (jump mechanics, misjumps)
- Lore & Developer Clues (Braben quotes, novels, easter eggs)
- Permit-Locked Systems (restricted access, unknown permits)
- Game Mechanics & Scanning (FSS, probing, undiscovered signals)
- Constellation & Star Patterns (stellar alignments, navigation clues)
- Formidine Rift & Generation Ships (related deep-space mysteries)
- Codex & Listening Posts (in-game data sources and clues)
- The Club & Powerplay (political factions, conspiracy)
- Historical Expeditions & Community Findings (organized searches, results)

Leads:\n${leadsText}\n\nReturn JSON: [{"theory_title":"exact name","category":"theory|system|lore|mechanic|evidence","summary":"2-3 sentences if new theory","is_existing":true/false,"lead_indices":[0,3,7]}]` }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const groups = JSON.parse(jsonMatch[0]);
          for (const group of groups) {
            const key = group.theory_title;
            if (!allTheories.has(key)) {
              // Check case-insensitive match against existing
              const existingId = existingMap.get(key.toLowerCase()) ?? null;
              const first = chunk[group.lead_indices?.[0]];
              allTheories.set(key, {
                title: key,
                category: group.category,
                summary: group.summary || key,
                leadIds: [],
                systems: new Set(),
                firstAuthor: first?.original_author ?? null,
                firstUrl: first?.source_url ?? null,
                existingId,
              });
            }
            const theory = allTheories.get(key)!;
            for (const idx of group.lead_indices ?? []) {
              const lead = chunk[idx];
              if (lead) {
                theory.leadIds.push(lead.id);
                (lead.systems_mentioned ?? []).forEach((s: string) => theory.systems.add(s));
              }
            }
          }
        }
      }
    } catch { /* continue to next chunk */ }
  }

  let theoriesCreated = 0;
  let theoriesUpdated = 0;
  let leadsGrouped = 0;

  for (const theory of Array.from(allTheories.values())) {
    if (theory.leadIds.length === 0) continue;

    if (theory.existingId) {
      // Update existing theory
      const { data: current } = await supabase.from("theories").select("systems_mentioned, evidence_count, source_post_count").eq("id", theory.existingId).single();
      const mergedSystems = Array.from(new Set([...(current?.systems_mentioned ?? []), ...Array.from(theory.systems)]));

      await supabase.from("theories").update({
        systems_mentioned: mergedSystems,
        evidence_count: (current?.evidence_count ?? 0) + theory.leadIds.length,
        source_post_count: (current?.source_post_count ?? 0) + theory.leadIds.length,
        updated_at: new Date().toISOString(),
      }).eq("id", theory.existingId);

      for (const leadId of theory.leadIds) {
        await supabase.from("extracted_leads").update({ theory_id: theory.existingId, status: "imported" }).eq("id", leadId);
        leadsGrouped++;
      }
      theoriesUpdated++;
    } else {
      // Create new theory
      const slug = slugify(theory.title) + "-" + Date.now().toString(36);
      const { data: newTheory } = await supabase.from("theories").insert({
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
      }).select("id").single();

      if (newTheory) {
        theoriesCreated++;
        for (const leadId of theory.leadIds) {
          await supabase.from("extracted_leads").update({ theory_id: newTheory.id, status: "imported" }).eq("id", leadId);
          leadsGrouped++;
        }
      }
    }
  }

  return NextResponse.json({ theoriesCreated, theoriesUpdated, leadsGrouped, totalTheories: allTheories.size });
}
