"use client";

import { saveDraft, saveProfileStep } from "@/app/(generic)/onboarding/action";
import CompletionScreen from "@/components/onboarding/CompletionScreen";
import {
  PlayerCard,
  PlayerCardSummary,
} from "@/components/onboarding/PlayerCard";
import StepTrack from "@/components/onboarding/StepTrack";
import {
  FlowState,
  ONBOARDING_STEPS,
  ProfileDraft,
  TOTAL_STEPS,
} from "@/components/onboarding/steps";
import ClaimStep from "@/components/onboarding/steps/ClaimStep";
import ConnectStep from "@/components/onboarding/steps/ConnectStep";
import FavouriteGamesStep from "@/components/onboarding/steps/FavouriteGamesStep";
import FriendsStep from "@/components/onboarding/steps/FriendsStep";
import ProfileStep from "@/components/onboarding/steps/ProfileStep";
import TribeStep from "@/components/onboarding/steps/TribeStep";
import { Button } from "@/components/ui/button";
import type { DraftTribe, FavouriteGame } from "@/db/schema/profile";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface OnboardingFlowProps {
  userId: string;
  email: string;
  initialStep: number;
  initialState: FlowState;
  defaultImageUrl: string;
}

const OnboardingFlow = ({
  userId,
  email,
  initialStep,
  initialState,
  defaultImageUrl,
}: OnboardingFlowProps) => {
  const reduceMotion = useReducedMotion();

  // One state set up as a reducer so stepping forward or backwards never drops
  // what the user already entered
  const [state, setState] = useState<FlowState>(initialState);
  const [current, setCurrent] = useState(initialStep);
  const [furthest, setFurthest] = useState(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<
    Partial<Record<keyof ProfileDraft, string>>
  >({});
  const [finished, setFinished] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  const step = ONBOARDING_STEPS[current];
  const isLast = current === TOTAL_STEPS - 1;

  // Define skip on steps
  const stepHasInput =
    (step.key === "tribe" && state.tribes.length > 0) ||
    (step.key === "claim" && state.claimedCount > 0) ||
    (step.key === "games" && state.favouriteGames.length > 0);
  const nextLabel = isLast
    ? "Finish"
    : step.optional && !stepHasInput
      ? "Skip for now"
      : "Continue";

  // Move focus to the new slide's heading so the flow is navigable by keyboard
  // and announced by screen readers. Skipped on mount to avoid stealing focus.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [current]);

  const setProfile = useCallback((patch: Partial<ProfileDraft>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const setTribes = useCallback((tribes: DraftTribe[]) => {
    setState((prev) => ({ ...prev, tribes }));
  }, []);

  const setFavouriteGames = useCallback((favouriteGames: FavouriteGame[]) => {
    setState((prev) => ({ ...prev, favouriteGames }));
  }, []);

  const incrementClaimed = useCallback(() => {
    setState((prev) => ({ ...prev, claimedCount: prev.claimedCount + 1 }));
  }, []);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setFurthest((prev) => Math.max(prev, index));
  };

  const validateProfile = () => {
    const { firstName, lastName, username, gender } = state.profile;
    const errors: Partial<Record<keyof ProfileDraft, string>> = {};
    if (!firstName.trim()) errors.firstName = "Required";
    if (!lastName.trim()) errors.lastName = "Required";
    if (!username.trim()) errors.username = "Required";
    if (!gender) errors.gender = "Required";
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (saving) return;

    // Slide 1 writes the profile row: everything after it (claiming an
    // anonymous player, saving a draft) needs a real profile id.
    if (current === 0) {
      if (!validateProfile()) return;

      setSaving(true);
      const formData = new FormData();
      formData.append("firstName", state.profile.firstName);
      formData.append("lastName", state.profile.lastName);
      formData.append("username", state.profile.username);
      formData.append("description", state.profile.description);
      formData.append("gender", state.profile.gender);
      formData.append("profilePicture", state.profile.image ?? defaultImageUrl);

      const result = await saveProfileStep(formData);
      setSaving(false);

      if (!result.success) {
        if (result.field === "username") {
          setProfileErrors({ username: result.message });
        }
        toast.error(result.message ?? "Failed to save your profile.");
        return;
      }

      if (!state.profile.image) setProfile({ image: defaultImageUrl });
      goTo(1);
      return;
    }

    if (isLast) {
      setFinished(true);
      return;
    }

    const nextIndex = current + 1;
    goTo(nextIndex);
    // Persist in the background
    void saveDraft(nextIndex, {
      tribes: state.tribes,
      favouriteGames: state.favouriteGames,
    });
  };

  const handleBack = () => {
    if (current === 0) return;
    goTo(current - 1);
  };

  if (finished) {
    return (
      <CompletionScreen
        state={state}
        onRetryFailed={() => setFinished(false)}
      />
    );
  }

  const slideTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.22, ease: [0.165, 0.84, 0.44, 1] as const };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:py-10">
      <StepTrack current={current} furthest={furthest} onJump={goTo} />

      <div className="mt-4 lg:hidden">
        <PlayerCardSummary state={state} />
      </div>

      <div className="mt-8 flex flex-1 gap-10 lg:mt-12">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={step.key}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * 16 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * -16 }
              }
              transition={slideTransition}
            >
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-heading text-2xl leading-tight font-semibold outline-none sm:text-3xl"
              >
                {step.title}
              </h1>
              <p className="mt-2 max-w-[60ch] text-muted-foreground">
                {step.subtitle}
              </p>

              <div className="mt-8">
                {step.key === "profile" && (
                  <ProfileStep
                    userId={userId}
                    email={email}
                    profile={state.profile}
                    errors={profileErrors}
                    defaultImageUrl={defaultImageUrl}
                    onChange={setProfile}
                  />
                )}
                {step.key === "friends" && <FriendsStep />}
                {step.key === "tribe" && (
                  <TribeStep tribes={state.tribes} onChange={setTribes} />
                )}
                {step.key === "claim" && (
                  <ClaimStep onClaimRequested={incrementClaimed} />
                )}
                {step.key === "games" && (
                  <FavouriteGamesStep
                    games={state.favouriteGames}
                    onChange={setFavouriteGames}
                  />
                )}
                {step.key === "connect" && <ConnectStep />}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-10">
            <PlayerCard state={state} />
          </div>
        </aside>
      </div>

      {/* Actions. Sticky on mobile, opaque — not a blur. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-10 flex items-center gap-3 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleBack}
          disabled={current === 0 || saving}
          className="h-11"
        >
          <ArrowLeft />
          Back
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          disabled={saving}
          className="ml-auto h-11 min-w-36"
        >
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
