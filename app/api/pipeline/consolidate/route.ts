import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST() {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get all theories with their counts
  const { data: theories } = await supabase
    .from("theories")
    .select("id, title, summary, category, evidence_count, source_post_count, systems_mentioned, priority")
    .order("evidence_count", { ascending: false })
    .limit(50);

  if (!theories || theories.length < 2) {
    return NextResponse.json({ merged: 0, prioritized: 0, message: "Not enough theories to consolidate" });
  }

  // Keep summaries short to fit within timeout
  const theorySummaries = theories.map((t, i) =>
    `[${i}] "${t.title}" (${t.category}) - ${t.evidence_count} evidence\n    ${t.summary.substring(0, 100)}`
  ).join("\n\n");

  let mergeInstructions: Array<{ keep: number; merge: number[]; newTitle?: string; newSummary?: string }> = [];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: `You are consolidating Raxxla investigation theories. Review this list and identify theories that should be MERGED because they cover the same topic.

Theories:\n${theorySummaries}

Rules:
- Merge theories that are clearly about the same topic (even if worded differently)
- Keep the theory with the most evidence as the primary
- Suggest a better title/summary if the merged result would benefit
- Do NOT merge theories that are genuinely different investigations
- Be aggressive: if two theories are about the same system or same lore topic, merge them

Also identify the TOP theories that should be flagged as major investigations. A major theory has:
- High evidence count (5+ items)
- Multiple unique systems mentioned
- Covers a well-known Raxxla investigation angle

Return JSON:
{
  "merges": [
    {"keep": 0, "merge": [3, 7], "new_title": "Better Title", "new_summary": "Improved summary"}
  ],
  "major_theories": [0, 1, 4]
}

"keep" is the index of the theory to keep. "merge" are indices to merge INTO it. "major_theories" are indices that should get high priority for the corkboard.` }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        mergeInstructions = result.merges ?? [];

        // Step 2: Auto-prioritize major theories
        let prioritized = 0;
        for (const idx of result.major_theories ?? []) {
          const theory = theories[idx];
          if (theory && (theory.priority ?? 0) === 0) {
            // Scale priority by evidence: 5-9 = 25, 10-19 = 50, 20+ = 75
            const autoPriority = theory.evidence_count >= 20 ? 75 : theory.evidence_count >= 10 ? 50 : 25;
            await supabase.from("theories").update({ priority: autoPriority }).eq("id", theory.id);
            prioritized++;
          }
        }

        // Step 3: Execute merges
        let merged = 0;
        for (const merge of mergeInstructions) {
          const keepTheory = theories[merge.keep];
          if (!keepTheory) continue;

          const mergeTheories = merge.merge.map(i => theories[i]).filter(Boolean);
          if (mergeTheories.length === 0) continue;

          // Move all extracted_leads from merge targets to keep target
          for (const source of mergeTheories) {
            await supabase.from("extracted_leads")
              .update({ theory_id: keepTheory.id })
              .eq("theory_id", source.id);

            // Move comments too
            await supabase.from("theory_comments")
              .update({ theory_id: keepTheory.id })
              .eq("theory_id", source.id);
          }

          // Merge systems
          const allSystems = new Set(keepTheory.systems_mentioned ?? []);
          for (const source of mergeTheories) {
            for (const sys of source.systems_mentioned ?? []) {
              allSystems.add(sys);
            }
          }

          // Update the kept theory
          const totalEvidence = keepTheory.evidence_count + mergeTheories.reduce((sum, t) => sum + t.evidence_count, 0);
          const totalPosts = keepTheory.source_post_count + mergeTheories.reduce((sum, t) => sum + t.source_post_count, 0);

          const updates: Record<string, unknown> = {
            systems_mentioned: Array.from(allSystems),
            evidence_count: totalEvidence,
            source_post_count: totalPosts,
            updated_at: new Date().toISOString(),
          };
          if (merge.newTitle) updates.title = merge.newTitle;
          if (merge.newSummary) updates.summary = merge.newSummary;

          await supabase.from("theories").update(updates).eq("id", keepTheory.id);

          // Delete theory_links referencing merged theories
          for (const source of mergeTheories) {
            await supabase.from("theory_links").delete().or(`theory_a_id.eq.${source.id},theory_b_id.eq.${source.id}`);
          }

          // Delete merged theories
          for (const source of mergeTheories) {
            await supabase.from("theories").delete().eq("id", source.id);
            merged++;
          }
        }

        return NextResponse.json({
          merged,
          prioritized,
          totalTheories: theories.length - merged,
          mergeDetails: mergeInstructions.map(m => ({
            kept: theories[m.keep]?.title,
            absorbed: m.merge.map(i => theories[i]?.title),
          })),
        });
      }
    }
  } catch {
    // Fall through to auto-priority only
  }

  // Fallback: auto-priority based on evidence count alone
  let prioritized = 0;
  for (const theory of theories) {
    if ((theory.priority ?? 0) > 0) continue;
    let autoPriority = 0;
    if (theory.evidence_count >= 20) autoPriority = 75;
    else if (theory.evidence_count >= 10) autoPriority = 50;
    else if (theory.evidence_count >= 5) autoPriority = 25;

    if (autoPriority > 0) {
      await supabase.from("theories").update({ priority: autoPriority }).eq("id", theory.id);
      prioritized++;
    }
  }

  return NextResponse.json({ merged: 0, prioritized, totalTheories: theories.length });
}
