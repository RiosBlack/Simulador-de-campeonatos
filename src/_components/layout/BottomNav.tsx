"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/_utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  live?: boolean;
  guestOnly?: boolean;
  requiresAuth?: boolean;
};

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/login", label: "Entrar", icon: "🔑", guestOnly: true },
  { href: "/profile", label: "Perfil", icon: "👤", requiresAuth: true },
];

type BottomNavProps = {
  isLoggedIn?: boolean;
};

export function BottomNav({ isLoggedIn }: BottomNavProps) {
  const pathname = usePathname();
  const visibleItems = (items as NavItem[]).filter((item) => {
    if (item.guestOnly) return !isLoggedIn;
    if (item.requiresAuth) return isLoggedIn;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-safe pt-2">
        {visibleItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

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
