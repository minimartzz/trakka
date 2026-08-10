"use client";
import {
  notifyPlayersOfSession,
  submitNewSession,
  upsertExpansionDetails,
  upsertGameDetails,
} from "@/app/(generic)/session/create/action";
import { useUser } from "@/components/UserProvider";
import SessionForm, { Player } from "@/components/SessionForm";
import { SelectedExpansion } from "@/components/ExpansionSelection";
import { SessionTribe } from "@/components/GroupSearchBar";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import {
  computePositions,
  generateSessionId,
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import { format } from "date-fns";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import posthog from "posthog-js";

// Re-export Player type for backwards compatibility
export type { Player } from "@/components/SessionForm";

const Page = () => {
  const router = useRouter();
  // The session layout gates on auth server-side, so the user is always present.
  const user = useUser();

  const handleSubmit = async (data: {
    date: Date;
    gameDetails: BGGDetailsInterface;
    tribe: SessionTribe;
    players: Player[];
    teamMode: boolean;
    coop: boolean;
    isVp: boolean;
    sessionDescription: string | null;
    expansions: SelectedExpansion[];
  }) => {
    const {
      date,
      gameDetails,
      tribe,
      players: submittingPlayers,
      teamMode,
      coop,
      isVp,
      sessionDescription,
      expansions,
    } = data;

    // Initial Checks
    if (!gameDetails) {
      toast.error("No game selected.");
      return;
    }
    if (!date) {
      toast.error("No date was selected.");
      return;
    }
    if (!tribe) {
      toast.error("No tribe was selected.");
      return;
    }
    const missingPlayers = submittingPlayers
      .map((player, idx) => (player.firstName === "" ? idx + 1 : null))
      .filter((idx): idx is number => idx !== null);
    if (missingPlayers.length > 0) {
      const missingPositions = missingPlayers.join(", ");
      toast.error(`Missing player info at position ${missingPositions}.`);
      return;
    }
    const containWinner = submittingPlayers.some((player) => player.isWinner);
    if (!containWinner) {
      toast.error("At least one winner must be selected.");
      return;
    }

    // Get all the additional info
    const sessionId = generateSessionId();
    const datePlayed = format(date, "yyyy-MM-dd");

    // Sessions weight is the average of base game + all expansions
    const weights = [
      parseFloat(gameDetails.weight),
      ...expansions.map((expansion) => parseFloat(expansion.weight)),
    ].filter((w) => !isNaN(w));
    const averagedWeight =
      weights.reduce((sum, w) => sum + w, 0) / weights.length;

    // Game details from BGG
    const bgg = {
      gameId: parseInt(gameDetails.id),
      gameTitle: gameDetails.title,
      gameWeight: String(averagedWeight),
      gameLength: parseInt(gameDetails.playingtime),
    };

    // Remaining player + session details
    const numPlayers = submittingPlayers.length;
    const groupId = tribe.id;
    const dateInfo = getDateInfo(date);

    // Expansion IDs for mapping
    const expansionIds = expansions.map((expansion) => parseInt(expansion.id));

    // Coop: Every player has the same position (1)
    const positionedPlayers = coop
      ? submittingPlayers.map((player) => ({
          ...player,
          position: 1,
          teamVictoryPoints: player.score,
        }))
      : computePositions(submittingPlayers);

    // In team mode, map each team's client key to a stable 1-based team number
    // persisted as team_id. Non-team games store null.
    const teamNumbers = new Map<string, number>();
    if (teamMode) {
      for (const player of submittingPlayers) {
        const key = player.teamId ?? player.id;
        if (!teamNumbers.has(key)) teamNumbers.set(key, teamNumbers.size + 1);
      }
    }
    const teamNumberFor = (player: (typeof submittingPlayers)[number]) =>
      teamMode ? (teamNumbers.get(player.teamId ?? player.id) ?? null) : null;

    let payload = null;
    try {
      const promises = positionedPlayers.map(async (player) => {
        const { position, teamVictoryPoints } = player;
        const score = getScore(
          position,
          numPlayers,
          bgg.gameLength,
          parseFloat(bgg.gameWeight),
        );

        // New anonymous players have no profile yet; the server creates it
        const isNewAnonymous = player.isAnonymous && player.profileId === 0;

        return {
          sessionId,
          datePlayed,
          ...bgg,
          numPlayers,
          profileId: isNewAnonymous ? null : player.profileId,
          anonymousPlayer: isNewAnonymous
            ? { firstName: player.firstName, lastName: player.lastName }
            : undefined,
          groupId,
          isVp,
          coop,
          sessionDescription,
          victoryPoints: teamVictoryPoints,
          isWinner: player.isWinner,
          position: position,
          winContrib: getWinContrib(numPlayers, player.isWinner),
          score: score,
          highScore: false,
          ...dateInfo,
          isFirstPlay: isNewAnonymous
            ? true
            : await getFirstPlay(String(bgg.gameId), player.profileId),
          isTie: coop ? false : player.isTie,
          teamId: teamNumberFor(player),
          createdBy: user!.id,
          expansionIds,
        };
      });
      payload = await Promise.all(promises);
    } catch (error) {
      console.error("Failed to gather necessary info for session");
      toast.error(
        "Error in submitting. Please check your fields and try again",
      );
      return;
    }

    if (payload) {
      try {
        // ORDER: Base Game -> Expansions -> Session expansion details (junction table)
        // Base game insert
        const gameUpsertResponse = await upsertGameDetails(gameDetails);
        if (!gameUpsertResponse.success) {
          console.error("Failed to upsert game details");
        }

        // Expansions insert
        const expansionUpsertResponse = await upsertExpansionDetails(
          parseInt(gameDetails.id),
          expansions,
        );
        if (!expansionUpsertResponse.success) {
          console.error("Failed to upsert expansion details");
        }

        const sessionResponse = await submitNewSession(payload);

        if (!sessionResponse.success) {
          toast.error(
            "Failed to submit new session. Please check fields and try again.",
          );
        } else {
          try {
            // Anonymous players have no account to read notifications with
            const sessionNotification = payload
              .filter(
                (player): player is typeof player & { profileId: number } =>
                  player.profileId !== null,
              )
              .map((player) => ({
                type: "new_session",
                data: {
                  gameImageUrl: gameDetails.thumbnail,
                  gameTitle: gameDetails.title,
                  tribeName: tribe.name,
                  groupId: tribe.id,
                },
                isRead: false,
                profileId: player.profileId,
              }));
            if (sessionNotification.length > 0) {
              await notifyPlayersOfSession(sessionNotification);
            }
          } catch {
            console.error("Failed to notify players of new session");
          }

          posthog.capture("game_session_created", {
            game_id: bgg.gameId,
            tribe_id: groupId,
            player_count: numPlayers,
            team_mode: teamMode,
          });
          toast.success(
            `Successfully saved session ${gameDetails.title} on ${datePlayed}! 🎉`,
          );
          router.push("/recent-games");
        }
      } catch (error) {
        console.error("Client side failed to submit");
        toast.error(
          "Failed to submit new session. Please check fields and try again.",
        );
      }
    }
  };

  return (
    <SessionForm
      userId={user.id}
      title="New Game Session"
      cardTitle="Record Game Session"
      cardDescription="Track a new board game session"
      onSubmit={handleSubmit}
    />
  );
};

export default Page;
