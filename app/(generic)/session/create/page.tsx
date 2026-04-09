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
  generateSessionId,
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import { format } from "date-fns";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
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
  }) => {
    const { date, gameDetails, tribe, players: submittingPlayers } = data;

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

    let payload = null;
    try {
      const promises = submittingPlayers.map(async (player, idx, array) => {
        let position: number;
        if (idx === 0) {
          position = 1;
        } else if (
          player.score === array[idx - 1].score &&
          player.isTie &&
          player.isTie === array[idx - 1].isTie
        ) {
          const firstMatch = array.findIndex((p) => p.score === player.score);
          position = firstMatch + 1;
        } else {
          position = idx + 1;
        }

        const victoryPoints = player.score;
        const score = getScore(
          position,
          numPlayers,
          bgg.gameLength,
          parseFloat(bgg.gameWeight),
        );

        return {
          sessionId,
          datePlayed,
          ...bgg,
          numPlayers,
          profileId: player.profileId,
          groupId,
          isVp,
          victoryPoints: victoryPoints,
          isWinner: player.isWinner,
          position: position,
          winContrib: getWinContrib(numPlayers, player.isWinner),
          score: score,
          highScore: false,
          ...dateInfo,
          isFirstPlay: await getFirstPlay(String(bgg.gameId), player.profileId),
          isTie: player.isTie,
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
            const sessionNotification = payload.map((player) => ({
              type: "new_session",
              data: {
                gameImageUrl: gameDetails.image,
                gameTitle: gameDetails.title,
                tribeName: tribe.name,
              },
              isRead: false,
              profileId: player.profileId,
            }));
            await notifyPlayersOfSession(sessionNotification);
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