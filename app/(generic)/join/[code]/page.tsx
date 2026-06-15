import { createRequestLoggedIn } from "@/app/(generic)/join/[code]/action";
import LoadingSpinner from "@/components/icons/LoadingSpinner";
import RedirectButton from "@/components/RedirectButton";
import InviteLoginClient from "@/components/tribes/InviteLoginClient";
import { groupTable } from "@/db/schema/group";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import fetchUser from "@/utils/fetchServerUser";
import { eq } from "drizzle-orm";
import { Suspense } from "react";

// Interfaces
interface HeaderContentProps {
  userFirstName?: string;
  inviteeFirstName: string;
  inviteeGroupName: string;
}

// Get the group name and invited user
const getInvitee = async (code: string) => {
  try {
    const result = await db
      .select()
      .from(groupInvitesTable)
      .leftJoin(groupTable, eq(groupTable.id, groupInvitesTable.groupId))
      .leftJoin(profileTable, eq(profileTable.id, groupInvitesTable.createdBy))
      .where(eq(groupInvitesTable.code, code))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("Failed to find invite link code", error);
    return;
  }
};

// Header info
const HeaderContent = ({
  inviteeFirstName,
  inviteeGroupName,
  userFirstName,
}: HeaderContentProps) => {
  return userFirstName ? (
    <h2 className="text-2xl sm:text-3xl font-heading font-semibold sm:max-w-3xl max-w-sm">
      {`Hi, ${userFirstName}`}
      <br />
      <span className="text-primary font-semibold">{inviteeFirstName}</span>
      {" has invited you to join "}
      <span className="text-primary font-semibold">{inviteeGroupName}</span>
    </h2>
  ) : (
    <h2 className="text-2xl sm:text-3xl font-heading font-semibold">
      Hello!
      <br />
      <span className="text-primary font-semibold">{inviteeFirstName}</span>
      {" has invited you to join "}
      <span className="text-primary font-semibold">{inviteeGroupName}</span>
    </h2>
  );
};

const JoinContent = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}) => {
  const { code } = await params;
  const user = await fetchUser();
  const inviteeInfo = await getInvitee(code);
  const profile = inviteeInfo?.profile;
  const group = inviteeInfo?.group;

  // If provided an invalid invite link
  if (!inviteeInfo || !profile || !group) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-background">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-foreground p-4 text-center">
            Invalid Invite Link
          </h1>
          <p className="text-muted-foreground text-center">
            We apologise for the inconvenience caused, please request for a new
            invite link
          </p>
          <RedirectButton
            url="/dashboard"
            label="Return to Dashboard"
            loadLabel="Redirecting to dashboard ..."
            className="m-8"
          />
        </div>
      </div>
    );
  }

  if (user) {
    const joinGroupAction = createRequestLoggedIn.bind(
      null,
      code,
      group.id,
      user.id,
    );

    return (
      <div className="flex min-h-screen justify-center items-center bg-background">
        <div className="flex flex-col gap-y-5">
          <HeaderContent
            userFirstName={user.first_name}
            inviteeFirstName={profile.firstName}
            inviteeGroupName={group.name}
          />
          <h2>{`Click on the button below to request to join`}</h2>

          <form action={joinGroupAction}>
            <RedirectButton
              label="Request to Join"
              loadLabel="Joining ..."
              type="submit"
              size="lg"
            />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center items-center bg-background">
      <div className="flex flex-col gap-y-10">
        <HeaderContent
          inviteeFirstName={profile.firstName}
          inviteeGroupName={group.name}
        />
        <InviteLoginClient />
      </div>
    </div>
  );
};

const JoinFallback = () => (
  <div className="flex min-h-screen justify-center items-center bg-background">
    <LoadingSpinner />
  </div>
);

const Page = ({ params }: { params: Promise<{ code: string }> }) => {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinContent params={params} />
    </Suspense>
  );
};

export default Page;
