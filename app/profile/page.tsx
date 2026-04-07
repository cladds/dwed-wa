"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const RANK_LABELS: Record<string, string> = {
  recruit: "Recruit",
  investigator: "Investigator",
  senior_investigator: "Senior Investigator",
  analyst: "Analyst",
  lead_investigator: "Lead Investigator",
  director: "Director",
};

const RANK_THRESHOLDS = [
  { rank: "investigator", points: 10 },
  { rank: "senior_investigator", points: 50 },
  { rank: "analyst", points: 150 },
  { rank: "lead_investigator", points: 500 },
];

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [operative, setOperative] = useState<{
    id: string;
    cmdr_name: string;
    rank: string;
    bio: string | null;
    contribution_points: number;
    created_at: string;
  } | null>(null);
  const [cmdrName, setCmdrName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("operatives")
        .select("*")
        .eq("discord_id", user.user_metadata.provider_id ?? user.id)
        .single();

      if (data) {
        setOperative(data);
        setCmdrName(data.cmdr_name);
        setBio(data.bio ?? "");
      }
    });
  }, [supabase, router]);

  async function save() {
    if (!operative) return;
    setSaving(true);
    await supabase
      .from("operatives")
      .update({ cmdr_name: cmdrName, bio })
      .eq("id", operative.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!operative) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-system text-text-dim text-xs">Loading profile...</p>
      </div>
    );
  }

  const nextRank = RANK_THRESHOLDS.find(r => operative.contribution_points < r.points);
  const prevThreshold = RANK_THRESHOLDS.filter(r => operative.contribution_points >= r.points).pop();
  const progressBase = prevThreshold?.points ?? 0;
  const progressTarget = nextRank?.points ?? operative.contribution_points;
  const progressPct = progressTarget > progressBase
    ? ((operative.contribution_points - progressBase) / (progressTarget - progressBase)) * 100
    : 100;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-xl text-gold tracking-wide mb-8">
        Operative Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-border bg-bg-card p-6">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-4">Rank</p>
          <p className="font-heading text-gold text-2xl mb-2">
            {RANK_LABELS[operative.rank] ?? operative.rank}
          </p>
          <p className="font-system text-text-dim text-xs mb-3">
            {operative.contribution_points} contribution points
          </p>
          <div className="w-full bg-bg-deep h-2">
            <div
              className="bg-gold/60 h-2 transition-all"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          {nextRank && (
            <p className="font-system text-text-faint text-[9px] mt-2">
              {nextRank.points - operative.contribution_points} points to {RANK_LABELS[nextRank.rank]}
            </p>
          )}
        </div>

        <div className="border border-border bg-bg-card p-6">
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mb-4">Joined</p>
          <p className="font-system text-text-primary text-sm">
            {new Date(operative.created_at).toLocaleDateString()}
          </p>
          <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase mt-4 mb-2">Permissions</p>
          <div className="space-y-1">
            <p className="font-system text-status-success text-[10px]">Submit theories + evidence</p>
            <p className="font-system text-status-success text-[10px]">Comment on theories</p>
            {["investigator", "senior_investigator", "analyst", "lead_investigator", "director"].includes(operative.rank) && (
              <p className="font-system text-status-success text-[10px]">Edit own submissions</p>
            )}
            {["lead_investigator", "director"].includes(operative.rank) && (
              <>
                <p className="font-system text-status-success text-[10px]">Change theory status</p>
                <p className="font-system text-status-success text-[10px]">Import/dismiss archive leads</p>
                <p className="font-system text-status-success text-[10px]">Write codex articles</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border border-border bg-bg-card p-6 space-y-5">
        <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">Edit Profile</h2>

        <div>
          <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
            CMDR Name
          </label>
          <input
            value={cmdrName}
            onChange={(e) => setCmdrName(e.target.value)}
            className="w-full bg-bg-deep border border-border px-4 py-2.5 font-system text-gold text-sm focus:border-gold/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-ui text-text-dim text-[10px] tracking-[0.2em] uppercase block mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none resize-y"
            placeholder="Your investigation focus, Elite experience, etc..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-6 py-2.5 hover:bg-gold/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {saved && (
            <span className="font-system text-status-success text-xs">Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
