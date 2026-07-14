import WipOverlay from "@/components/account/WipOverlay";
import { Trophy, History, KeyRound } from "lucide-react";
import React from "react";

const PlaceholderGameCards = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
        <div className="h-12 w-12 shrink-0 rounded-md bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

const GamesTab = () => {
  return (
    <div className="flex flex-col gap-8 py-6">
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          Favourite Games
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The games you play the most.
        </p>
        <WipOverlay>
          <PlaceholderGameCards />
        </WipOverlay>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <History className="h-4 w-4 text-muted-foreground" />
          Favourite Sessions
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sessions you've bookmarked to look back on.
        </p>
        <WipOverlay>
          <PlaceholderGameCards />
        </WipOverlay>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Claim a Game
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Use a claim code to link an anonymous player's past sessions to
          your account.
        </p>
        <WipOverlay>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="h-9 flex-1 rounded-md bg-muted" />
            <div className="h-9 w-24 shrink-0 rounded-md bg-muted" />
          </div>
        </WipOverlay>
      </section>
    </div>
  );
};

export default GamesTab;
