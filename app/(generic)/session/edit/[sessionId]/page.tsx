"use client";

import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import useAuth from "@/app/hooks/useAuth";
import SessionForm, {
  Player,
  SessionFormInitialData,
} from "@/components/SessionForm";
import { SessionTribe } from "@/components/GroupSearchBar";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import {
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import {
  checkUserRole,
  fetchSessionForEdit,
  updateSession,
} from "./action";

const Page = () => {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { user, authLoading } = useAuth();

  const [initialData, setInitialData] = useState<SessionFormInitialData | null>(
    null,
  );
  const [oldRows, setOldRows] = useState<
    { profileId: number; isWinner: boolean; score: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadSession = async () => {
      const result = await fetchSessionForEdit(sessionId);

      if (!result.success || !result.data) {
        toast.error("Session not found.");
        router.push("/recent-games");
        return;
      }

      const rows = result.data;
      const firstRow = rows[0];

      // Check if user has permission to edit
      const hasPermission = await checkUserRole(user.id, firstRow.groupId);
      if (!hasPermission) {
        toast.error("You do not have permission to edit this session.");
        router.push("/recent-games");
        return;
      }

      // Store old rows for rolling stats reversal
      setOldRows(
        rows.map((r) => ({
          profileId: r.profileId!,
          isWinner: r.isWinner,
          score: r.score,
        })),
      );

      // Build initial game details from stored game data
      const gameDetails: BGGDetailsInterface = {
        id: String(firstRow.gameId),
        type: "boardgame",
        title: firstRow.gameTitle,
        thumbnail: firstRow.gameImageUrl ?? "",
        image: firstRow.gameImageUrl ?? "",
        description: firstRow.gameDescription ?? "",
        yearPublished: String(firstRow.gameYearPublished ?? 0),
        rating: String(firstRow.gameRating ?? 0),
        weight: String(firstRow.gameWeightFull ?? 0),
        minPlayers: String(firstRow.gameMinPlayers ?? 0),
        maxPlayers: String(firstRow.gameMaxPlayers ?? 0),
        recPlayers: String(firstRow.gameRecPlayers ?? 0),
        playingTime: String(firstRow.gamePlayingTime ?? 0),
        playingtime: String(firstRow.gamePlayingTime ?? 0),
        minPlayingTime: String(firstRow.gameMinPlayingTime ?? 0),
        maxPlayingTime: String(firstRow.gameMaxPlayingTime ?? 0),
        minAge: String(firstRow.gameMinAge ?? 0),
        rank: 999999,
        categories: [],
        mechanics: [],
        families: [],
      };

      const tribe: SessionTribe = {
        id: firstRow.groupId,
        name: firstRow.tribeName!,
      };

      // Build players list sorted by position
      const players: Player[] = rows.map((row, idx) => ({
        id: String(idx + 1),
        profileId: row.profileId!,
        firstName: row.firstName!,
        lastName: row.lastName!,
        username: row.username!,
        profilePic: row.profilePic ?? "",
        groupId: row.groupId,
        score: row.victoryPoints,
        isWinner: row.isWinner,
        isTie: row.isTie,
      }));

      const datePlayed = new Date(firstRow.datePlayed + "T00:00:00");

      setInitialData({
        date: datePlayed,
        gameDetails,
        tribe,
        players,
      });

      setLoading(false);
    };

    loadSession();
  }, [user, authLoading, sessionId]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = async (data: {
    date: Date;
    gameDetails: BGGDetailsInterface;
    tribe: SessionTribe;
    players: Player[];
  }) => {
    const { date, gameDetails, tribe, players: submittingPlayers } = data;

    // Validation
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
      toast.error(`Missing player info at position ${missingPlayers.join(", ")}.`);
      return;
    }
    const containWinner = submittingPlayers.some((player) => player.isWinner);
    if (!containWinner) {
      toast.error("At least one winner must be selected.");
      return;
    }

    // Build payload
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
          victoryPoints,
          isWinner: player.isWinner,
          position,
          winContrib: getWinContrib(numPlayers, player.isWinner),
          score,
          highScore: false,
          ...dateInfo,
          isFirstPlay: await getFirstPlay(String(bgg.gameId), player.profileId),
          isTie: player.isTie,
          createdBy: user!.id,
        };
      });
      payload = await Promise.all(promises);
    } catch (error) {
      console.error("Failed to gather necessary info for session update");
      toast.error("Error in updating. Please check your fields and try again");
      return;
    }

    if (payload) {
      try {
        const result = await updateSession(sessionId, oldRows, payload);

        if (!result.success) {
          toast.error("Failed to update session. Please try again.");
        } else {
          toast.success(
            `Successfully updated session ${gameDetails.title}! 🎉`,
          );
          router.push("/recent-games");
        }
      } catch (error) {
        console.error("Failed to update session:", error);
        toast.error("Failed to update session. Please try again.");
      }
    }
  };

  return (
    <SessionForm
      userId={user.id}
      title="Edit Game Session"
      cardTitle="Edit Game Session"
      cardDescription="Update the details of this game session"
      initialData={initialData!}
      onSubmit={handleSubmit}
    />
  );
};

export default Page;