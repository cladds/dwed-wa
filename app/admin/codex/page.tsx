"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Source {
  url: string;
  title: string;
  type: string;
}

const CATEGORIES = [
  { value: "raxxla", label: "Raxxla" },
  { value: "mystery", label: "Mystery" },
  { value: "lore", label: "Lore" },
  { value: "faction", label: "Faction" },
  { value: "location", label: "Location" },
  { value: "mechanic", label: "Mechanic" },
  { value: "history", label: "History" },
  { value: "guide", label: "Guide" },
];

export default function AdminCodexPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("raxxla");
  const [sources, setSources] = useState<Source[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("forum");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated content
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedExcerpt, setGeneratedExcerpt] = useState("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  function addSource() {
    if (!newUrl) return;
    setSources([...sources, { url: newUrl, title: newTitle || newUrl, type: newType }]);
    setNewUrl("");
    setNewTitle("");
  }

  function removeSource(i: number) {
    setSources(sources.filter((_, idx) => idx !== i));
  }

  async function generate() {
    if (sources.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/codex/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: sources, title, category }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Generation failed");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      if (!title && data.title) setTitle(data.title);
      setGeneratedContent(data.content);
      setGeneratedExcerpt(data.excerpt);
      setGeneratedTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setGenerating(false);
  }

  async function publish() {
    setSaving(true);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { error: insertError } = await supabase.from("codex_articles").insert({
      title,
      slug,
      content: generatedContent,
      excerpt: generatedExcerpt,
      category,
      sources,
      tags: generatedTags,
      published: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/codex/${slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-6">
        Create Codex Article
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-5">
          <div className="border border-border bg-bg-card p-5 space-y-4">
            <div>
              <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
                Article Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
                placeholder="Leave blank to auto-generate from sources"
              />
            </div>

            <div>
              <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-border bg-bg-card p-5 space-y-4">
            <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
              Source Links
            </h3>

            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-bg-deep border border-border px-3 py-2">
                <span className="font-system text-text-faint text-[9px] uppercase w-12">{s.type}</span>
                <span className="font-body text-coord-blue text-sm flex-1 truncate">{s.title}</span>
                <button onClick={() => removeSource(i)} className="text-text-faint hover:text-status-danger text-xs cursor-pointer">x</button>
              </div>
            ))}

            <div className="space-y-2">
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste URL..."
                className="w-full bg-bg-deep border border-border px-4 py-2 font-system text-coord-blue text-sm focus:border-gold/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Source title (optional)"
                  className="flex-1 bg-bg-deep border border-border px-3 py-2 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="bg-bg-deep border border-border px-3 py-2 font-system text-text-primary text-sm"
                >
                  <option value="forum">Forum</option>
                  <option value="reddit">Reddit</option>
                  <option value="wiki">Wiki</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                </select>
                <button
                  type="button"
                  onClick={addSource}
                  className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating || sources.length === 0}
            className="w-full font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-6 py-3 hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {generating ? "Generating article..." : "Generate from sources"}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-5">
          {error && (
            <div className="border border-status-danger/30 bg-status-danger/10 p-4">
              <p className="font-system text-status-danger text-xs">{error}</p>
            </div>
          )}

          {generatedContent ? (
            <>
              <div className="border border-border bg-bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
                    Preview
                  </h3>
                  <button
                    onClick={publish}
                    disabled={saving}
                    className="font-ui text-[9px] tracking-[0.15em] uppercase border border-status-success/30 text-status-success px-4 py-1.5 hover:bg-status-success/10 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Publishing..." : "Publish to Codex"}
                  </button>
                </div>

                {generatedExcerpt && (
                  <p className="font-body text-text-mid text-sm italic mb-4 pb-4 border-b border-border">
                    {generatedExcerpt}
                  </p>
                )}

                {generatedTags.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {generatedTags.map((tag) => (
                      <span key={tag} className="font-system text-text-faint text-[9px] bg-bg-hover border border-border px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="font-body text-text-mid text-sm whitespace-pre-wrap leading-relaxed">
                  {generatedContent}
                </div>
              </div>

              <div className="border border-border bg-bg-card p-5">
                <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-3">
                  Edit Content
                </h3>
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={20}
                  className="w-full bg-bg-deep border border-border px-4 py-3 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none resize-y"
                />
              </div>
            </>
          ) : (
            <div className="border border-border bg-bg-card p-12 text-center">
              <p className="font-system text-text-dim text-xs">
                {"// add sources and generate to preview article"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
