"use client";

import TribeSearchRow from "@/components/onboarding/steps/TribeSearchRow";
import { Button } from "@/components/ui/button";
import type { DraftTribe } from "@/db/schema/profile";
import { Check, X } from "lucide-react";
import Image from "next/image";

interface TribeStepProps {
  tribes: DraftTribe[];
  onChange: (tribes: DraftTribe[]) => void;
}

const TribeStep = ({ tribes, onChange }: TribeStepProps) => {
  return (
    <div className="flex flex-col gap-3">
      {tribes.map((tribe) => (
        <div
          key={tribe.id}
          className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
        >
          <div className="relative size-9 shrink-0 overflow-hidden rounded-md border bg-muted">
            <Image
              src={tribe.image}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{tribe.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              {tribe.source === "invite"
                ? "From your invite · request sends when you finish"
                : "Request sends when you finish"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(tribes.filter((t) => t.id !== tribe.id))}
            aria-label={`Remove ${tribe.name}`}
            className="size-9 shrink-0 text-muted-foreground"
          >
            <X />
          </Button>
        </div>
      ))}

      {/* Remount after every confirmation so the next search starts clean. */}
      <TribeSearchRow
        key={tribes.length}
        excludedIds={tribes.map((t) => t.id)}
        onConfirm={(tribe) => onChange([...tribes, tribe])}
      />
    </div>
  );
};

export default TribeStep;
