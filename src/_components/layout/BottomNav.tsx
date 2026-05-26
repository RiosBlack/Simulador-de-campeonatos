"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/_utils/cn";

const items = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard?tab=matches", label: "Jogos", icon: "📅" },
  { href: "/dashboard?tab=live", label: "Live", icon: "●", live: true },
  { href: "/dashboard?tab=stats", label: "Stats", icon: "📊" },
  { href: "/profile", label: "Perfil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-safe pt-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href.startsWith("/dashboard") && pathname.startsWith("/dashboard"));

          if (item.live) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full gradient-accent text-background text-lg font-bold shadow-[0_0_30px_rgba(163,255,94,0.5)]">
                  LIVE
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
                active ? "text-accent" : "text-muted",
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
