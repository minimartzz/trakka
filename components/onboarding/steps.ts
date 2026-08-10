import type { DraftTribe, FavouriteGame } from "@/db/schema/profile";

// The six slides, in order. `label` is what the step track shows; `title` and
// `subtitle` head the slide itself.
export const ONBOARDING_STEPS = [
  {
    key: "profile",
    label: "Profile",
    title: "Create your profile",
    subtitle: "Tell us about yourself",
    optional: false,
  },
  {
    key: "friends",
    label: "Friends",
    title: "Find your friends",
    subtitle: "Find the other regulars you play with",
    optional: true,
  },
  {
    key: "tribe",
    label: "Tribe",
    title: "Join a tribe",
    subtitle: "Join a tribe, prove you're the best there",
    optional: true,
  },
  {
    key: "claim",
    label: "Past games",
    title: "Already played some games?",
    subtitle: "Claim a sessions logged to an anonymous user",
    optional: true,
  },
  {
    key: "games",
    label: "Favourites",
    title: "Showcase your favourite games",
    subtitle: "Pick up to five. They'll sit on your profile.",
    optional: true,
  },
  {
    key: "connect",
    label: "Connect",
    title: "A true connoisseur",
    subtitle: "Link your other board game accounts",
    optional: true,
  },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export interface ProfileDraft {
  firstName: string;
  lastName: string;
  username: string;
  description: string;
  gender: "" | "Male" | "Female" | "Others";
  image: string | null;
}

// Everything the flow holds. Lives in one reducer in OnboardingFlow so moving
// between slides can never drop what the user already entered.
export interface FlowState {
  profile: ProfileDraft;
  tribes: DraftTribe[];
  favouriteGames: FavouriteGame[];
  claimedCount: number;
}
