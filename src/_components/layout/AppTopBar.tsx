import Link from "next/link";
import { getSession } from "@/_lib/session";

export async function AppTopBar() {
  const session = await getSession();

  return (
    <header className="mb-6 flex items-center justify-end gap-3 border-b border-border pb-4">
      {session?.user ? (
        <Link
          href="/profile"
          className="text-sm font-medium text-muted hover:text-accent"
        >
          {session.user.name}
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-accent/40"
        >
          Entrar
        </Link>
      )}
    </header>
  );
}
