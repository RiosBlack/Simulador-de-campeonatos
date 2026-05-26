import Link from "next/link";
import { validateToken } from "@/_services/user-credential-token.service";
import { SetupAccountForm } from "@/_components/auth/SetupAccountForm";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";

type PageProps = {
  params: Promise<{ token: string }>;
};

function InvalidLinkMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="space-y-4 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted">{description}</p>
      <Link href="/login" className="text-sm text-accent hover:underline">
        Ir para o login
      </Link>
    </Card>
  );
}

export default async function CadastroPage({ params }: PageProps) {
  const { token } = await params;
  const validation = await validateToken(token);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <PageEntrance className="w-full max-w-md">
        {validation.status === "valid" && (
          <SetupAccountForm token={token} userName={validation.userName} />
        )}
        {validation.status === "expired" && (
          <InvalidLinkMessage
            title="Link expirado"
            description="Peça um novo link de acesso ao administrador."
          />
        )}
        {validation.status === "used" && (
          <InvalidLinkMessage
            title="Link já utilizado"
            description="Se precisar alterar e-mail ou senha, peça um novo link ao administrador."
          />
        )}
        {validation.status === "invalid" && (
          <InvalidLinkMessage
            title="Link inválido"
            description="Verifique se copiou o endereço completo ou solicite um novo link."
          />
        )}
      </PageEntrance>
    </div>
  );
}
