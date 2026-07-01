"use client";

import { GroupedSession } from "@/lib/interfaces";
import RecentGamesView from "@/components/RecentGamesView";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MousePointerClick } from "lucide-react";
import { useState } from "react";

export interface DemoProfile {
  id: number;
  name: string;
  sessions: GroupedSession[];
}

type Mode = "recent-games" | "tribe";

const MODES: {
  key: Mode;
  /** Toggleable word in the headline, also used in the URL bar. */
  word: string;
  tagline: string;
  ending: string;
  url: (name: string) => string;
}[] = [
  {
    key: "recent-games",
    word: "MARTIN",
    tagline: "Every session a player has logged, filterable in one place.",
    ending: "recent games",
    url: (name) => `trakka.co/${name.toLowerCase()}/recent-games`,
  },
  {
    key: "tribe",
    word: "JOHN",
    ending: "tribe",
    tagline: "Standings, players and games for a whole group. Tap the tabs.",
    url: (name) => `trakka.co/${name.toLowerCase()}/tribe`,
  },
];

const ProfileDemo = ({
  profile,
  tribeView,
}: {
  profile: DemoProfile;
  tribeView: React.ReactNode;
}) => {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const active = MODES[index];
  const next = MODES[(index + 1) % MODES.length];

  const switchMode = () => setIndex((i) => (i + 1) % MODES.length);

  // Intercept any nested outbound navigation so the demo can't leave the page.
  const blockNavigation = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <h2 className="text-center font-display text-balance font-bold uppercase leading-none text-[clamp(2rem,5vw,3.5rem)]">
        Check out{" "}
        <motion.button
          type="button"
          onClick={switchMode}
          aria-label={`Showing ${active.word}. Switch to ${next.word}`}
          className="group relative inline-flex cursor-pointer items-center gap-2 rounded-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          // Repeating "tap me" pulse so users know the word is interactive.
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={{
            duration: 1.4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 5,
          }}
          whileHover={{ scale: 1.06 }}
        >
          <span className="inline-grid overflow-hidden border-b-3 border-dashed border-primary/60 pb-1 transition-colors group-hover:border-primary">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={active.key}
                initial={
                  reduceMotion ? { opacity: 0 } : { y: "110%", opacity: 0 }
                }
                animate={{ y: 0, opacity: 1 }}
                exit={
                  reduceMotion ? { opacity: 0 } : { y: "-110%", opacity: 0 }
                }
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {active.word}
              </motion.span>
            </AnimatePresence>
          </span>

          {/* Recurring tap indicator — fades in and out to draw the eye. */}
          {!reduceMotion && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -right-1 top-full mt-1 flex translate-x-full items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold normal-case text-primary-foreground shadow-md"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-4, 0, 0, -4] }}
              transition={{
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 4,
                times: [0, 0.2, 0.8, 1],
              }}
            >
              <MousePointerClick className="size-3" />
              Tap
            </motion.span>
          )}
        </motion.button>
        &apos;s {active.ending}!
      </h2>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {active.tagline}
      </p>

      {/* Browser-chrome framed, read-only embed. */}
      <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-elegant)">
        {/* Chrome bar */}
        <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          </div>
          <div className="flex h-6 max-w-72 flex-1 items-center rounded-md bg-background px-3 font-mono text-xs text-muted-foreground">
            {active.url(active.word)}
          </div>
          <span className="hidden shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary sm:inline">
            Live demo
          </span>
        </div>

        {/* Scrollable viewport. onClickCapture neutralizes any stray outbound
            navigation from nested links so the demo can't leave the page. */}
        <div
          className="max-h-128 overflow-y-auto"
          onClickCapture={blockNavigation}
        >
          {/* Both views are kept mounted; visibility toggles so the
              server-rendered tribe view never needs to re-fetch. */}
          <div
            className={
              active.key === "recent-games" ? "block p-4 sm:p-6" : "hidden"
            }
          >
            <RecentGamesView
              userId={profile.id}
              sessions={profile.sessions}
              readOnly
              maxSessions={10}
            />
          </div>
          <div className={active.key === "tribe" ? "block" : "hidden"}>
            {tribeView}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDemo;
