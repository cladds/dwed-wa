"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

const RANK_LABELS: Record<string, string> = {
  recruit: "Recruit",
  investigator: "Investigator",
  senior_investigator: "Sr. Investigator",
  analyst: "Analyst",
  lead_investigator: "Lead Investigator",
  director: "Director",
};

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [rank, setRank] = useState<string>("recruit");
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("operatives")
          .select("rank")
          .eq("discord_id", user.user_metadata.provider_id ?? user.id)
          .single()
          .then(({ data }) => {
            if (data?.rank) setRank(data.rank);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="fixed top-0 left-0 md:left-[240px] right-0 h-14 bg-bg-card border-b border-border z-30 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Spacer for mobile hamburger button */}
        <div className="w-8 md:hidden" />
        <Link href="/" className="md:hidden flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={20} height={20} />
          <span className="font-heading text-gold text-xs tracking-[0.1em]">darkwheel</span>
        </Link>
        <h2 className="font-system text-text-dim text-xs tracking-widest uppercase hidden md:block">
          Operations Desk
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user ? (
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 bg-bg-hover border border-border hover:border-gold/30 transition-colors"
            >
              <div className="w-2 h-2 bg-status-success" />
              <div>
                <p className="font-system text-gold text-[10px] md:text-xs leading-tight truncate max-w-[80px] md:max-w-none">
                  {user.user_metadata.full_name ?? "CMDR"}
                </p>
                <p className="font-system text-text-faint text-[8px] md:text-[9px] tracking-wider uppercase">
                  {RANK_LABELS[rank] ?? rank}
                </p>
              </div>
            </Link>
            <button
              onClick={() => signOut()}
              className="font-ui text-text-faint text-[9px] md:text-[10px] tracking-[0.15em] uppercase border border-border px-2 md:px-3 py-1.5 hover:text-status-danger hover:border-status-danger transition-colors cursor-pointer hidden sm:block"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="font-ui text-text-dim text-[10px] tracking-[0.15em] uppercase border border-gold/30 px-4 py-1.5 hover:text-gold hover:border-gold transition-colors"
          >
            Identify
          </Link>
        )}
      </div>
    </header>
  );
}
