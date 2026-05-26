import Image from "next/image";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { CreateUserForm } from "@/_components/admin/CreateUserForm";
import { RegenerateCredentialLinkButton } from "@/_components/admin/RegenerateCredentialLinkButton";
import { ToggleRoleButton } from "@/_components/admin/ToggleRoleButton";
import { isPendingEmail } from "@/_services/user-credential-token.service";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageEntrance>
      <h1 className="mb-6 text-2xl font-bold">Usuários</h1>

      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">Novo usuário</h2>
        <CreateUserForm />
      </Card>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={user.image.startsWith("/uploads")}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    👤
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                {!user.credentialSetupComplete || isPendingEmail(user.email) ? (
                  <p className="text-sm text-muted">Cadastro pendente</p>
                ) : (
                  <p className="text-sm text-muted">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!user.credentialSetupComplete && (
                <Badge variant="muted">Pendente</Badge>
              )}
              <Badge variant={user.role === "ADMIN" ? "live" : "muted"}>
                {user.role}
              </Badge>
              <RegenerateCredentialLinkButton
                userId={user.id}
                credentialSetupComplete={user.credentialSetupComplete}
              />
              <ToggleRoleButton userId={user.id} currentRole={user.role} />
            </div>
          </Card>
        ))}
      </div>
    </PageEntrance>
  );
}
