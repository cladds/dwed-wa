"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Theory {
  id: string;
  title: string;
  slug: string;
}

export function TheoryMerge({ currentTheoryId }: { currentTheoryId: string }) {
  const [supabase] = useState(() => createClient());
  const [theories, setTheories] = useState<Theory[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [merging, setMerging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("theories")
      .select("id, title, slug")
      .neq("id", currentTheoryId)
      .order("title")
      .then(({ data }) => setTheories(data ?? []));
  }, [supabase, currentTheoryId]);

  async function merge() {
    if (!selectedTarget) return;
    setMerging(true);

    const res = await fetch("/api/theories/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: currentTheoryId, targetId: selectedTarget }),
    });

    if (res.ok) {
      const data = await res.json();
      const target = theories.find(t => t.id === data.targetId);
      if (target) router.push(`/theories/${target.slug}`);
    }
    setMerging(false);
  }

  if (theories.length === 0) return null;

  return (
    <div className="border border-border bg-bg-card p-5">
      <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-3">
        Merge Theory
      </h2>
      <p className="font-system text-text-faint text-[9px] mb-3">
        Merge this theory into another. All evidence and comments will be moved.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="font-ui text-[9px] tracking-[0.15em] uppercase border border-status-danger/30 text-status-danger px-3 py-1.5 hover:bg-status-danger/10 cursor-pointer"
        >
          Merge into...
        </button>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full bg-bg-deep border border-border px-3 py-2 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          >
            <option value="">Select target theory...</option>
            {theories.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={merge}
              disabled={merging || !selectedTarget}
              className="font-ui text-[9px] tracking-[0.15em] uppercase border border-status-danger/30 text-status-danger px-3 py-1.5 hover:bg-status-danger/10 cursor-pointer disabled:opacity-50"
            >
              {merging ? "Merging..." : "Confirm Merge"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="font-ui text-[9px] tracking-[0.15em] uppercase border border-border text-text-dim px-3 py-1.5 hover:bg-bg-hover cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
