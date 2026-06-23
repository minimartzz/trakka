"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { CheckCircle2, Search, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── Graphic 1: animated session create flow ── */

const GAME_RESULTS = [
  { name: "Brass: Birmingham", bgg: "boardgamegeek.com", weight: "3.9 / 5" },
];

const PLAYERS = [
  { name: "Martin", score: 149, winner: true },
  { name: "John", score: 134, winner: false },
  { name: "Sarah", score: 112, winner: false },
];

type Step = "searching" | "selected" | "scores" | "saved";

const LogDemo = () => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState<Step>("searching");
  const [query, setQuery] = useState("");
  const [shownPlayers, setShownPlayers] = useState(0);
  // Bump this to restart the full loop
  const [cycle, setCycle] = useState(0);

  // Typing animation — restarts each cycle
  useEffect(() => {
    if (reduceMotion || !inView) return;
    setStep("searching");
    setQuery("");
    setShownPlayers(0);

    const TARGET = "Brass: Birmingham";
    let charIdx = 0;
    const typeId = setInterval(() => {
      charIdx++;
      setQuery(TARGET.slice(0, charIdx));
      if (charIdx >= TARGET.length) {
        clearInterval(typeId);
        setTimeout(() => setStep("selected"), 400);
      }
    }, 60);

    return () => clearInterval(typeId);
  }, [inView, reduceMotion, cycle]);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    if (step !== "selected") return;
    const id = setTimeout(() => setStep("scores"), 1000);
    return () => clearTimeout(id);
  }, [step, inView, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    if (step !== "scores") return;
    setShownPlayers(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShownPlayers(i);
      if (i >= PLAYERS.length) {
        clearInterval(id);
        setTimeout(() => setStep("saved"), 500);
      }
    }, 400);
    return () => clearInterval(id);
  }, [step, inView, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    if (step !== "saved") return;
    const id = setTimeout(() => setCycle((c) => c + 1), 2200);
    return () => clearTimeout(id);
  }, [step, inView, reduceMotion]);

  return (
    <div
      ref={ref}
      className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card p-5 shadow-(--shadow-elegant) sm:p-6"
      style={{ height: 360 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg font-bold uppercase tracking-wide">
          Record Session
        </p>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
          Jun 8, 2025
        </span>
      </div>

      {/* Game search field */}
      <div className="relative space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Game Title
        </p>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
            step === "searching"
              ? "border-primary ring-2 ring-primary/20"
              : "border-border bg-secondary/40",
          )}
        >
          <Search
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="flex-1 font-mono text-sm">
            {query}
            {step === "searching" && (
              <span className="ml-px inline-block w-0.5 h-3.5 bg-primary align-middle motion-safe:animate-pulse" />
            )}
          </span>
        </div>

        {/* Search result dropdown — floats over content so it doesn't shift layout */}
        <AnimatePresence>
          {step === "searching" && query.length > 4 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-md"
            >
              {GAME_RESULTS.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center justify-between px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.bgg} · Weight {g.weight}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected game chip */}
        <AnimatePresence>
          {(step === "selected" || step === "scores" || step === "saved") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 rounded-lg border border-accent-1/40 bg-accent-1/8 px-3 py-2"
            >
              <CheckCircle2
                className="size-4 shrink-0 text-accent-1"
                aria-hidden
              />
              <span className="text-sm font-semibold">Brass: Birmingham</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Weight 3.9
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Players + scores, with save confirmation overlaid on top */}
      <AnimatePresence>
        {(step === "scores" || step === "saved") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mt-4 space-y-1.5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Players
            </p>
            {PLAYERS.slice(0, shownPlayers).map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {p.name[0]}
                </span>
                <span className="flex-1 text-sm font-medium">{p.name}</span>
                <span className="font-mono text-sm font-semibold">
                  {p.score}
                </span>
                {p.winner && (
                  <Trophy className="size-3.5 text-accent-1" aria-hidden />
                )}
              </motion.div>
            ))}

            {/* Save confirmation overlaid over the player list */}
            <AnimatePresence>
              {step === "saved" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-card/90 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-accent-1/12 px-4 py-3">
                    <CheckCircle2
                      className="size-5 shrink-0 text-accent-1"
                      aria-hidden
                    />
                    <p className="text-sm font-semibold text-accent-1">
                      Session saved! Martin wins · 149 pts
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Graphic 2: cross-game standings that reorder themselves ── */

type Standing = {
  name: string;
  rating: number;
  delta: number;
};

const STANDINGS_A: Standing[] = [
  { name: "Jed", rating: 3.57, delta: -0.2 },
  { name: "Charmaine", rating: 3.46, delta: 0.1 },
  { name: "John", rating: 3.24, delta: -0.08 },
  { name: "Rachel", rating: 3.16, delta: 0.12 },
];

const STANDINGS_B: Standing[] = [
  { name: "Charmaine", rating: 3.56, delta: 0.1 },
  { name: "Jed", rating: 3.37, delta: -0.2 },
  { name: "Rachel", rating: 3.28, delta: 0.12 },
  { name: "John", rating: 3.16, delta: -0.08 },
];

const StandingsBoard = () => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = setInterval(() => setFlipped((f) => !f), 4200);
    return () => clearInterval(id);
  }, [reduceMotion, inView]);

  const rows = flipped ? STANDINGS_B : STANDINGS_A;

  return (
    <div
      ref={ref}
      className="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-(--shadow-elegant) sm:p-6"
    >
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xl font-bold uppercase tracking-wide">
          Tribe standings
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
            aria-hidden
          />
          updates live
        </span>
      </div>

      <div className="mt-4">
        {rows.map((row, i) => (
          <motion.div
            key={row.name}
            layout={!reduceMotion}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={cn(
              "grid grid-cols-[1.75rem_2.5rem_1fr_auto] items-center gap-3 border-t border-border py-3 first:border-t-0",
              i === 0 && "rounded-lg border-t-0 bg-secondary/50 px-3 -mx-3",
            )}
          >
            <span className="font-display text-2xl font-bold text-muted-foreground">
              {i + 1}
            </span>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold"
              aria-hidden
            >
              {row.name[0]}
            </span>
            <span className="flex items-center gap-2 font-medium">
              {row.name}
              {i === 0 && (
                <Trophy
                  className="size-4 text-accent-1"
                  aria-label="Current leader"
                />
              )}
            </span>
            <span className="flex items-baseline gap-2.5">
              <span
                className={cn(
                  "text-xs",
                  row.delta >= 0 ? "text-accent-1" : "text-destructive",
                )}
              >
                {row.delta >= 0 ? `▲ +${row.delta}` : `▼ ${row.delta}`}
              </span>
              <span className="font-mono text-lg">
                {row.rating.toLocaleString("en-US")}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ── Graphic 3: the session filter strip, Trakka's signature component ── */

const FILTERS = [
  { label: "All", count: 128, dot: "bg-primary", active: false },
  { label: "Won", count: 67, dot: "bg-accent-1", active: true },
  { label: "Lost", count: 54, dot: "bg-destructive", active: false },
  { label: "Tie", count: 7, dot: "bg-accent-2", active: false },
];

const WON_SESSIONS = [
  { game: "Brass: Birmingham", date: "Jun 8", place: "1st · 149 pts" },
  { game: "Catan", date: "Jun 1", place: "1st · 12 VP" },
  { game: "Cascadia", date: "May 24", place: "1st · 94 pts" },
];

const HistoryBoard = () => (
  <div className="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-(--shadow-elegant) sm:p-6">
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter sessions"
    >
      {FILTERS.map((f) => (
        <span
          key={f.label}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
            f.active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-foreground/90",
          )}
        >
          <span className={cn("size-1.5 rounded-full", f.dot)} aria-hidden />
          {f.label}
          <span className="font-mono text-xs opacity-70">{f.count}</span>
        </span>
      ))}
    </div>

    <p className="mt-3 text-xs text-muted-foreground">
      Showing 67 of 128 sessions ·{" "}
      <span className="text-primary underline underline-offset-2">
        Clear filters
      </span>
    </p>

    <div className="mt-4">
      {WON_SESSIONS.map((s) => (
        <div
          key={s.game}
          className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{s.game}</p>
            <p className="text-xs text-muted-foreground">{s.date}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold">
            <Trophy className="size-3 text-accent-1" aria-hidden />
            <span>W</span>
            <span className="font-mono font-normal text-muted-foreground">
              {s.place}
            </span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Section assembly ── */

const FEATURES = [
  {
    title: "Log it before the box is shut",
    body: "Scores go in straight from the table. A session takes under a minute to record on your phone, so your friends can argue about who's better while you setup the next game.",
    graphic: <LogDemo />,
  },
  {
    title: "One rating across every game",
    body: "Why should a win in Monopoly be equal to a win in Twilight Imperium. Trakka converts every result into a single cross-game rating, so the argument about who is actually best finally has a number.",
    graphic: <StandingsBoard />,
  },
  {
    title: "Stats that stay satisfying",
    body: "Win rates, streaks, and head-to-head records update the moment a session lands. Come back the next day, filter your history, and find out whether that losing streak was just bad luck.",
    graphic: <HistoryBoard />,
  },
];

const Features = () => (
  <section id="features" className="scroll-mt-20 px-4 py-24 sm:py-32">
    <div className="container mx-auto">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-balance font-bold uppercase leading-none text-[clamp(2.25rem,5vw,3.5rem)]">
          The devil is in the details
        </h2>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          Fast enough for the table, deep enough for the day after.
        </p>
      </div>

      <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-20 sm:mt-20 sm:gap-28">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div className={cn("max-w-lg", i % 2 === 1 && "lg:order-2")}>
              <h3 className="text-2xl font-semibold sm:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
                {feature.body}
              </p>
            </div>
            <div
              className={cn(
                "flex justify-center lg:justify-end",
                i % 2 === 1 && "lg:order-1 lg:justify-start",
              )}
            >
              {feature.graphic}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
