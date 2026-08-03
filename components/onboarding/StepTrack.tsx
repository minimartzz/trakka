"use client";

import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/components/onboarding/steps";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface StepTrackProps {
  current: number;
  furthest: number;
  onJump: (index: number) => void;
}

// Centre of the first and last node in a 6-column grid, so the rail starts and
// ends exactly under a node instead of running off both edges.
const RAIL_INSET = `${100 / (TOTAL_STEPS * 2)}%`;

/**
 * The progress bar and the step tracker are the same element: the rail fills to
 * Rail fills to the current step and step counter is marker at the edge of the fill
 * Completed steps become buttons for navigation
 */
const StepTrack = ({ current, furthest, onJump }: StepTrackProps) => {
  const reduceMotion = useReducedMotion();
  const step = ONBOARDING_STEPS[current];
  const fraction = current / (TOTAL_STEPS - 1);

  return (
    <div>
      {/* Desktop: nodes on a filling rail */}
      <nav aria-label="Onboarding steps" className="hidden lg:block">
        <ol className="relative grid grid-cols-6">
          {/* Rail */}
          <div
            aria-hidden="true"
            className="absolute top-4.5 h-0.5 -translate-y-1/2 rounded-full bg-border"
            style={{ left: RAIL_INSET, right: RAIL_INSET }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute top-4.5 h-0.5 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: RAIL_INSET }}
            initial={false}
            animate={{
              width: `calc((100% - ${RAIL_INSET} * 2) * ${fraction})`,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.26, ease: [0.165, 0.84, 0.44, 1] }
            }
          />

          {ONBOARDING_STEPS.map((item, index) => {
            const isDone = index < current;
            const isCurrent = index === current;
            const canJump = index <= furthest && !isCurrent;

            return (
              <li
                key={item.key}
                className="flex flex-col items-center gap-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && onJump(index)}
                  aria-label={
                    canJump
                      ? `Go to step ${index + 1}, ${item.title}`
                      : `Step ${index + 1}, ${item.title}`
                  }
                  className={cn(
                    "relative z-10 flex items-center justify-center rounded-full ring-4 ring-background transition-colors",
                    canJump && "cursor-pointer",
                    !canJump && "cursor-default",
                    isCurrent
                      ? "h-9 gap-1.5 bg-primary px-3.5 text-primary-foreground"
                      : "size-9",
                    isDone && "bg-primary text-primary-foreground",
                    !isDone &&
                      !isCurrent &&
                      "border-2 border-border bg-background text-muted-foreground",
                  )}
                >
                  {isCurrent ? (
                    <motion.span
                      key={item.key}
                      initial={
                        reduceMotion ? false : { scale: 0.8, opacity: 0 }
                      }
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18 }}
                      className="font-display text-lg leading-none font-bold tabular-nums"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </motion.span>
                  ) : isDone ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <span className="font-display text-sm leading-none font-bold tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </button>
                <span
                  className={cn(
                    "text-xs",
                    isCurrent
                      ? "font-medium text-foreground"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: the same information as segments */}
      <div className="lg:hidden">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-display text-xl leading-none font-bold tabular-nums text-primary">
            {String(current + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium">{step.label}</span>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {current + 1} / {TOTAL_STEPS}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {ONBOARDING_STEPS.map((item, index) => (
            <motion.span
              key={item.key}
              aria-hidden="true"
              className={cn(
                "h-1 rounded-full",
                index <= current ? "bg-primary" : "bg-border",
              )}
              initial={false}
              animate={{ flexGrow: index === current ? 1.8 : 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.26, ease: [0.165, 0.84, 0.44, 1] }
              }
              style={{ flexBasis: 0 }}
            />
          ))}
        </div>
      </div>

      {/* One announcement for both layouts */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${TOTAL_STEPS}, ${step.title}`}
        className="sr-only"
      />
    </div>
  );
};

export default StepTrack;
