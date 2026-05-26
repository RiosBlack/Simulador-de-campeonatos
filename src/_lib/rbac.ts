import type { UserRole } from "@/generated/prisma/client";

export function isAdmin(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
