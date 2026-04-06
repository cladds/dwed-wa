import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

export async function POST() {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check rank
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: operative } = await supabase
    .from("operatives")
    .select("rank")
    .eq("discord_id", user.user_metadata.provider_id ?? user.id)
    .single();

  if (!operative || !["lead_investigator", "director"].includes(operative.rank)) {
    return NextResponse.json({ error: "Insufficient rank" }, { status: 403 });
  }

  // Get approved leads without a theory
  const { data: ungrouped } = await supabase
    .from("extracted_leads")
    .select("id, title, summary, lead_type, systems_mentioned, confidence, original_author, source_url")
    .is("theory_id", null)
    .eq("status", "imported")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!ungrouped || ungrouped.length === 0) {
    return NextResponse.json({ message: "No ungrouped leads", grouped: 0 });
  }

  // Get existing theories
  const { data: existingTheories } = await supabase
    .from("theories")
    .select("id, title, slug, category, systems_mentioned");

  const theoriesList = (existingTheories ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
  }));

  const leadsText = ungrouped.map((lead, i) => {
    return `[${i}] ${lead.lead_type.toUpperCase()} | ${lead.title}\n    ${lead.summary.substring(0, 200)}\n    Systems: ${(lead.systems_mentioned ?? []).join(", ") || "none"}`;
  }).join("\n\n");

  const existingText = theoriesList.length > 0
    ? theoriesList.map((t) => `- "${t.title}" (${t.category})`).join("\n")
    : "(no existing theories yet)";

  // Call Claude to group
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are grouping Raxxla investigation leads from Elite Dangerous into theories.

EXISTING THEORIES:
${existingText}

UNGROUPED LEADS:
${leadsText}

Group related leads into theories. If a lead matches an existing theory, assign it there (exact title). Otherwise create a new theory grouping similar leads.

Rules:
- Merge aggressively: prefer fewer theories with more leads
- Each new theory needs: title (max 60 chars), category (theory|system|lore|mechanic|evidence), summary (1-2 sentences synthesizing the grouped leads)
- For existing theories, set is_existing: true with the exact title

Return JSON array:
[{"theory_title": "...", "category": "...", "summary": "...", "is_existing": false, "lead_indices": [0, 3, 7]}]`,
      }],
    }),
  });

  if (!claudeRes.ok) {
    return NextResponse.json({ error: "Claude API error" }, { status: 500 });
  }

  const claudeData = await claudeRes.json();
  const responseText = claudeData.content?.[0]?.text ?? "";
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    return NextResponse.json({ error: "No groups found" }, { status: 500 });
  }

  interface GroupResult {
    theory_title: string;
    category: string;
    summary: string;
    is_existing: boolean;
    lead_indices: number[];
  }

  const groups: GroupResult[] = JSON.parse(jsonMatch[0]);
  let created = 0;
  let linked = 0;

  for (const group of groups) {
    let theoryId: string | undefined;

    if (group.is_existing) {
      const existing = theoriesList.find((t) => t.title === group.theory_title);
      if (existing) {
        theoryId = existing.id;
      }
    }

    if (!theoryId) {
      const allSystems = new Set<string>();
      for (const idx of group.lead_indices) {
        ungrouped[idx]?.systems_mentioned?.forEach((s: string) => allSystems.add(s));
      }

      const firstLead = ungrouped[group.lead_indices[0]];
      const slug = slugify(group.theory_title) + "-" + Date.now().toString(36);

      const { data: newTheory } = await supabase
        .from("theories")
        .insert({
          title: group.theory_title,
          slug,
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

      if (newTheory) {
        theoryId = newTheory.id;
        created++;
      }
    }

    if (theoryId) {
      for (const idx of group.lead_indices) {
        const lead = ungrouped[idx];
        if (!lead) continue;
        await supabase
          .from("extracted_leads")
          .update({ theory_id: theoryId })
          .eq("id", lead.id);
        linked++;
      }

      // Update counts
      const { count } = await supabase
        .from("extracted_leads")
        .select("id", { count: "exact", head: true })
        .eq("theory_id", theoryId);

      await supabase
        .from("theories")
        .update({
          evidence_count: count ?? 0,
          source_post_count: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", theoryId);
    }
  }

  return NextResponse.json({ created, linked, groups: groups.length });
}
