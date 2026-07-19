import TribeGridCard, {
  TribeGridCardData,
} from "@/components/account/TribeGridCard";
import WipOverlay from "@/components/account/WipOverlay";
import { Users } from "lucide-react";
import React from "react";

interface SocialsTabProps {
  tribes: TribeGridCardData[];
}

const SocialsTab = ({ tribes }: SocialsTabProps) => {
  return (
    <div className="flex flex-col gap-8 py-6">
      <section>
        <h2 className="text-lg font-semibold">Friends</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          See who you've played the most with.
        </p>
        <WipOverlay>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-lg border">
                <div className="aspect-square w-full bg-muted" />
                <div className="flex flex-col gap-1 px-3 py-2.5">
                  <div className="h-3.5 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </WipOverlay>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tribes</h2>
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">{tribes.length}</span>{" "}
              {tribes.length === 1 ? "tribe" : "tribes"}
            </p>
          </div>
        </div>
        {tribes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You haven't joined a tribe yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tribes.map((tribe) => (
              <TribeGridCard key={tribe.id} tribe={tribe} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SocialsTab;
