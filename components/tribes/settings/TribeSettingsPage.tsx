"use client";

import { saveTribeSettings } from "@/app/(account)/tribe/[id]/edit/action";
import {
  AnonymousMember,
  SettingsMember,
  SettingsTribe,
} from "@/app/(account)/tribe/[id]/edit/data";
import DetailsSection from "@/components/tribes/settings/DetailsSection";
import PlayersSection from "@/components/tribes/settings/PlayersSection";
import { MemberRow } from "@/components/tribes/settings/MembersSection";
import { Button } from "@/components/ui/button";
import { Roles } from "@/lib/interfaces";
import { Loader2 } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import React, { useActionState, useState } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";

const GENERIC_GROUP_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/avatars/tribe/default_tribe.png`;

interface TribeSettingsPageProps {
  tribe: SettingsTribe;
  members: SettingsMember[];
  anonymousMembers: AnonymousMember[];
  currentProfileId: number;
}

const TribeSettingsPage = ({
  tribe,
  members,
  anonymousMembers,
  currentProfileId,
}: TribeSettingsPageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(tribe.image);
  // The Members tab only shows real members; anonymous members are managed
  // in their own tab. They must still be preserved in the saved list, so we
  // keep them aside and merge them back into the payload on Save.
  const preservedAnonMembers = members.filter((m) => m.isAnonymous);
  const [players, setPlayers] = useState<MemberRow[]>(
    members.filter((m) => !m.isAnonymous),
  );
  const router = useRouter();

  const handleSubmit = async (prevState: unknown, formData: FormData) => {
    // Rows the user removed or added-but-never-picked don't get saved
    const stagedMembers = players.filter(
      (p) => !p.markedForRemoval && p.profileId > 0,
    );

    if (!stagedMembers.some((p) => p.roleId === Roles.SuperAdmin)) {
      toast.error("A tribe must keep at least one SuperAdmin.");
      return;
    }

    formData.append("groupImage", imageUrl || GENERIC_GROUP_URL);
    const result = await saveTribeSettings(
      tribe.id,
      formData,
      [...stagedMembers, ...preservedAnonMembers].map(
        ({ profileId, roleId }) => ({ profileId, roleId }),
      ),
    );

    if (result.success) {
      posthog.capture("tribe_settings_saved", {
        member_count: stagedMembers.length,
      });
      toast.success(result.message);
      router.push(`/tribe/${tribe.id}`);
    } else {
      toast.error(result.message);
    }
  };
  const [, formAction, pending] = useActionState(handleSubmit, null);

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <h1 className="mb-8 text-3xl font-bold">Tribe Settings</h1>

      <Form action={formAction} className="flex flex-col gap-10">
        <DetailsSection
          tribeId={tribe.id}
          name={tribe.name}
          description={tribe.description}
          imageUrl={imageUrl}
          defaultImageUrl={GENERIC_GROUP_URL}
          onImageUrlChange={setImageUrl}
        />

        <PlayersSection
          groupId={tribe.id}
          players={players}
          setPlayers={setPlayers}
          anonymousMembers={anonymousMembers}
          currentProfileId={currentProfileId}
        />

        <div className="flex w-full items-center justify-end gap-x-3">
          <Button variant="outline" type="button" disabled={pending} asChild>
            <Link href={`/tribe/${tribe.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TribeSettingsPage;
