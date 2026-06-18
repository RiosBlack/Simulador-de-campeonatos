import { AppTopBar } from "@/_components/layout/AppTopBar";
import { BottomNav } from "@/_components/layout/BottomNav";
import { Sidebar } from "@/_components/layout/Sidebar";
import { getSession } from "@/_lib/session";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let isAdmin = false;
  if (session?.user) {
    const { default: prisma } = await import("@/_lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    isAdmin = user?.role === "ADMIN";
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar isAdmin={isAdmin} isLoggedIn={Boolean(session?.user)} />
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">
        <main className="flex-1 px-4 py-6">
          <AppTopBar />
          {children}
        </main>
        <BottomNav
          isLoggedIn={Boolean(session?.user)}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
