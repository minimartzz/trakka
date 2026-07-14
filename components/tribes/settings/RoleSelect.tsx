"use client";

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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Roles } from "@/lib/interfaces";

const ROLE_DESCRIPTIONS: Record<number, string> = {
  [Roles.SuperAdmin]: "Full control — settings, members & claim codes",
  [Roles.Admin]: "Can create and edit sessions",
  [Roles.Member]: "Plays and views stats",
};

const ROLE_NAMES: Record<number, string> = {
  [Roles.SuperAdmin]: "SuperAdmin",
  [Roles.Admin]: "Admin",
  [Roles.Member]: "Member",
};

interface RoleSelectProps {
  roleId: number;
  onRoleChange: (newRoleId: number) => void;
  disabled?: boolean;
  disabledReason?: string;
  pending?: boolean;
}

const RoleSelect = ({
  roleId,
  onRoleChange,
  disabled = false,
  disabledReason,
  pending = false,
}: RoleSelectProps) => {
  const select = (
    <Select
      value={String(roleId)}
      onValueChange={(value) => {
        const newRoleId = parseInt(value);
        if (newRoleId !== roleId) onRoleChange(newRoleId);
      }}
      disabled={disabled || pending}
    >
      <SelectTrigger className="w-full sm:w-36" aria-label="Member role">
        {/* Trigger shows the role name only; descriptions live in the dropdown */}
        <SelectValue>{ROLE_NAMES[roleId]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(Roles).map((id) => (
          <SelectItem value={String(id)} key={id}>
            <div className="flex flex-col items-start gap-0.5">
              <span>{ROLE_NAMES[id]}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_DESCRIPTIONS[id]}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip>
        {/* span wrapper so the tooltip fires on a disabled control */}
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block w-full sm:w-auto">
            {select}
          </span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return select;
};

export default RoleSelect;
