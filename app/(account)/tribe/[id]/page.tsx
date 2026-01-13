import RequestInbox from "@/components/tribes/RequestInbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import fetchUser from "@/utils/fetchServerUser";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Calendar, Crown, Gavel, Settings, Users2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// Interfaces & Types
interface TribeDetailsInterface {
  group: typeof groupTable.$inferSelect;
  profile: typeof profileTable.$inferSelect | null;
}

interface TribeMemberInterface {
  profile_group: typeof profileGroupTable.$inferSelect;
  profile: typeof profileTable.$inferSelect | null;
}

// Static DB calls
const getTribeMembers = async (groupId: string) => {
  const members = await db
    .select()
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));

  return members;
};

const getTribeDetails = async (groupId: string) => {
  const tribeDetails = await db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));

  return tribeDetails;
};

// Formatting functions
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "dd MMM yyyy");
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const tribeId = (await params).id;
  const user = await fetchUser();
  const tribeMembers: TribeMemberInterface[] = await getTribeMembers(tribeId);
  const tribeDetails: TribeDetailsInterface = (
    await getTribeDetails(tribeId)
  )[0];

  // User role
  const roleId = tribeMembers.filter(
    (tribeMember) => tribeMember.profile_group.profileId === user.id
  )[0].profile_group.roleId;

  // Get tribe admins
  const tribeAdmins = tribeMembers.filter(
    (tribeMember) => tribeMember.profile_group.roleId === 1
  );

  return (
    <div className="p-12">
      <div className="flex flex-col md:flex-row gap-x-7 items-center justify-center">
        <div className="relative">
          <div className="relative w-42 h-42 rounded-2xl overflow-hidden">
            <Image
              src={tribeDetails.group.image!}
              alt="Tribe picture"
              className="object-cover"
              fill
            />
          </div>
          {roleId === 1 && (
            <Button
              className="sm:hidden absolute top-0 right-[-80px] dark:text-background text-foreground ml-auto font-semibold bg-gray-500 hover:bg-gray-600 p-2"
              asChild
            >
              <Link
                className="dark:text-black text-white"
                href={`/tribe/${tribeId}/edit`}
              >
                <Settings className="dark:text-black text-white" />
              </Link>
            </Button>
          )}
        </div>

        {/* Group Details */}
        <div className="flex flex-col gap-y-1 mt-5 md:mt-0">
          <h1 className="text-4xl font-bold mb-3">{tribeDetails.group.name}</h1>
          <div className="flex items-center gap-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              <p className="text-muted-foreground">{`Formed on: ${formatDate(
                tribeDetails.group.dateCreated
              )}`}</p>
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-sm">
            <Users2 className="h-4 w-4 text-muted-foreground" />
            <span>
              <p className="text-muted-foreground">{`Members: ${tribeMembers.length}`}</p>
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-sm">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <span>
              <p className="text-muted-foreground">{`Created by: ${tribeDetails.profile?.username}`}</p>
            </span>
          </div>
        </div>

        {/* Group Management */}
        <div className="w-full lg:w-70 md:w-40 md:ml-auto md:self-start mt-5 md:mt-0">
          <div className="flex flex-col gap-y-3 items-end">
            <div className="flex flex-between">
              {/* Admin Button */}
              {roleId === 1 && (
                <div className="flex flex-between">
                  <RequestInbox profileId={user.id} tribeId={tribeId} />
                  <Button
                    className="hidden md:block dark:text-background text-foreground font-semibold bg-muted-foreground hover:bg-gray-500"
                    asChild
                  >
                    <Link
                      className="dark:text-black text-white"
                      href={`/tribe/${tribeId}/edit`}
                    >
                      <span className="flex items-center gap-x-2">
                        <Settings className="dark:text-black text-white" />
                        Settings
                      </span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Admins */}
            <Card className="rounded-sm shadow-lg pt-0 max-w-sm w-full">
              <CardHeader className="bg-primary text-foreground rounded-t-sm p-2 pb-1">
                <CardTitle className="text-md font-semibold">
                  <span className="flex items-center gap-x-2 justify-center text-white">
                    <Crown className="w-4 h-4" />
                    Admins
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className=" pt-0 pb-0 space-y-1">
                {/* TODO: This needs to be changed to links to profile pages */}
                {tribeAdmins.map((admin) => (
                  <div
                    key={admin.profile_group.id}
                    className="flex items-center space-x-3"
                  >
                    <p>{admin.profile?.username}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <p className="pl-4 mt-8 italic">{`"${tribeDetails.group.description}"`}</p>
      <hr className="mt-4" />
    </div>
  );
};

export default Page;
