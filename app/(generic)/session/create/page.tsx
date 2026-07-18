"use client";
import {
  notifyPlayersOfSession,
  submitNewSession,
  upsertGameDetails,
} from "@/app/(generic)/session/create/action";
import useAuth from "@/app/hooks/useAuth";
import SessionForm, { Player } from "@/components/SessionForm";
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

// Re-export Player type for backwards compatibility
export type { Player } from "@/components/SessionForm";

const Page = () => {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  if (authLoading || !user) {
    return;
  }

  const handleSubmit = async (data: {
    date: Date;
    gameDetails: BGGDetailsInterface;
    tribe: SessionTribe;
    players: Player[];
    teamMode: boolean;
  }) => {
    const {
      date,
      gameDetails,
      tribe,
      players: submittingPlayers,
      teamMode,
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
    const bgg = {
      gameId: parseInt(gameDetails.id),
      gameTitle: gameDetails.title,
      gameWeight: gameDetails.weight,
      gameLength: parseInt(gameDetails.playingtime),
    };
    const numPlayers = submittingPlayers.length;
    const groupId = tribe.id;
    const isVp = true;
    const dateInfo = getDateInfo(date);

    // Each team is considered as a "player"
    const positionedPlayers = computePositions(submittingPlayers);

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
          isTie: player.isTie,
          teamMode,
          createdBy: user!.id,
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
        const [gameUpsertResponse, sessionResponse] = await Promise.all([
          upsertGameDetails(gameDetails),
          submitNewSession(payload),
        ]);

        if (!gameUpsertResponse.success) {
          console.error("Failed to upsert game details");
        }

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
