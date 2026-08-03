"use client";

import WipOverlay from "@/components/account/WipOverlay";
import { Search } from "lucide-react";

const FriendsStep = () => {
  return (
    <WipOverlay>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <div className="h-9 w-full rounded-md border bg-transparent pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="size-10 shrink-0 rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-3 w-12 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </WipOverlay>
  );
};

export default FriendsStep;
