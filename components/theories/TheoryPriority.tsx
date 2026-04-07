"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TheoryPriorityProps {
  theoryId: string;
  currentPriority: number;
}

const PRIORITY_LEVELS = [
  { value: 0, label: "None", desc: "Not on corkboard" },
  { value: 25, label: "Low", desc: "Minor thread" },
  { value: 50, label: "Medium", desc: "Active investigation" },
  { value: 75, label: "High", desc: "Key theory" },
  { value: 100, label: "Critical", desc: "Core to Raxxla" },
];

export function TheoryPriority({ theoryId, currentPriority }: TheoryPriorityProps) {
  const [priority, setPriority] = useState(currentPriority);
  const [saving, setSaving] = useState(false);
  const [supabase] = useState(() => createClient());

  async function updatePriority(value: number) {
    setSaving(true);
    setPriority(value);
    await supabase.from("theories").update({ priority: value }).eq("id", theoryId);
    setSaving(false);
  }

  return (
    <div className="border border-border bg-bg-card p-5">
      <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-3">
        Priority {saving && <span className="text-gold">saving...</span>}
      </h2>
      <div className="space-y-1.5">
        {PRIORITY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => updatePriority(level.value)}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
              priority === level.value
                ? "bg-gold/10 border border-gold/30"
                : "border border-border hover:bg-bg-hover"
            }`}
          >
            <div>
              <span className={`font-system text-xs ${priority === level.value ? "text-gold" : "text-text-primary"}`}>
                {level.label}
              </span>
              <span className="font-system text-text-faint text-[9px] ml-2">{level.desc}</span>
            </div>
            {level.value > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: Math.ceil(level.value / 25) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-3 ${priority >= level.value ? "bg-gold" : "bg-border"}`} />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
