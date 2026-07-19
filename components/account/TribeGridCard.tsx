import { Badge } from "@/components/ui/badge";
import { Roles } from "@/lib/interfaces";
import { Crown, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export interface TribeGridCardData {
  id: string;
  name: string;
  image: string;
  roleId: number;
  sessionsPlayed: number;
}

const ROLE_BADGE: Record<
  number,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [Roles.SuperAdmin]: { label: "SuperAdmin", icon: Crown },
  [Roles.Admin]: { label: "Admin", icon: ShieldCheck },
};

const TribeGridCard = ({ tribe }: { tribe: TribeGridCardData }) => {
  const roleBadge = ROLE_BADGE[tribe.roleId];

  return (
    <Link
      href={`/tribe/${tribe.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Image-forward: the tribe photo fills the card top, Facebook-style,
          with the role badge overlaid top-left directly on the image. */}
      <div className="relative aspect-square w-full bg-muted">
        {tribe.image && (
          <Image
            src={tribe.image}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          />
        )}
        {roleBadge && (
          <Badge className="absolute left-2 top-2 gap-1 bg-background/90 text-foreground shadow-sm">
            <roleBadge.icon className="h-3 w-3" />
            {roleBadge.label}
          </Badge>
        )}
      </div>

      {/* Footer strip: name + games played */}
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <span className="truncate text-sm font-medium">{tribe.name}</span>
        <span className="text-xs text-muted-foreground">
          <span className="tabular-nums">{tribe.sessionsPlayed}</span>{" "}
          {tribe.sessionsPlayed === 1 ? "game" : "games"} played
        </span>
      </div>
    </Link>
  );
};

export default TribeGridCard;
