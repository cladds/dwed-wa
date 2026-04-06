"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SubmitTheoryPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const summary = form.get("summary") as string;
    const category = form.get("category") as string;
    const systemsRaw = form.get("systems") as string;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const systems = systemsRaw
      ? systemsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to submit a theory.");
      setLoading(false);
      return;
    }

    // Get operative id
    const { data: operative } = await supabase
      .from("operatives")
      .select("id")
      .eq("discord_id", user.user_metadata.provider_id ?? user.id)
      .single();

    const { error: insertError } = await supabase.from("theories").insert({
      title,
      slug,
      summary,
      category,
      source: "open",
      systems_mentioned: systems,
      created_by: operative?.id ?? null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/theories/${slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-6">
        New Theory
      </h1>
      <p className="font-body text-text-mid text-sm mb-8">
        Submit a new investigation theory. Document your hypothesis and any relevant systems.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-border bg-bg-card p-6 space-y-5">
          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              Title
            </label>
            <input
              name="title"
              required
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none transition-colors"
              placeholder="e.g. Raxxla via Witchspace Anomaly"
            />
          </div>

          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              Category
            </label>
            <select
              name="category"
              required
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none transition-colors"
            >
              <option value="theory">Theory</option>
              <option value="system">System Investigation</option>
              <option value="lore">Lore Analysis</option>
              <option value="mechanic">Game Mechanic</option>
              <option value="evidence">Evidence Collection</option>
            </select>
          </div>

          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              Summary / Hypothesis
            </label>
            <textarea
              name="summary"
              required
              rows={6}
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none transition-colors resize-y"
              placeholder="Describe your theory, the evidence supporting it, and what needs to be investigated..."
            />
          </div>

          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              Related Systems (comma separated, optional)
            </label>
            <input
              name="systems"
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-system text-coord-blue text-sm focus:border-gold/50 focus:outline-none transition-colors"
              placeholder="e.g. Shinrarta Dezhra, Achenar, HIP 87621"
            />
          </div>
        </div>

        {error && (
          <p className="font-system text-status-danger text-xs">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-6 py-3 hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Theory"}
        </button>
      </form>
    </div>
  );
}
