import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CHUNK_SIZE = 40;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

export async function POST() {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get one chunk of ungrouped leads
  const { data: chunk, count: totalRemaining } = await supabase
    .from("extracted_leads")
    .select("id, title, summary, lead_type, systems_mentioned, confidence, original_author, source_url", { count: "exact" })
    .is("theory_id", null)
    .order("created_at", { ascending: true })
    .limit(CHUNK_SIZE);

  if (!chunk || chunk.length === 0) {
    return NextResponse.json({ theoriesCreated: 0, theoriesUpdated: 0, leadsGrouped: 0, remaining: 0 });
  }

  // Fetch existing theories for merging
  const { data: existingTheories } = await supabase
    .from("theories")
    .select("id, title, category, summary, systems_mentioned, evidence_count, source_post_count");

  const existingMap = new Map<string, string>();
  for (const t of existingTheories ?? []) {
    existingMap.set(t.title.toLowerCase(), t.id);
  }

  const existingNames = (existingTheories ?? []).map(t => t.title);
  const existingCtx = existingNames.length > 0
    ? `\nExisting theories (REUSE these names when a lead fits):\n${existingNames.map(t => `- "${t}"`).join("\n")}\n`
    : "";

  const leadsText = chunk.map((l, idx) =>
    `[${idx}] ${l.lead_type.toUpperCase()} | ${l.title}\n    ${l.summary.substring(0, 200)}\n    Systems: ${(l.systems_mentioned ?? []).join(", ") || "none"}`
  ).join("\n\n");

  let theoriesCreated = 0;
  let theoriesUpdated = 0;
  let leadsGrouped = 0;

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
- Merge AGGRESSIVELY. Aim for 15-30 total theories across the entire dataset.
- ALWAYS reuse an existing theory name if the lead is even loosely related.
- Theories should be broad: "Raxxla Location Theories" not "Raxxla might be in System X".
- Each lead MUST be assigned to exactly one theory.
- Write a good 2-3 sentence summary for new theories.

Known major Raxxla theory areas:
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
- Historical Expeditions & Community Findings

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
          const existingId = existingMap.get(key.toLowerCase()) ?? null;

          if (existingId) {
            // Update existing theory
            const existing = (existingTheories ?? []).find(t => t.id === existingId);
            const leadIds = (group.lead_indices ?? []).map((i: number) => chunk[i]).filter(Boolean);
            if (leadIds.length === 0) continue;

            const newSystems = new Set(existing?.systems_mentioned ?? []);
            for (const lead of leadIds) {
              for (const sys of lead.systems_mentioned ?? []) newSystems.add(sys);
            }

            await supabase.from("theories").update({
              systems_mentioned: Array.from(newSystems),
              evidence_count: (existing?.evidence_count ?? 0) + leadIds.length,
              source_post_count: (existing?.source_post_count ?? 0) + leadIds.length,
              updated_at: new Date().toISOString(),
            }).eq("id", existingId);

            const updates = leadIds.map((lead: { id: string }) =>
              supabase.from("extracted_leads").update({ theory_id: existingId, status: "imported" }).eq("id", lead.id)
            );
            await Promise.all(updates);
            leadsGrouped += leadIds.length;
            theoriesUpdated++;
          } else {
            // Create new theory
            const leadIds = (group.lead_indices ?? []).map((i: number) => chunk[i]).filter(Boolean);
            if (leadIds.length === 0) continue;

            const systems = new Set<string>();
            for (const lead of leadIds) {
              for (const sys of lead.systems_mentioned ?? []) systems.add(sys);
            }

            const slug = slugify(key) + "-" + Date.now().toString(36);
            const first = leadIds[0];
            const { data: newTheory } = await supabase.from("theories").insert({
              title: key,
              slug,
              summary: group.summary || key,
              category: group.category,
              source: "forum",
              systems_mentioned: Array.from(systems),
              source_post_count: leadIds.length,
              evidence_count: leadIds.length,
              original_author: first?.original_author ?? null,
              source_url: first?.source_url ?? null,
            }).select("id").single();

            if (newTheory) {
              theoriesCreated++;
              existingMap.set(key.toLowerCase(), newTheory.id);
              const updates = leadIds.map((lead: { id: string }) =>
                supabase.from("extracted_leads").update({ theory_id: newTheory.id, status: "imported" }).eq("id", lead.id)
              );
              await Promise.all(updates);
              leadsGrouped += leadIds.length;
            }
          }
        }
      }
    }
  } catch { /* continue */ }

  return NextResponse.json({
    theoriesCreated,
    theoriesUpdated,
    leadsGrouped,
    remaining: Math.max(0, (totalRemaining ?? 0) - leadsGrouped),
  });
}
