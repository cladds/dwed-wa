"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SystemSearch } from "@/components/ui/SystemSearch";

export default function SubmitSystemPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemName, setSystemName] = useState("");
  const [coords, setCoords] = useState<{ x: number; y: number; z: number } | null>(null);
  const [reason, setReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!systemName) return;

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to submit coordinates.");
      setLoading(false);
      return;
    }

    const { data: operative } = await supabase
      .from("operatives")
      .select("id")
      .eq("discord_id", user.user_metadata.provider_id ?? user.id)
      .single();

    const { data, error: insertError } = await supabase
      .from("system_tickets")
      .insert({
        system_name: systemName,
        coord_x: coords?.x ?? null,
        coord_y: coords?.y ?? null,
        coord_z: coords?.z ?? null,
        what_we_know: reason || null,
        submitted_by: operative?.id ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/systems/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-6">
        Submit Coordinates
      </h1>
      <p className="font-body text-text-mid text-sm mb-8">
        Submit a star system for investigation. Start typing to search EDSM for system names and auto-fill coordinates.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-border bg-bg-card p-6 space-y-5">
          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              System Name
            </label>
            <SystemSearch
              value={systemName}
              onChange={(name, c) => {
                setSystemName(name);
                if (c) setCoords(c);
              }}
              placeholder="Start typing to search EDSM..."
            />
          </div>

          {coords && (
            <div className="bg-bg-deep border border-border p-4">
              <p className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase mb-2">
                Coordinates (from EDSM)
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="font-system text-text-faint text-[9px]">X</span>
                  <p className="font-system text-coord-blue text-sm">{coords.x.toFixed(2)}</p>
                </div>
                <div>
                  <span className="font-system text-text-faint text-[9px]">Y</span>
                  <p className="font-system text-coord-blue text-sm">{coords.y.toFixed(2)}</p>
                </div>
                <div>
                  <span className="font-system text-text-faint text-[9px]">Z</span>
                  <p className="font-system text-coord-blue text-sm">{coords.z.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
              Why investigate this system? (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none transition-colors resize-y"
              placeholder="What makes this system interesting for the Raxxla investigation?"
            />
          </div>
        </div>

        {error && (
          <p className="font-system text-status-danger text-xs">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !systemName}
          className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-6 py-3 hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Coordinates"}
        </button>
      </form>
    </div>
  );
}
