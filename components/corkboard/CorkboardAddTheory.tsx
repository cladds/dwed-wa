"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Theory {
  id: string;
  title: string;
  status: string;
  category: string;
  evidence_count: number;
  priority: number;
}

interface CorkboardAddTheoryProps {
  existingIds: string[];
}

export function CorkboardAddTheory({ existingIds }: CorkboardAddTheoryProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Theory[]>([]);
  const [searching, setSearching] = useState(false);
  const [supabase] = useState(() => createClient());

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("theories")
      .select("id, title, status, category, evidence_count, priority")
      .ilike("title", `%${q}%`)
      .limit(10);
    setResults((data ?? []).filter(t => !existingIds.includes(t.id)));
    setSearching(false);
  }

  async function pinTheory(id: string) {
    await supabase.from("theories").update({ priority: 50 }).eq("id", id);
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-ui text-[10px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 transition-colors cursor-pointer"
      >
        + Pin Theory
      </button>
    );
  }

  return (
    <div className="absolute top-14 right-4 bg-bg-card border border-border w-[340px] z-50">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">Pin to Corkboard</span>
        <button onClick={() => { setOpen(false); setQuery(""); setResults([]); }} className="font-system text-text-faint text-xs hover:text-gold cursor-pointer">
          close
        </button>
      </div>
      <div className="p-3">
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search theories..."
          className="w-full bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          autoFocus
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
        {searching && (
          <div className="px-4 py-3">
            <span className="font-system text-text-dim text-xs">Searching...</span>
          </div>
        )}
        {!searching && results.length === 0 && query.length >= 2 && (
          <div className="px-4 py-3">
            <span className="font-system text-text-dim text-xs">{"// no unpinned theories found"}</span>
          </div>
        )}
        {results.map(t => (
          <div key={t.id} className="px-4 py-3 hover:bg-bg-hover flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body text-text-primary text-sm truncate">{t.title}</p>
              <p className="font-system text-text-faint text-[9px]">
                {t.category} | {t.evidence_count} evidence
              </p>
            </div>
            <button
              onClick={() => pinTheory(t.id)}
              className="font-ui text-[9px] tracking-wider uppercase border border-gold/30 text-gold px-3 py-1.5 hover:bg-gold/10 shrink-0 cursor-pointer"
            >
              Pin
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
