"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navGroups = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Overview", icon: "◆" },
      { href: "/dossiers", label: "Leads", icon: "▣" },
      { href: "/systems", label: "Coordinates", icon: "◎" },
      { href: "/map", label: "Galaxy Chart", icon: "✦" },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/codex", label: "The Codex", icon: "▤" },
    ],
  },
  {
    label: "Submit",
    items: [
      { href: "/submit/dossier", label: "New Lead", icon: "+" },
      { href: "/submit/system", label: "New Coordinates", icon: "+" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-bg-card border-r border-border flex flex-col z-40">
      <Link href="/" className="block px-5 py-4 border-b border-border">
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
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
    </aside>
  );
}
