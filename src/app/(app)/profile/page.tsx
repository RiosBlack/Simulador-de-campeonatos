import { requireSession } from "@/_lib/session";
import { ProfileForm } from "@/_components/profile/ProfileForm";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { SignOutButton } from "@/_components/profile/SignOutButton";

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <PageEntrance>
      <h1 className="mb-6 text-2xl font-bold">Meu Perfil</h1>
      <Card className="max-w-lg space-y-6">
        <ProfileForm
          userId={session.user.id}
          name={session.user.name}
          email={session.user.email}
          image={session.user.image ?? null}
        />
        <SignOutButton />
      </Card>
    </PageEntrance>
  );
}
