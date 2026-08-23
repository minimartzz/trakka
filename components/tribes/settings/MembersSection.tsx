"use client";

import { SettingsMember } from "@/app/(account)/tribe/[id]/edit/data";
import MemberProfilePicker, {
  PickedProfile,
} from "@/components/tribes/settings/MemberProfilePicker";
import RoleSelect from "@/components/tribes/settings/RoleSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Roles } from "@/lib/interfaces";
import { Pencil, Search, UserMinus, UserPlus, Undo2 } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";

// A staged member row. Real members carry a positive profileId; a freshly
// added row starts with a temporary negative id until a profile is picked.
export interface MemberRow extends SettingsMember {
  isNew?: boolean;
  markedForRemoval?: boolean;
}

interface MembersSectionProps {
  groupId: string;
  players: MemberRow[];
  setPlayers: React.Dispatch<React.SetStateAction<MemberRow[]>>;
  currentProfileId: number;
}

let tempIdCounter = -1;

const MemberAvatar = ({ member }: { member: MemberRow }) => (
  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
    {member.profilePic && (
      <Image
        src={member.profilePic}
        alt=""
        fill
        sizes="32px"
        className="object-cover"
      />
    )}
  </div>
);

const MembersSection = ({
  groupId,
  players,
  setPlayers,
  currentProfileId,
}: MembersSectionProps) => {
  const [filter, setFilter] = useState("");
  // The row id (temp negative) whose inline picker should grab focus
  const [focusRowId, setFocusRowId] = useState<number | null>(null);

  const superAdminCount = players.filter(
    (p) => p.roleId === Roles.SuperAdmin && !p.markedForRemoval,
  ).length;

  const filteredPlayers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      // Unresolved new rows always stay visible so they can be filled in
      if (p.isNew && p.profileId < 0) return true;
      return (
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
      );
    });
  }, [players, filter]);

  const stagedProfileIds = players
    .filter((p) => p.profileId > 0)
    .map((p) => p.profileId);

  // An unresolved new row (added but no profile picked yet) blocks adding
  // another until it's filled in.
  const hasUnresolvedRow = players.some((p) => p.isNew && p.profileId < 0);

  const handleRoleChange = (profileId: number, newRoleId: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.profileId === profileId ? { ...p, roleId: newRoleId } : p,
      ),
    );
  };

  const handleAddRow = () => {
    const tempId = tempIdCounter--;
    setPlayers((prev) => [
      ...prev,
      {
        profileId: tempId,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
        isAnonymous: false,
        roleId: Roles.Member,
        sessionsPlayed: null,
        isNew: true,
      },
    ]);
    setFocusRowId(tempId);
  };

  const handlePickProfile = (rowId: number, picked: PickedProfile) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.profileId === rowId
          ? {
              ...p,
              profileId: picked.profileId,
              firstName: picked.firstName,
              lastName: picked.lastName,
              username: picked.username,
              profilePic: picked.profilePic,
            }
          : p,
      ),
    );
    setFocusRowId(null);
  };

  // Return a resolved new row to the picker so a different profile can be chosen
  const handleEditNewRow = (rowId: number) => {
    const tempId = tempIdCounter--;
    setPlayers((prev) =>
      prev.map((p) =>
        p.profileId === rowId
          ? {
              ...p,
              profileId: tempId,
              firstName: "",
              lastName: "",
              username: "",
              profilePic: "",
            }
          : p,
      ),
    );
    setFocusRowId(tempId);
  };

  // New rows are discarded outright; existing members are only marked
  const handleRemove = (row: MemberRow) => {
    if (row.isNew) {
      setPlayers((prev) => prev.filter((p) => p.profileId !== row.profileId));
    } else {
      setPlayers((prev) =>
        prev.map((p) =>
          p.profileId === row.profileId ? { ...p, markedForRemoval: true } : p,
        ),
      );
    }
  };

  const handleUndoRemove = (profileId: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.profileId === profileId ? { ...p, markedForRemoval: false } : p,
      ),
    );
  };

  const roleSelectState = (member: MemberRow, isSelf: boolean) => {
    if (isSelf)
      return {
        disabled: true,
        reason: "Ask another SuperAdmin to change your role",
      };
    if (member.roleId === Roles.SuperAdmin && superAdminCount <= 1)
      return { disabled: true, reason: "Promote another SuperAdmin first" };
    return { disabled: false, reason: undefined };
  };

  const canRemove = (member: MemberRow) => {
    if (member.roleId === Roles.SuperAdmin && superAdminCount <= 1)
      return {
        disabled: true,
        reason: "A tribe must keep at least one SuperAdmin",
      };
    return { disabled: false, reason: undefined };
  };

  const AddMemberButton = ({ className }: { className?: string }) => (
    <Button
      variant="outline"
      type="button"
      onClick={handleAddRow}
      disabled={hasUnresolvedRow}
      className={cn("shrink-0", className)}
    >
      <UserPlus className="h-4 w-4" />
      Add member
    </Button>
  );

  const RemoveOrUndo = ({ member }: { member: MemberRow }) => {
    if (member.markedForRemoval) {
      return (
        <Button
          variant="ghost"
          type="button"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => handleUndoRemove(member.profileId)}
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
      );
    }

    const remove = canRemove(member);
    const memberName = member.isNew
      ? "new player"
      : `${member.firstName} ${member.lastName}`;
    const button = (
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => handleRemove(member)}
        disabled={remove.disabled}
        aria-label={`Remove ${memberName}`}
      >
        <UserMinus className="h-4 w-4" />
      </Button>
    );
    if (remove.disabled && remove.reason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>{remove.reason}</TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  const NameCell = ({ member }: { member: MemberRow }) => {
    const isSelf = member.profileId === currentProfileId;

    // Unresolved new row: show the inline profile picker
    if (member.isNew && member.profileId < 0) {
      return (
        <MemberProfilePicker
          groupId={groupId}
          excludeProfileIds={stagedProfileIds}
          onSelect={(picked) => handlePickProfile(member.profileId, picked)}
          autoFocus={focusRowId === member.profileId}
        />
      );
    }

    return (
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">
              {member.firstName} {member.lastName}
            </span>
            {isSelf && (
              <Badge variant="secondary" className="shrink-0">
                you
              </Badge>
            )}
            {member.isNew && (
              <Badge className="shrink-0 bg-primary/15 text-primary hover:bg-primary/15">
                New
              </Badge>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            @{member.username}
          </div>
        </div>
        {member.isNew && (
          <Button
            variant="ghost"
            type="button"
            size="icon"
            className="ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleEditNewRow(member.profileId)}
            aria-label="Change selected player"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  };

  const rowShade = (member: MemberRow) =>
    cn(
      member.markedForRemoval && "bg-destructive/5 opacity-60",
      member.isNew && !member.markedForRemoval && "bg-primary/5",
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter + add control */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter members..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
            aria-label="Filter members"
          />
        </div>
        <AddMemberButton className="hidden sm:inline-flex" />
      </div>

      {/* Desktop: dense table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="w-44">Role</TableHead>
              <TableHead className="w-24 text-right">
                <span className="sr-only">Remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((member) => {
              const isSelf = member.profileId === currentProfileId;
              const roleState = roleSelectState(member, isSelf);
              const resolved = !member.isNew || member.profileId > 0;
              return (
                <TableRow key={member.profileId} className={rowShade(member)}>
                  <TableCell>
                    <NameCell member={member} />
                  </TableCell>
                  <TableCell>
                    {resolved ? (
                      <RoleSelect
                        roleId={member.roleId}
                        onRoleChange={(newRoleId) =>
                          handleRoleChange(member.profileId, newRoleId)
                        }
                        disabled={roleState.disabled || member.markedForRemoval}
                        disabledReason={roleState.reason}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf && <RemoveOrUndo member={member} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked rows */}
      <ul className="flex flex-col gap-2 md:hidden">
        {filteredPlayers.map((member) => {
          const isSelf = member.profileId === currentProfileId;
          const roleState = roleSelectState(member, isSelf);
          const resolved = !member.isNew || member.profileId > 0;
          return (
            <li
              key={member.profileId}
              className={cn(
                "flex flex-col gap-3 rounded-md border p-3",
                rowShade(member),
              )}
            >
              <div className="flex min-h-11 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <NameCell member={member} />
                </div>
                {!isSelf && <RemoveOrUndo member={member} />}
              </div>
              {resolved && (
                <RoleSelect
                  roleId={member.roleId}
                  onRoleChange={(newRoleId) =>
                    handleRoleChange(member.profileId, newRoleId)
                  }
                  disabled={roleState.disabled || member.markedForRemoval}
                  disabledReason={roleState.reason}
                />
              )}
            </li>
          );
        })}
      </ul>

      {filteredPlayers.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {filter.trim() ? "No members match your filter." : "No members yet."}
        </p>
      )}

      {/* Bottom add control */}
      <div className="flex justify-center">
        <AddMemberButton className="w-full sm:w-auto" />
      </div>
    </div>
  );
};

export default MembersSection;
