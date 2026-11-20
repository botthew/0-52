import { getServerUser, normalizeHandle } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ProfileClient from "./profile-client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const canonical = normalizeHandle(decodeURIComponent(handle));
  if (!canonical) notFound();
  if (canonical !== handle) redirect(`/u/${canonical}`);

  const viewer = await getServerUser();

  return (
    <ProfileClient
      handle={canonical}
      canEdit={viewer?.handle === canonical}
      viewerHandle={viewer?.handle ?? null}
    />
  );
}
