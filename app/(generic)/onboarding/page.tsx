import LoadingSpinner from "@/components/icons/LoadingSpinner";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import type { FlowState } from "@/components/onboarding/steps";
import { TOTAL_STEPS } from "@/components/onboarding/steps";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import type { DraftTribe } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const GENERIC_IMAGE_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/avatars/profile/default_1.png`;

// Enables tribe invite link to render a request to join tribe
async function resolveInviteTribe(
  inviteCode: string | undefined,
): Promise<DraftTribe | null> {
  if (!inviteCode) return null;

  try {
    const [row] = await db
      .select({
        id: groupTable.id,
        name: groupTable.name,
        image: groupTable.image,
      })
      .from(groupInvitesTable)
      .innerJoin(groupTable, eq(groupTable.id, groupInvitesTable.groupId))
      .where(eq(groupInvitesTable.code, inviteCode));

    return row ? { ...row, source: "invite" } : null;
  } catch (error) {
    console.error("Failed to resolve invite tribe:", error);
    return null;
  }
}

const OnboardingContent = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile] = await db
    .select()
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  // Users that completed the onboarding are redirected to their dashboards
  if (profile?.onboardingCompletedAt) redirect("/dashboard");

  // Check if user's previously started the onboarding process - onboarding draft
  const draft = profile?.onboardingDraft ?? {};

  // Check if user signed up using a tribe invite code
  const inviteTribe = await resolveInviteTribe(user.user_metadata?.inviteCode);
  // Seed the invite tribe only until the user has actually been past the tribe
  // slide (a saved step of 3+ means they left it). After that the draft is the
  // truth — if they removed the invited tribe, it stays removed.
  const draftTribes = draft.tribes ?? [];
  const seedInvite =
    inviteTribe !== null &&
    (profile?.onboardingStep ?? 0) < 3 &&
    !draftTribes.some((t) => t.id === inviteTribe.id);
  const tribes = seedInvite ? [inviteTribe, ...draftTribes] : draftTribes;

  const initialState: FlowState = {
    profile: {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      username: profile?.username ?? "",
      description: profile?.description ?? "",
      gender: profile?.gender ?? "",
      image: profile?.image ?? null,
    },
    tribes,
    favouriteGames: draft.favouriteGames ?? [],
    claimedCount: 0,
  };

  // Resume where they left off, but never on the completion screen.
  const initialStep = Math.min(profile?.onboardingStep ?? 0, TOTAL_STEPS - 1);

  return (
    <OnboardingFlow
      userId={user.id}
      email={user.email!}
      initialStep={initialStep}
      initialState={initialState}
      defaultImageUrl={GENERIC_IMAGE_URL}
    />
  );
};

const Page = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    }
  >
    <OnboardingContent />
  </Suspense>
);

export default Page;
