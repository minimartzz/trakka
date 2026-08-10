"use client";

import { completeOnboarding } from "@/app/(generic)/onboarding/action";
import { PlayerCard } from "@/components/onboarding/PlayerCard";
import type { FlowState } from "@/components/onboarding/steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "nextjs-toploader/app";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "working" | "done" | "failed";

interface CompletionScreenProps {
  state: FlowState;
  onRetryFailed: () => void;
}

const StatusLine = ({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "done";
}) => (
  <li
    className={cn(
      "flex items-center gap-2.5 text-sm",
      status === "done" ? "text-foreground" : "text-muted-foreground",
    )}
  >
    <span className="flex size-4 shrink-0 items-center justify-center">
      {status === "done" ? (
        <Check className="size-4 text-primary" strokeWidth={3} />
      ) : status === "active" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <span className="size-1.5 rounded-full bg-border" />
      )}
    </span>
    {label}
  </li>
);

const CompletionScreen = ({ state, onRetryFailed }: CompletionScreenProps) => {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  const tribeCount = state.tribes.length;

  const run = useCallback(async () => {
    setPhase("working");
    setMessage(null);

    const result = await completeOnboarding({
      tribes: state.tribes,
      favouriteGames: state.favouriteGames,
    });

    if (!result.success) {
      setMessage(result.message ?? "Something went wrong.");
      setPhase("failed");
      return;
    }

    setPhase("done");
  }, [state.tribes, state.favouriteGames]);

  // Fires once on mount; StrictMode's double-invoke must not double-submit.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run(); // Allows triggering an async function without return
  }, [run]);

  // Hold just long enough for the check to finish drawing, then hand over.
  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(
      () => router.push("/dashboard"),
      reduceMotion ? 300 : 900,
    );
    return () => clearTimeout(timer);
  }, [phase, reduceMotion, router]);

  const workStatus = phase === "working" ? "active" : "done";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="relative w-full max-w-[320px]">
        <PlayerCard state={state} glow={phase === "done"} />

        {phase === "done" && (
          <div className="pointer-events-none absolute -top-4 -right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden="true"
            >
              <motion.path
                d="M20 6 9 17l-5-5"
                initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.5,
                  ease: [0.165, 0.84, 0.44, 1],
                }}
              />
            </svg>
          </div>
        )}
      </div>

      <div className="w-full text-center">
        <h1 className="font-heading text-2xl font-semibold" aria-live="polite">
          {phase === "done"
            ? "You're all set"
            : phase === "failed"
              ? "Almost there"
              : "Finishing up"}
        </h1>

        {phase === "failed" ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {message} Your answers are safe — nothing was lost.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" onClick={run} className="h-11">
                Try again
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onRetryFailed}
                className="h-11"
              >
                Back to the steps
              </Button>
            </div>
          </>
        ) : (
          <ul className="mt-6 inline-flex flex-col items-start gap-3">
            <StatusLine label="Saving your profile" status={workStatus} />
            {tribeCount > 0 && (
              <StatusLine
                label={`Sending ${tribeCount} tribe ${
                  tribeCount === 1 ? "request" : "requests"
                }`}
                status={workStatus}
              />
            )}
            <StatusLine
              label="Opening your dashboard"
              status={phase === "done" ? "active" : "pending"}
            />
          </ul>
        )}
      </div>
    </div>
  );
};

export default CompletionScreen;
