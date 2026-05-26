import { Sidebar } from "@/_components/layout/Sidebar";
import { BottomNav } from "@/_components/layout/BottomNav";
import { requireAdmin } from "@/_lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh">
      <Sidebar isAdmin />
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">
        <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">{children}</main>
        <BottomNav isLoggedIn isAdmin />
      </div>
    </div>
  );
}
