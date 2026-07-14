import {
  getAnonymousMembers,
  getSettingsMembers,
  getSettingsTribe,
} from "@/app/(account)/tribe/[id]/edit/data";
import SettingsSkeleton from "@/components/tribes/settings/SettingsSkeleton";
import TribeSettingsPage from "@/components/tribes/settings/TribeSettingsPage";
import { requireTribeSuperAdmin } from "@/utils/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const SettingsContent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const tribeId = (await params).id;

  // Settings are SuperAdmin-only; the page carries claim codes
  let membership;
  try {
    membership = await requireTribeSuperAdmin(tribeId);
  } catch {
    notFound();
  }

  const [tribe, members, anonymousMembers] = await Promise.all([
    getSettingsTribe(tribeId),
    getSettingsMembers(tribeId),
    getAnonymousMembers(tribeId),
  ]);

  if (!tribe) {
    notFound();
  }

  return (
    <TribeSettingsPage
      tribe={tribe}
      members={members}
      anonymousMembers={anonymousMembers}
      currentProfileId={membership.profileId}
    />
  );
};

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent params={params} />
    </Suspense>
  );
};

export default Page;
