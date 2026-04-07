"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "open_lead", label: "Open Lead" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "promising", label: "Promising" },
  { value: "verified", label: "Verified" },
  { value: "disproven", label: "Disproven" },
  { value: "dead_end", label: "Dead End" },
  { value: "cold", label: "Cold" },
];

export function TheoryStatusControl({ theoryId, currentStatus }: { theoryId: string; currentStatus: string }) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setSaving(true);
    await supabase
      .from("theories")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", theoryId);
    setStatus(newStatus);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="border border-border bg-bg-card p-5">
      <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-3">
        Status Control
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={saving || s.value === status}
            className={`font-system text-[9px] tracking-wider uppercase px-3 py-2 border transition-colors cursor-pointer disabled:cursor-default ${
              s.value === status
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-border text-text-dim hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
