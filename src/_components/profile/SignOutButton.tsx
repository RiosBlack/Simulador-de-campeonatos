"use client";

import { useRouter } from "next/navigation";
import { getAuthClient } from "@/_lib/auth-client";
import { Button } from "@/_components/ui/Button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await getAuthClient().signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleSignOut} className="w-full">
      Sair
    </Button>
  );
}
