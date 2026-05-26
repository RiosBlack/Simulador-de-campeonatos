import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminChampionshipIndexPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/championships/${id}/teams`);
}
