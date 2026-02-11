"use client";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Minus, Plus, X } from "lucide-react";
import React, { useActionState, useState } from "react";
import { Roles } from "@/lib/interfaces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { syncTribes } from "@/app/(account)/tribe/[id]/edit/action";
import Form from "next/form";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import PlayerInput from "@/components/PlayerInput";

// Interfaces and Types
interface SelectablePlayers {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic?: string;
}

export interface Player extends SelectablePlayers {
  id: string;
  roleId: number;
}

interface PlayerCardProps {
  player: Player;
  players: Player[];
  selectablePlayers: SelectablePlayers[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

interface PlayerControllerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

interface EditTribesProps {
  tribeId: string;
  profilePic: string;
  groupName: string;
  description: string;
  selectablePlayers: SelectablePlayers[];
  playersDetails: Player[];
}

const GENERIC_GROUP_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/images/groups/generic_group.png`;

const PlayerController = ({ players, setPlayers }: PlayerControllerProps) => {
  const handleReducePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      profileId: 0,
      firstName: "",
      lastName: "",
      username: "",
      roleId: 0,
    };
    setPlayers([...players, newPlayer]);
  };

  return (
    <div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-l-md shadow-none focus-visible:z-10"
        onClick={handleReducePlayer}
        disabled={players.length <= 1}
      >
        <Minus className="w-4 h-4" />
        <span className="sr-only">Remove Player</span>
      </Button>
      <span className="bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium">
        {players.length}
      </span>
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
        onClick={handleAddPlayer}
      >
        <Plus className="w-4 h-4" />
        <span className="sr-only">Add Player</span>
      </Button>
    </div>
  );
};

const PlayerCard = ({
  player,
  players,
  selectablePlayers,
  setPlayers,
}: PlayerCardProps) => {
  const reverseObject = (obj: typeof Roles) => {
    const entries = Object.entries(obj);
    const reversedEntries = entries.map((a) => a.reverse());
    const reversedObject = Object.fromEntries(reversedEntries);

    return reversedObject;
  };
  const reversedRoles = reverseObject(Roles);

  const handleReducePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.filter((p) => p.id !== player.id));
    }
  };

  const handleUpdates = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, ...updates } : player,
      ),
    );
  };
  return (
    <Card
      key={player.id}
      className="group relative w-full overflow-hidden border-muted-foreground/20 bg-card/50 backdrop-blur-sm transition-all hover:border-muted-foreground/50 rounded-md shadow-none"
    >
      {/* Remove Player */}
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="absolute right-2 top-1 z-20 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={handleReducePlayer}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="relative z-10 py-0 px-3 sm:px-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Player Input */}
          <div className="w-full md:max-w-lg md:flex-1 md:pr-0">
            <Label className="text-muted-foreground mb-2">Player Name</Label>
            <PlayerInput
              selectablePlayers={selectablePlayers}
              playerId={player.id}
              playerSelect={handleUpdates}
              playerDetails={player}
            />
          </div>

          {/* Role */}
          <div>
            <Label className="text-muted-foreground mb-2">Role</Label>
            <Select
              onValueChange={(roleName) => {
                const roleValue = Roles[roleName as keyof typeof Roles];
                handleUpdates(player.id, { roleId: roleValue });
              }}
              defaultValue={reversedRoles[player.roleId]}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
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
        </div>
      </CardContent>
    </Card>
  );
};

const EditTribes = ({
  tribeId,
  profilePic,
  groupName,
  description,
  selectablePlayers,
  playersDetails,
}: EditTribesProps) => {
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(
    profilePic,
  );
  const [players, setPlayers] = useState<Player[]>(playersDetails);
  const router = useRouter();

  const handleImageUrlChange = (url: string | null) => {
    setGroupPictureUrl(url);
  };

  // Submit Form
  const handleSubmit = async (prevState: any, formData: FormData) => {
    // ProfileGroup information
    if (!players.some((p) => p.profileId !== 0)) {
      toast.error(
        "Some players have not been selected. Please ensure that all players are filled.",
      );
      return;
    }
    if (!players.some((p) => p.roleId === 1)) {
      toast.error(
        "No SuperAdmin user selected. Please ensure at least one user is a SuperAdmin.",
      );
      return;
    }

    // Creating the form object
    formData.append("groupId", tribeId);
    formData.append("groupImage", groupPictureUrl || GENERIC_GROUP_URL);

    // Making the DB changes
    const result = await syncTribes(formData, players);
    if (result.success) {
      toast.success(result.message);
      router.push(`/tribe/${tribeId}`);
    } else {
      toast.error(result.message);
    }
  };
  const [state, formAction, pending] = useActionState(handleSubmit, null);

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

      <Form action={formAction}>
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
        <div className="flex flex-col mt-6 gap-y-4">
          <div className="flex justify-between items-center">
            <Label>Players</Label>
            <PlayerController players={players} setPlayers={setPlayers} />
          </div>
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              players={players}
              selectablePlayers={selectablePlayers}
              setPlayers={setPlayers}
            />
          ))}
        </div>

        <div className="flex self-end mt-8 gap-x-3 items-center">
          <Button variant="outline" asChild>
            <Link href={`/tribe/${tribeId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="font-semibold bg-add-button hover:bg-green-600 cursor-pointer"
            disabled={pending}
          >
            {pending ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditTribes;
