"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dossiers", label: "Dossiers" },
  { href: "/systems", label: "Coordinates" },
  { href: "/map", label: "Chart" },
  { href: "/codex", label: "Codex" },
];

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-border bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-heading text-gold text-lg tracking-widest">
          DWA
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-ui text-text-dim text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={() => signOut()}
              className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors border border-border px-3 py-1 cursor-pointer"
            >
              {user.user_metadata.full_name ?? "CMDR"}
            </button>
          ) : (
            <Link
              href="/login"
              className="font-ui text-text-faint text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors border border-border px-3 py-1"
            >
              Identify
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
