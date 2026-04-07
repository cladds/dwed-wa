"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function CodexEditButton({ slug }: { slug: string }) {
  const [supabase] = useState(() => createClient());
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("operatives")
        .select("rank")
        .eq("discord_id", user.user_metadata.provider_id ?? user.id)
        .single();
      if (data && ["lead_investigator", "director"].includes(data.rank)) {
        setCanEdit(true);
      }
    });
  }, [supabase]);

  if (!canEdit) return null;

  return (
    <Link
      href={`/admin/codex/edit/${slug}`}
      className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-1.5 hover:bg-gold/10 transition-colors"
    >
      Edit Article
    </Link>
  );
}
