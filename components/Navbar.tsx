"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, ListChecks, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/routines", label: "Routines", icon: ListChecks },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">DartTrainer</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
