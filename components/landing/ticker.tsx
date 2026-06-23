import { Marquee } from "@/components/ui/marquee";
import { Trophy } from "lucide-react";

export type TickerResult = { game: string; winner: string; score: string };

const FALLBACK_RESULTS: TickerResult[] = [
  { game: "Catan", winner: "Martin", score: "12 VP" },
  { game: "Wingspan", winner: "John", score: "87 pts" },
  { game: "Azul", winner: "Sarah", score: "104 pts" },
  { game: "Terraforming Mars", winner: "Priya", score: "112 TR" },
  { game: "7 Wonders", winner: "Dev", score: "61 pts" },
  { game: "Ticket to Ride", winner: "Mei", score: "128 pts" },
  { game: "Brass: Birmingham", winner: "Martin", score: "149 pts" },
  { game: "Cascadia", winner: "John", score: "94 pts" },
];

/** Broadcast-style results ticker between the hero and the feature tour. */
const ResultsTicker = ({ results }: { results?: TickerResult[] }) => {
  const items = results && results.length > 0 ? results : FALLBACK_RESULTS;
  return (
    <div
      aria-hidden
      className="border-y border-border bg-card/60 py-2 motion-reduce:[&_.animate-marquee]:animate-none"
    >
      <Marquee className="[--duration:55s] [--gap:2.5rem] p-0">
        {items.map((r) => (
          <span
            key={`${r.game}-${r.winner}`}
            className="flex items-center gap-2.5 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-wide"
          >
            <span className="text-muted-foreground">{r.game}</span>
            <Trophy className="size-3.5 text-accent-1" />
            <span>{r.winner}</span>
            <span className="font-mono text-xs font-normal text-accent-1">
              {r.score}
            </span>
            <span className="ml-2 text-border">/</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
};

export default ResultsTicker;
