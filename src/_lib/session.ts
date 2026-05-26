import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/_lib/auth";
import type { UserRole } from "@/generated/prisma/client";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const { default: prisma } = await import("@/_lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return { ...session, user: { ...session.user, role: user.role } };
}
