"use client";

import WipOverlay from "@/components/account/WipOverlay";
import { Link2 } from "lucide-react";

const SITES = [
  { name: "BoardGameGeek", handle: "geek username" },
  { name: "Board Game Arena", handle: "BGA username" },
  { name: "Yucata", handle: "Yucata username" },
];

const ConnectStep = () => {
  return (
    <WipOverlay>
      <div className="flex flex-col gap-3">
        {SITES.map((site) => (
          <div
            key={site.name}
            className="flex items-center gap-3 rounded-lg border p-4"
          >
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{site.name}</p>
              <p className="text-xs text-muted-foreground">{site.handle}</p>
            </div>
            <div className="h-8 w-20 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </WipOverlay>
  );
};

export default ConnectStep;
