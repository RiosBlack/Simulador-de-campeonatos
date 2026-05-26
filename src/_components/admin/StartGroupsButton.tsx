"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/_components/ui/Button";

type Props = {
  championshipId: string;
  action: (id: string) => Promise<{ success?: boolean; error?: string }>;
};

export function StartGroupsButton({ championshipId, action }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await action(championshipId);
          if (r.success) {
            router.push(`/admin/championships/${championshipId}/matches`);
            router.refresh();
          }
        })
      }
    >
      {pending ? "Iniciando..." : "Iniciar fase de grupos"}
    </Button>
  );
}
