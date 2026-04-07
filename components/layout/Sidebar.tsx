"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";

const navGroups = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Overview", icon: "◆" },
      { href: "/theories?source=open", label: "Open Theories", icon: "▣" },
      { href: "/systems", label: "Coordinates", icon: "◎" },
      { href: "/map", label: "Galaxy Chart", icon: "✦" },
      { href: "/corkboard", label: "Corkboard", icon: "⊞" },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/theories?source=forum", label: "Forum Theories", icon: "▦" },
      { href: "/codex", label: "The Codex", icon: "▤" },
      { href: "/codex/facts", label: "What We Know", icon: "◈" },
      { href: "/codex/sources", label: "Sources", icon: "⊕" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/archive", label: "Forum Archive", icon: "⚙" },
      { href: "/admin/pipeline", label: "Data Pipeline", icon: "▶" },
      { href: "/admin/codex", label: "Write Article", icon: "✎" },
      { href: "/admin/facts", label: "Manage Facts", icon: "◈" },
    ],
  },
  {
    label: "Submit",
    items: [
      { href: "/submit/theory", label: "New Theory", icon: "+" },
      { href: "/submit/system", label: "New Coordinates", icon: "+" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const sidebarContent = (
    <>
      <Link href="/" className="block px-5 py-4 border-b border-border" onClick={() => setMobileOpen(false)}>
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={28} height={28} />
          <div>
            <span className="font-heading text-gold text-sm tracking-[0.1em] block leading-tight">
              darkwheel
            </span>
            <span className="font-system text-text-dim text-[9px] tracking-widest">.space</span>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="font-ui text-text-faint text-[10px] tracking-[0.25em] uppercase px-2 mb-2">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 text-sm transition-all ${
                    isActive
                      ? "bg-gold/10 text-gold border-l-2 border-gold"
                      : "text-text-mid hover:bg-bg-hover hover:text-text-primary border-l-2 border-transparent"
                  }`}
                >
                  <span className="text-xs w-4 text-center font-system">{item.icon}</span>
                  <span className="font-body">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="font-system text-text-faint text-[9px] tracking-widest uppercase">
          Raxxla Investigation Platform
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 text-gold cursor-pointer"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-bg-card border-r border-border flex flex-col z-50 md:hidden transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-text-dim hover:text-gold cursor-pointer"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] bg-bg-card border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
