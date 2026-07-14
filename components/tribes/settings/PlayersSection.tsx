"use client";

import { AnonymousMember } from "@/app/(account)/tribe/[id]/edit/data";
import AnonymousPlayersSection from "@/components/tribes/settings/AnonymousPlayersSection";
import MembersSection, {
  MemberRow,
} from "@/components/tribes/settings/MembersSection";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Ghost, Users } from "lucide-react";
import React from "react";

interface PlayersSectionProps {
  groupId: string;
  players: MemberRow[];
  setPlayers: React.Dispatch<React.SetStateAction<MemberRow[]>>;
  anonymousMembers: AnonymousMember[];
  currentProfileId: number;
}

const PlayersSection = ({
  groupId,
  players,
  setPlayers,
  anonymousMembers,
  currentProfileId,
}: PlayersSectionProps) => {
  return (
    <section>
      <h2 className="text-lg font-semibold">Players</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Add players, change roles, or remove members. Changes apply when you
        save.
      </p>

      <Tabs defaultValue="members">
        <TabsList className="h-10">
          <TabsTrigger
            value="members"
            className="gap-2 px-4 text-muted-foreground data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:font-semibold"
          >
            <Users className="h-4 w-4" />
            Members
            <span className="tabular-nums opacity-70">{players.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="anonymous"
            className="gap-2 px-4 text-muted-foreground data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:font-semibold"
          >
            <Ghost className="h-4 w-4" />
            Anonymous
            <span className="tabular-nums opacity-70">
              {anonymousMembers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersSection
            groupId={groupId}
            players={players}
            setPlayers={setPlayers}
            currentProfileId={currentProfileId}
          />
        </TabsContent>

        <TabsContent value="anonymous" className="mt-4">
          <AnonymousPlayersSection members={anonymousMembers} />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default PlayersSection;
