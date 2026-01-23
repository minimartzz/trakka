"use client";
import {
  getRecentUsedTribes,
  getTribes,
} from "@/app/(generic)/session/create/action";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export interface SessionTribe {
  id: string;
  name: string;
}

type Tribes = Awaited<ReturnType<typeof getTribes>>[number];
type RecentUsedTribes = Awaited<ReturnType<typeof getRecentUsedTribes>>[number];

interface GroupSearchBarProps {
  profileId: number;
  onSelect: (item: SessionTribe) => void;
}

const GroupSearchBar = ({ profileId, onSelect }: GroupSearchBarProps) => {
  const [tribes, setTribes] = useState<Tribes[]>([]);
  const [recentTribes, setRecentTribes] = useState<RecentUsedTribes[]>([]);
  const [selectedTribe, setSelectedTribe] = useState("");
  const slots = [0, 1, 2];

  useEffect(() => {
    async function fetchTribes() {
      try {
        // Get all tribes that user is SuperAdmin or Admin of
        const tribesResponse = await getTribes(profileId);
        setTribes(tribesResponse);

        const recentTribeResponse = await getRecentUsedTribes(profileId);
        setRecentTribes(recentTribeResponse);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTribes();
  }, []);

  const handleTribeChange = (id: string) => {
    const tribeDetails =
      tribes.find((t) => t.id === id) || recentTribes.find((t) => t.id === id);
    if (tribeDetails) {
      setSelectedTribe(id);
      onSelect({ id: tribeDetails.id!, name: tribeDetails.name! });
    }
  };

  return (
    <div>
      {/* Dropdown Selection */}
      <Select value={selectedTribe} onValueChange={handleTribeChange}>
        <SelectTrigger className="className='[&>span_svg]:text-muted-foreground/80 w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0'">
          <SelectValue placeholder="Select Tribe" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 max-h-100 [&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
          {tribes.map((tribe) => (
            <SelectItem key={tribe.id} value={tribe.id!}>
              <Image
                src={tribe.image!}
                alt={tribe.name!}
                width={14}
                height={14}
                className="h-4 w-4 rounded-xs"
              />{" "}
              <span className="truncate">{tribe.name!}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Recent Tribes Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        {slots.map((slot) => {
          const tribe = recentTribes[slot];
          const tribeExist = !!tribe;

          return (
            <Button
              key={slot}
              type="button"
              variant="ghost"
              className={cn(
                "flex-1 h-6 p-1 sm:p-3 text-xs rounded-full transition-all",
                tribeExist
                  ? "font-semibold text-gray-500 bg-gray-300 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
                  : "!opacity-30 font-normal border-dashed bg-gray-800 text-white"
              )}
              disabled={!tribeExist}
              onClick={() => tribeExist && handleTribeChange(tribe.id!)}
            >
              {tribeExist ? (
                <div className="flex items-center gap-2 truncate">
                  <Image
                    src={tribe.image!}
                    alt={tribe.name!}
                    width="14"
                    height="14"
                    className="rounded-xs"
                  />
                  <span>{tribe.name!}</span>
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  No recent tribe
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupSearchBar;
