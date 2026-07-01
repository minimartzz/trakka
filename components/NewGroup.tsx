"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Loader2, Minus, Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useActionState, useEffect, useMemo, useState } from "react";
import TribeImageUploader from "@/components/TribeImageUploader";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  onAdd: () => void;
  onRemoveLast: () => void;
}

interface PlayerCardProps {
  player: Player;
  selectablePlayers: SelectablePlayers[];
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  locked?: boolean;
}

interface NewGroupProps {
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    username: string;
  };
  className?: string;
  label?: string;
}

type FormState = {
  ok: false;
  fields: { groupName: string; description: string };
} | null;

const GENERIC_GROUP_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/avatars/tribe/default_tribe.png`;

// One-line summary of what each role grants, surfaced inline as a tooltip.
const ROLE_DESCRIPTIONS: Record<string, string> = {
  SuperAdmin:
    "Full control: manage members, edit any session, delete the tribe.",
  Admin: "Manage members and edit any session.",
  Member: "Log and edit their own sessions.",
};

const PlayerController = ({
  players,
  onAdd,
  onRemoveLast,
}: PlayerControllerProps) => {
  return (
    <div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-l-md shadow-none focus-visible:z-10"
        onClick={onRemoveLast}
        disabled={players.length <= 1}
      >
        <Minus className="w-4 h-4" />
        <span className="sr-only">Remove last player</span>
      </Button>
      <span className="bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium">
        {players.length}
      </span>
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
        onClick={onAdd}
      >
        <Plus className="w-4 h-4" />
        <span className="sr-only">Add player</span>
      </Button>
    </div>
  );
};

const PlayerCard = ({
  player,
  selectablePlayers,
  onUpdate,
  onRemove,
  canRemove,
  locked = false,
}: PlayerCardProps) => {
  const currentRoleName =
    Object.keys(Roles).find(
      (name) => Roles[name as keyof typeof Roles] === player.role,
    ) ?? undefined;

  return (
    <Card
      key={player.id}
      className="group relative w-full overflow-hidden border-muted-foreground/20 rounded-md shadow-none"
    >
      {/* Remove this player */}
      {canRemove && !locked && (
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="absolute right-2 top-1 z-20 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(player.id)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove this player</span>
        </Button>
      )}

      <CardContent className="relative z-10 py-0 px-3 sm:px-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Player Input */}
          <div className="w-full md:max-w-lg md:flex-1 md:pr-0">
            <Label className="text-muted-foreground mb-2">Player Name</Label>
            {locked ? (
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                {`${player.firstName} ${player.lastName} (you)`}
              </div>
            ) : (
              <PlayerInput
                selectablePlayers={selectablePlayers}
                playerId={player.id}
                playerSelect={onUpdate}
                openOnFocus={false}
              />
            )}
          </div>

          {/* Role */}
          <div>
            <Label className="text-muted-foreground mb-2">Role</Label>
            <Select
              value={currentRoleName}
              onValueChange={(roleName) => {
                const roleValue = Roles[roleName as keyof typeof Roles];
                onUpdate(player.id, { role: roleValue });
              }}
            >
              <SelectTrigger>
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
        </div>
      </CardContent>
    </Card>
  );
};

const NewGroup: React.FC<NewGroupProps> = ({ user, className, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Singleton uuid creation - second tribe never collides on primary key
  const [groupId, setGroupId] = useState(() => uuidv4());
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(null);
  const [selectablePlayers, setSelectablePlayers] = useState<
    SelectablePlayers[]
  >([]);

  // Row 1 is always the creator, pre-assigned as SuperAdmin and locked.
  const makeCreatorRow = (): Player => ({
    id: "creator",
    profileId: user.id,
    firstName: user.firstName,
    lastName: user.lastName ?? "",
    username: user.username,
    role: Roles.SuperAdmin,
  });

  const [players, setPlayers] = useState<Player[]>([makeCreatorRow()]);
  const router = useRouter();

  const handleImageUrlChange = (url: string | null) => {
    setGroupPictureUrl(url);
  };

  const handleAddPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: `player-${Date.now()}`,
        profileId: 0,
        firstName: "",
        lastName: "",
        username: "",
        role: Roles.Member,
      },
    ]);
  };

  const handleRemoveLast = () => {
    setPlayers((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, ...updates } : player,
      ),
    );
  };

  const resetForm = () => {
    setGroupId(uuidv4());
    setGroupPictureUrl(null);
    setPlayers([makeCreatorRow()]);
  };

  // Get a list of selectable players (excluding the creator, already in row 1)
  useEffect(() => {
    const fetchSelectablePlayers = async () => {
      try {
        const response = await getAllPlayers();

        if (response.success) {
          setSelectablePlayers(
            (response.data ?? []).filter((p) => p.profileId !== user.id),
          );
        } else {
          setSelectablePlayers([]);
          toast.error(response.message);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchSelectablePlayers();
  }, [user.id]);

  // Players already chosen, so they can't be picked twice across rows.
  const takenProfileIds = useMemo(
    () => new Set(players.map((p) => p.profileId).filter((id) => id !== 0)),
    [players],
  );

  // Handling form submission
  const handleSubmit = async (
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> => {
    const groupName = (formData.get("groupname") as string)?.trim();
    const description = (formData.get("description") as string) ?? "";
    const fail = (): FormState => ({
      ok: false,
      fields: { groupName, description },
    });

    // 1. Every non-creator row must have a player selected
    if (players.some((player) => player.profileId === 0)) {
      toast.error(
        "Please select a player for every row, or remove empty rows.",
      );
      return fail();
    }
    // 2. No duplicate players
    const ids = players.map((p) => p.profileId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Each player can only be added once.");
      return fail();
    }
    // 3. At least one SuperAdmin (guaranteed by the locked creator row, but
    //    kept as a guard in case that ever changes)
    if (!players.some((player) => player.role === Roles.SuperAdmin)) {
      toast.error("Your tribe needs at least one SuperAdmin.");
      return fail();
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const tribePayload = {
      id: groupId,
      image: groupPictureUrl ?? GENERIC_GROUP_URL,
      name: groupName,
      description: description,
      dateCreated: today,
      lastUpdated: today,
      createdBy: user.id,
    };

    const playersPayload = players.map((player) => ({
      profileId: player.profileId,
      groupId: groupId,
      roleId: player.role,
    }));

    try {
      const response = await createTribe(tribePayload, playersPayload);
      if (!response.success) {
        toast.error("Couldn't create the tribe. Please try again.");
        return fail();
      }

      toast.success(`Tribe ${tribePayload.name} created successfully! 🎉`);
      setIsOpen(false);
      resetForm();
      router.push(`/tribe/${groupId}`);
      return null;
    } catch (error) {
      console.error("Error creating tribe:", error);
      toast.error("Couldn't create the tribe. Please try again.");
      return fail();
    }
  };
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    handleSubmit,
    null,
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger className={className} aria-label={label ?? "Create tribe"}>
        <Plus className="h-4 w-4 p-0 cursor-pointer" />
        {label && <span>{label}</span>}
      </DialogTrigger>
      <DialogContent className="p-4 sm:p-6 w-[95%] sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tribe</DialogTitle>
          <DialogDescription>
            Make a new gaming tribe and compare your stats directly with friends
          </DialogDescription>
        </DialogHeader>
        <Form action={formAction}>
          <div className="flex flex-col justify-center items-center gap-y-5 w-full min-w-0">
            <div className="w-full max-w-full">
              <TribeImageUploader
                tribeId={groupId}
                onImageUrlChange={handleImageUrlChange}
                initialImageUrl={groupPictureUrl}
                defaultImageUrl={GENERIC_GROUP_URL}
              />
            </div>
          </div>

          {/* Group information */}
          <div className="flex flex-col items-center gap-y-5">
            <div className="w-full">
              <Label htmlFor="groupname" className="mb-2">
                Tribe Name
              </Label>
              <Input
                id="groupname"
                name="groupname"
                placeholder="e.g. Friday Night Gamers"
                defaultValue={state?.fields.groupName ?? ""}
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
                placeholder="What's this tribe about? (optional)"
                defaultValue={state?.fields.description ?? ""}
              />
            </div>
          </div>

          {/* Player information */}
          <div className="flex flex-col mt-6 gap-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label>Players</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="About roles"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="w-60 max-w-60 text-wrap">
                      <ul className="space-y-1 text-xs">
                        {Object.entries(ROLE_DESCRIPTIONS).map(
                          ([name, desc]) => (
                            <li key={name}>
                              <span className="font-medium">{name}:</span>{" "}
                              {desc}
                            </li>
                          ),
                        )}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <PlayerController
                players={players}
                onAdd={handleAddPlayer}
                onRemoveLast={handleRemoveLast}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              You&apos;re the SuperAdmin of this tribe. Add the friends you play
              with.
            </p>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selectablePlayers={selectablePlayers.filter(
                  (p) =>
                    !takenProfileIds.has(p.profileId) ||
                    p.profileId === player.profileId,
                )}
                onUpdate={handleUpdatePlayer}
                onRemove={handleRemovePlayer}
                canRemove={players.length > 1}
                locked={player.id === "creator"}
              />
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Tribe"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroup;
