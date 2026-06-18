"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/_utils/cn";

const navItems = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/profile", label: "Perfil", icon: "👤", requiresAuth: true },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: "⚙️" },
  { href: "/admin/users", label: "Usuários", icon: "👥" },
  { href: "/admin/championships", label: "Copas", icon: "🏆" },
];

type SidebarProps = {
  isAdmin?: boolean;
  isLoggedIn?: boolean;
};

export function Sidebar({ isAdmin, isLoggedIn }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.requiresAuth || isLoggedIn);

  return (
    <aside className="hidden lg:flex lg:w-50 lg:flex-col lg:border-r lg:border-border lg:bg-surface/50 lg:backdrop-blur-xl">
      <Link
        href="/"
        className="flex h-16 items-center gap-2 border-b border-border px-6"
      >
        <span className="text-2xl">⚽</span>
        <div>
          <p className="text-xs text-muted">Campeonato</p>
          <p className="font-bold text-gradient">Resenha</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {!isLoggedIn && (
          <NavLink
            item={{ href: "/login", label: "Entrar", icon: "🔑" }}
            pathname={pathname}
          />
        )}
        {isAdmin && (
          <>
            <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: string };
  pathname: string;
}) {
  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-surface-elevated hover:text-foreground",
      )}
    >
      <span>{item.icon}</span>
      {item.label}
    </Link>
  );
}
