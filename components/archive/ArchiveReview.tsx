"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ForumPost {
  forum_post_id: string;
  author_name: string;
  content_text: string;
  posted_at: string | null;
  page_number: number;
  post_number: number | null;
}

interface ExtractedLead {
  id: string;
  lead_type: string;
  title: string;
  summary: string;
  systems_mentioned: string[];
  coordinates: Record<string, number> | null;
  confidence: string;
  status: string;
  forum_post: ForumPost | null;
}

const TYPE_COLORS: Record<string, string> = {
  theory: "text-gold",
  system: "text-coord-blue",
  evidence: "text-status-success",
  lore: "text-status-warning",
  mechanic: "text-text-primary",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "border-status-success text-status-success",
  medium: "border-status-warning text-status-warning",
  low: "border-text-dim text-text-dim",
};

export function ArchiveReview({ leads }: { leads: ExtractedLead[] }) {
  const [items, setItems] = useState(leads);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  async function updateStatus(id: string, status: "imported" | "dismissed") {
    const { error } = await supabase
      .from("extracted_leads")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  if (items.length === 0) {
    return (
      <div className="border border-border bg-bg-card p-8 text-center">
        <p className="font-system text-text-dim text-xs">
          {"// no leads pending review"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((lead) => (
        <div key={lead.id} className="border border-border bg-bg-card">
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`font-ui text-[10px] tracking-[0.2em] uppercase ${TYPE_COLORS[lead.lead_type] ?? "text-text-mid"}`}>
                {lead.lead_type}
              </span>
              <span className={`font-system text-[9px] tracking-wider uppercase border px-2 py-0.5 ${CONFIDENCE_STYLES[lead.confidence]}`}>
                {lead.confidence}
              </span>
              <h3 className="font-body text-text-primary text-sm">
                {lead.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateStatus(lead.id, "imported")}
                className="font-ui text-[9px] tracking-[0.15em] uppercase border border-status-success/30 text-status-success px-3 py-1 hover:bg-status-success/10 transition-colors cursor-pointer"
              >
                Import
              </button>
              <button
                onClick={() => updateStatus(lead.id, "dismissed")}
                className="font-ui text-[9px] tracking-[0.15em] uppercase border border-status-danger/30 text-status-danger px-3 py-1 hover:bg-status-danger/10 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                className="font-system text-text-faint text-xs px-2 py-1 hover:text-text-primary transition-colors cursor-pointer"
              >
                {expanded === lead.id ? "[-]" : "[+]"}
              </button>
            </div>
          </div>

          <div className="px-5 pb-3">
            <p className="font-body text-text-mid text-sm">{lead.summary}</p>
            {lead.systems_mentioned.length > 0 && (
              <div className="flex gap-2 mt-2">
                {lead.systems_mentioned.map((sys) => (
                  <span key={sys} className="font-system text-coord-blue text-[10px] bg-coord-blue/10 px-2 py-0.5">
                    {sys}
                  </span>
                ))}
              </div>
            )}
          </div>

          {expanded === lead.id && lead.forum_post && (
            <div className="border-t border-border px-5 py-4 bg-bg-deep">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-system text-gold text-xs">{lead.forum_post.author_name}</span>
                <span className="font-system text-text-faint text-[9px]">
                  Page {lead.forum_post.page_number} #{lead.forum_post.post_number}
                </span>
                {lead.forum_post.posted_at && (
                  <span className="font-system text-text-faint text-[9px]">
                    {new Date(lead.forum_post.posted_at).toLocaleDateString()}
                  </span>
                )}
                <a
                  href={`https://forums.frontier.co.uk/threads/168253/post-${lead.forum_post.forum_post_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-system text-coord-blue text-[9px] hover:underline"
                >
                  View original post
                </a>
              </div>
              <p className="font-system text-text-faint text-[9px] mb-2">
                Credit: {lead.forum_post.author_name} (Frontier Forums)
              </p>
              <p className="font-body text-text-dim text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {lead.forum_post.content_text.substring(0, 1500)}
                {lead.forum_post.content_text.length > 1500 && "..."}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
