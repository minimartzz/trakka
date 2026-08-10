"use client";

import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { useUser } from "@/components/UserProvider";
import SessionForm, {
  Player,
  SessionFormInitialData,
} from "@/components/SessionForm";
import { SelectedExpansion } from "@/components/ExpansionSelection";
import { SessionTribe } from "@/components/GroupSearchBar";
import { BGGDetailsInterface, fetchBGGDetails } from "@/utils/fetchBgg";
import {
  computePositions,
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import { checkUserRole, fetchSessionForEdit, updateSession } from "./action";
import { upsertExpansionDetails } from "@/app/(generic)/session/create/action";
import posthog from "posthog-js";

const EditSessionPage = () => {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const user = useUser();

  const [initialData, setInitialData] = useState<SessionFormInitialData | null>(
    null,
  );
  const [oldRows, setOldRows] = useState<
    {
      profileId: number;
      isWinner: boolean;
      score: number | null;
      isVp: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          isVp: r.isVp,
        })),
      );

      // An API call to BGG is still required because only selected expansion
      // details are stored in the database. New expansions additional expansions
      // a user might add still needs information from BGG
      const expansionLinks = await fetchBGGDetails([
        { type: "boardgame", id: String(firstRow.gameId) },
      ])
        .then((details) => details[0]?.expansions ?? [])
        .catch(() => []);

      const gameDetails: BGGDetailsInterface = {
        id: String(firstRow.gameId),
        type: "boardgame",
        title: firstRow.gameTitle,
        thumbnail: firstRow.gameThumbnail ?? "",
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
        expansions: expansionLinks,
      };

      const tribe: SessionTribe = {
        id: firstRow.groupId,
        name: firstRow.tribeName!,
      };

      // team_id represents the team the player was in for team mode. If null,
      // means game mode was regular
      const teamMode = firstRow.teamId !== null;

      // Build players list sorted by position
      const players: Player[] = rows.map((row, idx) => ({
        id: String(idx + 1),
        profileId: row.profileId!,
        firstName: row.firstName!,
        lastName: row.lastName!,
        username: row.username!,
        profilePic: row.profilePic ?? "",
        groupId: row.groupId,
        isAnonymous: row.isAnonymous ?? false,
        score: row.victoryPoints,
        isWinner: row.isWinner,
        isTie: row.isTie,
        teamId: row.teamId !== null ? `team-${row.teamId}` : null,
      }));

      const datePlayed = new Date(firstRow.datePlayed + "T00:00:00");

      const expansions: SelectedExpansion[] = (result.expansions ?? []).map(
        (expansion) => ({
          id: String(expansion.id),
          title: expansion.title,
          thumbnail: expansion.thumbnail ?? "",
          image: expansion.image ?? "",
          yearPublished: String(expansion.yearPublished ?? 0),
          weight: String(expansion.weight ?? 0),
        }),
      );

      setInitialData({
        date: datePlayed,
        gameDetails,
        tribe,
        players,
        teamMode,
        coop: firstRow.coop,
        isVp: firstRow.isVp,
        sessionDescription: firstRow.sessionDescription,
        expansions,
      });

      setLoading(false);
    };

    loadSession();
  }, [user, sessionId]);

  if (loading) {
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
      toast.error(
        `Missing player info at position ${missingPlayers.join(", ")}.`,
      );
      return;
    }
    const containWinner = submittingPlayers.some((player) => player.isWinner);
    if (!containWinner) {
      toast.error("At least one winner must be selected.");
      return;
    }

    // Build payload
    const datePlayed = format(date, "yyyy-MM-dd");
    // Sessions weight is the average of base game + all selected expansions
    const weights = [
      parseFloat(gameDetails.weight),
      ...expansions.map((expansion) => parseFloat(expansion.weight)),
    ].filter((w) => !isNaN(w));
    const averagedWeight =
      weights.reduce((sum, w) => sum + w, 0) / weights.length;
    const bgg = {
      gameId: parseInt(gameDetails.id),
      gameTitle: gameDetails.title,
      gameWeight: String(averagedWeight),
      gameLength: parseInt(gameDetails.playingtime),
    };
    const numPlayers = submittingPlayers.length;
    const groupId = tribe.id;
    const dateInfo = getDateInfo(date);
    const expansionIds = expansions.map((expansion) => parseInt(expansion.id));

    // Team mode: All players in the team share the same position
    // Coop: All players share the same position (1) and score
    const positionedPlayers = coop
      ? submittingPlayers.map((player) => ({
          ...player,
          position: 1,
          teamVictoryPoints: player.score,
        }))
      : computePositions(submittingPlayers);

    // Team numbers represents which team the player was in
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

        return {
          sessionId,
          datePlayed,
          ...bgg,
          numPlayers,
          profileId: player.profileId,
          groupId,
          isVp,
          coop,
          sessionDescription,
          victoryPoints: teamVictoryPoints,
          isWinner: player.isWinner,
          position,
          winContrib: getWinContrib(numPlayers, player.isWinner),
          score,
          highScore: false,
          ...dateInfo,
          isFirstPlay: await getFirstPlay(String(bgg.gameId), player.profileId),
          isTie: coop ? false : player.isTie,
          teamId: teamNumberFor(player),
          createdBy: user.id,
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
        const expansionUpsertResponse = await upsertExpansionDetails(
          bgg.gameId,
          expansions,
        );
        if (!expansionUpsertResponse.success) {
          console.error("Failed to upsert expansion details");
        }

        const result = await updateSession(
          sessionId,
          oldRows,
          payload,
          expansionIds,
        );

        if (!result.success) {
          toast.error("Failed to update session. Please try again.");
        } else {
          posthog.capture("game_session_updated", {
            game_id: bgg.gameId,
            tribe_id: groupId,
            player_count: numPlayers,
            team_mode: teamMode,
          });
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

const Page = () => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }
  >
    <EditSessionPage />
  </Suspense>
);

export default Page;
