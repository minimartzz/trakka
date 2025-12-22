"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useState } from "react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PlayerInput from "@/components/PlayerInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Roles } from "@/lib/interfaces";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Player {
  id: string;
  userId: number;
  name: string;
  username: string;
  role: number;
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

const NewGroup: React.FC<NewGroupProps> = ({ user, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      userId: 0,
      name: "",
      username: "",
      role: 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  // Handling form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      // ProfileGroup information
      const playersWithGroup = players.map(({ userId, role }) => ({
        profileId: userId,
        groupId: groupId,
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

      // Group information
      const groupName = formData.get("groupname") as string;
      const description = formData.get("description") as string;
      const date = new Date(Date.now());
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const formattedDateLocal = `${year}-${String(month).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const groupData = {
        id: groupId,
        name: groupName,
        description: description,
        gamesPlayed: 0,
        image: groupPictureUrl || GENERIC_GROUP_URL,
        createdBy: user.id,
        dateCreated: formattedDateLocal,
        lastUpdated: formattedDateLocal,
      };

      // Full data
      const payload = {
        gD: groupData,
        pWG: playersWithGroup,
      };

      const response = await fetch("/api/group/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      // On Success
      toast.success("Success! 🎉", {
        description: `Group ${groupName} successfully created. Redirecting...`,
        position: "bottom-right",
        className: "bg-add-button",
      });

      // Close dialog and redirect to Recent Games
      setIsOpen(false);
      router.push(`/tribe/${groupId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Submission Error:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* TODO: Form action component */}
      <DialogTrigger className={`${className}`}>
        <Plus className="h-4 w-4 p-0 cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="p-4 sm:p-6 w-[95%] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Make a new gaming group and compare your stats directly with friends
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
              <Input id="groupname" name="groupname" required />
            </div>
            <div className="w-full">
              <Label htmlFor="description" className="mb-2">
                Description
              </Label>
              <Textarea id="description" name="description" />
            </div>
          </div>

          {/* Player information */}
          <div className="my-3">
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
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-sm text-muted-foreground font-medium border rounded-lg bg-muted/30 mb-2">
              <div className="flex-[2] min-w-0">Player</div>
              <div className="w-75 text-center">Role</div>
            </div>
            {players.map((player, idx) => (
              <div key={player.id} className="gap-4 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 items-start sm:items-center gap-3 sm:gap-4 p-3 border rounded-lg bg-card">
                  <div className="col-span-1 sm:col-span-3 min-w-0">
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

                  <div className="col-start-1 sm:col-start-auto col-span-1 min-w-0">
                    <Label className="block sm:hidden mb-1.5 text-xs font-semibold text-muted-foreground tracking-wide">
                      Role
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        updatePlayerRole(player.id, value)
                      }
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
          </div>
          <div className="pt-3">
            <Button
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroup;
