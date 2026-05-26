"use client";

import { useTransition } from "react";
import { toggleUserRoleAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import type { UserRole } from "@/generated/prisma/client";

type ToggleRoleButtonProps = {
  userId: string;
  currentRole: UserRole;
};

export function ToggleRoleButton({ userId, currentRole }: ToggleRoleButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleUserRoleAction(userId);
        })
      }
    >
      {currentRole === "ADMIN" ? "Remover admin" : "Tornar admin"}
    </Button>
  );
}
