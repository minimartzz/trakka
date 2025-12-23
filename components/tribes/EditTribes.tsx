"use client";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import React, { useState } from "react";
import { Roles } from "@/lib/interfaces";
import PlayerInput from "@/components/PlayerInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syncTribes } from "@/app/(account)/tribe/[id]/edit/action";
import Form from "next/form";
import { useFormStatus } from "react-dom";
import Link from "next/link";

// Interfaces and Types
interface Player {
  id: string;
  userId: number;
  name: string;
  username: string;
  role: number;
}

interface EditTribesProps {
  tribeId: string;
  profilePic: string;
  groupName: string;
  description: string;
  playersDetails: Player[];
}

const GENERIC_GROUP_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/images/groups/generic_group.png`;

const EditTribes = ({
  tribeId,
  profilePic,
  groupName,
  description,
  playersDetails,
}: EditTribesProps) => {
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(
    profilePic
  );
  const [players, setPlayers] = useState<Player[]>(playersDetails);
  const router = useRouter();

  const reverseObject = (obj: typeof Roles) => {
    const entries = Object.entries(obj);
    const reversedEntries = entries.map((a) => a.reverse());
    const reversedObject = Object.fromEntries(reversedEntries);

    return reversedObject;
  };
  const reversedRoles = reverseObject(Roles);

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <div className="flex mt-8 gap-x-3 items-center">
        <Button variant="outline" asChild>
          <Link href={`/tribe/${tribeId}`}>Cancel</Link>
        </Button>
        <Button
          type="submit"
          className="font-semibold bg-add-button hover:bg-green-600 cursor-pointer"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );
  };

  const handleImageUrlChange = (url: string | null) => {
    setGroupPictureUrl(url);
  };

  // Player controls
  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      userId: 0,
      name: "",
      username: "",
      role: 0,
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter((player) => player.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string, userId: number) => {
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, name, userId } : player
      )
    );
  };

  const updatePlayerRole = (id: string, value: string) => {
    setPlayers(
      players.map((player) =>
        player.id === id
          ? { ...player, role: Roles[value as keyof typeof Roles] }
          : player
      )
    );
  };

  // Submit Form
  const handleSubmit = async (formData: FormData) => {
    // ProfileGroup information
    const playersWithGroup = players.map(({ userId, role }) => ({
      profileId: userId,
      groupId: tribeId,
      roleId: role,
    }));

    if (!playersWithGroup.some((p) => p.roleId === 1)) {
      toast.error("Error: No Admin user selected", {
        description:
          "Every group must contain at least one Admin user. Please select one",
        position: "bottom-right",
        className: "bg-destructive",
      });
      return;
    }

    const profileGroupList = JSON.stringify(playersWithGroup);
    formData.append("groupId", tribeId);
    formData.append("groupImage", groupPictureUrl || GENERIC_GROUP_URL);
    formData.append("profileGroupList", profileGroupList);

    const result = await syncTribes(formData);

    if (result.success) {
      toast.success(result.message);
      router.push(`/tribe/${tribeId}`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="p-0 lg:p-12 lg:w-full">
      {/* Group Profile Picture */}
      <div>
        <ProfilePictureUploader
          userId={tribeId}
          onImageUrlChange={handleImageUrlChange}
          initialImageUrl={groupPictureUrl}
          defaultImageUrl={GENERIC_GROUP_URL}
          path="groups"
        />
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 italic">
            Please make sure your image file does not contain a &quot;.&quot;
          </p>
        </div>
      </div>

      <Form action={handleSubmit}>
        {/* Group information */}
        <div className="my-3">
          <div className="flex flex-col items-center gap-y-5">
            <div className="w-full">
              <Label htmlFor="groupName" className="mb-2">
                Group Name
              </Label>
              <Input
                id="groupName"
                name="groupName"
                defaultValue={groupName}
                required
              />
            </div>
            <div className="w-full">
              <Label htmlFor="description" className="mb-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={description}
              />
            </div>
          </div>
        </div>

        {/* Player information */}
        <div className="my-12">
          <div className="flex justify-between items-center mb-3">
            <Label>Players</Label>
            <Button
              type="button"
              onClick={addPlayer}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 bg-add-button font-semibold cursor-pointer"
              data-testid="add-player-button"
              tabIndex={0}
            >
              <Plus className="h-4 w-4" />
              Add Player
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Select players using @ at the start and select. If user does not
            exist, please ask them to create an account
          </div>
          <div className="hidden sm:grid sm:grid-cols-9 items-center gap-4 px-3 py-2 text-sm text-muted-foreground font-medium border rounded-lg bg-muted/30 mb-2">
            <div className="col-span-5 min-w-0">Player</div>
            <div className="w-75 text-center">Role</div>
          </div>
          {players.map((player, idx) => (
            <div key={player.id} className="gap-4 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-9 items-start sm:items-center gap-3 sm:gap-4 p-3 border rounded-lg bg-card">
                <div className="col-span-1 sm:col-span-6 min-w-0">
                  <Label className="block sm:hidden text-xs font-semibold text-muted-foreground tracking-wide">
                    Player
                  </Label>
                  <PlayerInput
                    value={`${player.name}`}
                    onChange={(name, userId) =>
                      updatePlayerName(player.id, name, userId!)
                    }
                    placeholder={`Player ${idx + 1}`}
                    tabIndex={idx * 4 + 1}
                    className="w-full"
                  />
                </div>

                <div className="col-start-1 sm:col-start-auto sm:col-span-2 col-span-1 min-w-0">
                  <Label className="block sm:hidden mb-1.5 text-xs font-semibold text-muted-foreground tracking-wide">
                    Role
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updatePlayerRole(player.id, value)
                    }
                    defaultValue={reversedRoles[player.role.toString()]}
                  >
                    <SelectTrigger className="sm:w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(Roles).map((role) => (
                        <SelectItem value={role} key={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-start-2 row-start-1 row-span-2 sm:row-span-1 sm:col-start-auto flex items-center justify-center h-full sm:h-auto pt-6 sm:pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                    className="p-2 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] shrink-0"
                    disabled={players.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <SubmitButton />
          </div>
        </div>
      </Form>
    </div>
  );
};

export default EditTribes;
