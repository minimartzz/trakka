"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useActionState, useEffect, useState } from "react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Roles } from "@/lib/interfaces";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { getAllPlayers } from "@/components/actions/fetchPlayers";
import { Card, CardContent } from "@/components/ui/card";
import PlayerInput from "@/components/PlayerInput";
import Form from "next/form";
import { format } from "date-fns";
import { createTribe } from "@/components/actions/newGroup";

interface SelectablePlayers {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
}

interface Player extends SelectablePlayers {
  id: string;
  role: number;
}

interface PlayerControllerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

interface PlayerCardProps {
  player: Player;
  players: Player[];
  selectablePlayers: SelectablePlayers[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

interface NewGroupProps {
  user: {
    id: number;
    firstName: string;
    username: string;
  };
  className?: string;
}

const groupId = uuidv4();
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
      role: 0,
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
  const handleReducePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
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
            />
          </div>

          {/* Role */}
          <div>
            <Label className="text-muted-foreground mb-2">Role</Label>
            <Select
              onValueChange={(roleName) => {
                const roleValue = Roles[roleName as keyof typeof Roles];
                handleUpdates(player.id, { role: roleValue });
              }}
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

const NewGroup: React.FC<NewGroupProps> = ({ user, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(null);
  const [selectablePlayers, setSelectablePlayers] = useState<
    SelectablePlayers[]
  >([]);
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      profileId: 0,
      firstName: "",
      lastName: "",
      username: "",
      role: 0,
    },
  ]);
  const router = useRouter();

  const handleImageUrlChange = (url: string | null) => {
    setGroupPictureUrl(url);
  };

  // Get a list of selectable players
  useEffect(() => {
    const fetchSelectablePlayers = async () => {
      try {
        const response = await getAllPlayers();

        if (response.success) {
          setSelectablePlayers(response.data!);
        } else {
          setSelectablePlayers([]);
          toast.error(response.message);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchSelectablePlayers();
  }, []);

  // Handling form submission
  const handleSubmit = async (prevState: any, formData: FormData) => {
    const groupName = formData.get("groupname") as string;
    const description = formData.get("description") as string;

    // Field checks on players
    // 1. Check if any player is empty
    const hasEmptyPlayer = players.some((player) => player.profileId === 0);
    if (hasEmptyPlayer) {
      toast.error("Please ensure all players are selected.");
      return { fields: { groupName: groupName, description: description } };
    }
    // 2. Check if there is at least 1 superadmin
    const hasSuperAdmin = players.some((player) => player.role === 1);
    if (!hasSuperAdmin) {
      toast.error(
        "Please ensure at least one player is has the SuperAdmin role.",
      );
      return { fields: { groupName: groupName, description: description } };
    }

    // Create payloads
    const tribePayload = {
      id: groupId,
      image: groupPictureUrl ?? GENERIC_GROUP_URL,
      name: groupName,
      description: description,
      dateCreated: format(new Date(), "yyyy-MM-dd"),
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
      createdBy: user.id,
    };

    const playersPayload = players.map((player) => ({
      profileId: player.profileId,
      groupId: groupId,
      roleId: player.role,
    }));
    console.log(playersPayload);

    // Insert entries into tables
    try {
      const response = await createTribe(tribePayload, playersPayload);
      if (!response.success) {
        toast.error("Failed to create tribe. Please try again later.");
        return { fields: { groupName: groupName, description: description } };
      }

      // On success redirect and close window
      toast.success(`Tribe ${tribePayload.name} created successfully! 🎉`);
      setIsOpen(false);
      router.push(`/tribe/${groupId}`);
    } catch (error) {
      console.error("Error creating tribe:", error);
      toast.error("Failed to create tribe. Please try again later.");
      return { fields: { groupName: groupName, description: description } };
    }
  };
  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className={`${className}`}>
        <Plus className="h-4 w-4 p-0 cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="p-4 sm:p-6 w-[95%] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tribe</DialogTitle>
          <DialogDescription>
            Make a new gaming tribe and compare your stats directly with friends
          </DialogDescription>
        </DialogHeader>
        <Form action={formAction}>
          <div className="flex flex-col justify-center items-center gap-y-5 w-full min-w-0">
            <div className="w-full max-w-full">
              <ProfilePictureUploader
                userId={groupId}
                onImageUrlChange={handleImageUrlChange}
                initialImageUrl={groupPictureUrl}
                defaultImageUrl={GENERIC_GROUP_URL}
                path="groups"
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400 italic">
                  Please make sure your image file does not contain a
                  &quot;.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Group information */}
          <div className="flex flex-col items-center gap-y-5">
            <div className="w-full">
              <Label htmlFor="groupname" className="mb-2">
                Group Name
              </Label>
              <Input
                id="groupname"
                name="groupname"
                defaultValue={state?.fields.groupName || ""}
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
                defaultValue={state?.fields.description}
              />
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

          <div className="pt-3">
            <Button
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="flex items-center gap-2">Creating...</span>
                </div>
              ) : (
                "Create Tribe"
              )}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroup;
