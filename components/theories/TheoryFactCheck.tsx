"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Fact {
  id: string;
  title: string;
  status: string;
}

interface FactLink {
  id: string;
  fact_id: string;
  relationship: "supports" | "contradicts" | "neutral";
  notes: string | null;
  fact: Fact;
}

interface TheoryFactCheckProps {
  theoryId: string;
  canEdit: boolean;
}

const RELATIONSHIP_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  supports: { label: "Supports", color: "text-status-success border-status-success/30", icon: "+" },
  contradicts: { label: "Contradicts", color: "text-status-danger border-status-danger/30", icon: "x" },
  neutral: { label: "Neutral", color: "text-text-dim border-border", icon: "~" },
};

export function TheoryFactCheck({ theoryId, canEdit }: TheoryFactCheckProps) {
  const [supabase] = useState(() => createClient());
  const [links, setLinks] = useState<FactLink[]>([]);
  const [allFacts, setAllFacts] = useState<Fact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFact, setSelectedFact] = useState("");
  const [selectedRel, setSelectedRel] = useState("supports");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
  }, [theoryId]);

  async function loadLinks() {
    const { data } = await supabase
      .from("theory_fact_links")
      .select("id, fact_id, relationship, notes, fact:confirmed_facts(id, title, status)")
      .eq("theory_id", theoryId);

    if (data) {
      const mapped: FactLink[] = data.map(d => {
        const raw = d as Record<string, unknown>;
        const factData = Array.isArray(raw.fact) ? raw.fact[0] : raw.fact;
        return {
          id: raw.id as string,
          fact_id: raw.fact_id as string,
          relationship: raw.relationship as "supports" | "contradicts" | "neutral",
          notes: raw.notes as string | null,
          fact: factData as Fact,
        };
      });
      setLinks(mapped);
    }
  }

  async function loadFacts() {
    const { data } = await supabase
      .from("confirmed_facts")
      .select("id, title, status")
      .eq("status", "confirmed")
      .order("sort_order", { ascending: true });
    setAllFacts(data ?? []);
  }

  async function addLink() {
    if (!selectedFact) return;
    setSaving(true);
    await supabase.from("theory_fact_links").insert({
      theory_id: theoryId,
      fact_id: selectedFact,
      relationship: selectedRel,
      notes: notes.trim() || null,
    });
    setSelectedFact("");
    setNotes("");
    setShowAdd(false);
    await loadLinks();
    setSaving(false);
  }

  async function removeLink(id: string) {
    await supabase.from("theory_fact_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  const linkedFactIds = new Set(links.map(l => l.fact_id));
  const availableFacts = allFacts.filter(f => !linkedFactIds.has(f.id));

  return (
    <div className="border border-border bg-bg-card">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
          Fact Check
        </h2>
        <Link href="/codex/facts" className="font-system text-text-faint text-[9px] hover:text-gold transition-colors">
          View all facts
        </Link>
      </div>

      {links.length > 0 ? (
        <div className="divide-y divide-border">
          {links.map(link => {
            const style = RELATIONSHIP_STYLES[link.relationship] ?? RELATIONSHIP_STYLES.neutral;
            return (
              <div key={link.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`font-system text-[10px] mt-0.5 border px-1.5 py-0.5 ${style.color}`}>
                  {style.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-text-primary text-sm">{link.fact?.title}</p>
                  {link.notes && (
                    <p className="font-system text-text-faint text-[10px] mt-1">{link.notes}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => removeLink(link.id)}
                    className="font-system text-text-faint text-[9px] hover:text-status-danger cursor-pointer shrink-0"
                  >
                    remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="font-system text-text-dim text-xs">{"// no fact checks linked yet"}</p>
        </div>
      )}

      {canEdit && !showAdd && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => { setShowAdd(true); loadFacts(); }}
            className="font-ui text-[9px] tracking-[0.15em] uppercase text-gold hover:text-gold/80 cursor-pointer"
          >
            + Link confirmed fact
          </button>
        </div>
      )}

      {canEdit && showAdd && (
        <div className="px-5 py-4 border-t border-border space-y-3">
          <select
            value={selectedFact}
            onChange={e => setSelectedFact(e.target.value)}
            className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          >
            <option value="">Select a confirmed fact...</option>
            {availableFacts.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            {(["supports", "contradicts", "neutral"] as const).map(rel => (
              <button
                key={rel}
                onClick={() => setSelectedRel(rel)}
                className={`font-ui text-[9px] tracking-wider uppercase px-3 py-1.5 border cursor-pointer ${
                  selectedRel === rel
                    ? RELATIONSHIP_STYLES[rel].color + " bg-bg-hover"
                    : "border-border text-text-dim"
                }`}
              >
                {RELATIONSHIP_STYLES[rel].label}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes on why..."
            className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addLink}
              disabled={!selectedFact || saving}
              className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Link Fact"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="font-ui text-[9px] tracking-[0.15em] uppercase border border-border text-text-dim px-4 py-2 hover:bg-bg-hover cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
