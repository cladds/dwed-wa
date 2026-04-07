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

  const CHUNK_SIZE = 80;
  const allTheories = new Map<string, { title: string; category: string; summary: string; leadIds: string[]; systems: Set<string>; firstAuthor: string | null; firstUrl: string | null }>();

  for (let i = 0; i < allLeads.length; i += CHUNK_SIZE) {
    const chunk = allLeads.slice(i, i + CHUNK_SIZE);
    const existingNames = Array.from(allTheories.keys());
    const existingCtx = existingNames.length > 0 ? `\nExisting theories:\n${existingNames.map(t => `- "${t}"`).join("\n")}\n` : "";

    const leadsText = chunk.map((l, idx) => `[${idx}] ${l.lead_type.toUpperCase()} | ${l.title}\n    ${l.summary.substring(0, 150)}\n    Systems: ${(l.systems_mentioned ?? []).join(", ") || "none"}`).join("\n\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: `Group Raxxla investigation leads into broad umbrella theories.${existingCtx}\nRules: merge aggressively, aim for 10-20 total theories, reuse existing names.\n\nLeads:\n${leadsText}\n\nReturn JSON: [{"theory_title":"...","category":"theory|system|lore|mechanic|evidence","summary":"...","is_existing":true/false,"lead_indices":[0,3,7]}]` }],
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
              const first = chunk[group.lead_indices[0]];
              allTheories.set(key, { title: key, category: group.category, summary: group.summary, leadIds: [], systems: new Set(), firstAuthor: first?.original_author ?? null, firstUrl: first?.source_url ?? null });
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
        }
      }
    } catch { /* continue */ }
  }

  let theoriesCreated = 0;
  let leadsGrouped = 0;

  for (const [, theory] of allTheories) {
    const slug = slugify(theory.title) + "-" + Date.now().toString(36);
    const { data: newTheory } = await supabase.from("theories").insert({
      title: theory.title, slug, summary: theory.summary, category: theory.category,
      source: "forum", systems_mentioned: Array.from(theory.systems),
      source_post_count: theory.leadIds.length, evidence_count: theory.leadIds.length,
      original_author: theory.firstAuthor, source_url: theory.firstUrl,
    }).select("id").single();

    if (newTheory) {
      theoriesCreated++;
      for (const leadId of theory.leadIds) {
        await supabase.from("extracted_leads").update({ theory_id: newTheory.id, status: "imported" }).eq("id", leadId);
        leadsGrouped++;
      }
    }
  }

  return NextResponse.json({ theoriesCreated, leadsGrouped });
}
