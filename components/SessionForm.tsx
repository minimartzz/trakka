"use client";
import { getSelectablePlayers } from "@/app/(generic)/session/create/action";
import BGGSearchBar from "@/components/BGGSearchBar";
import ExpansionSelection, {
  SelectedExpansion,
} from "@/components/ExpansionSelection";
import GroupSearchBar, { SessionTribe } from "@/components/GroupSearchBar";
import PlayerSessionSelection from "@/components/PlayerSessionSelection";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import { HandshakeIcon, SwordIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, User } from "lucide-react";
import Form from "next/form";
import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type selectablePlayersType = Awaited<
  ReturnType<typeof getSelectablePlayers>
>[number];

export interface Player extends selectablePlayersType {
  id: string;
  score: number | null;
  isWinner: boolean;
  isTie: boolean;
  // UI-only grouping key for team mode; null/undefined means a regular row.
  teamId?: string | null;
}

export interface SessionFormInitialData {
  date?: Date;
  gameDetails?: BGGDetailsInterface | null;
  tribe?: SessionTribe | null;
  players?: Player[];
  teamMode?: boolean;
  coop?: boolean;
  isVp?: boolean;
  sessionDescription?: string | null;
  expansions?: SelectedExpansion[];
}

interface SessionFormProps {
  userId: number;
  title: string;
  cardTitle: string;
  cardDescription: string;
  initialData?: SessionFormInitialData;
  onSubmit: (data: {
    date: Date;
    gameDetails: BGGDetailsInterface;
    tribe: SessionTribe;
    players: Player[];
    teamMode: boolean;
    coop: boolean;
    isVp: boolean;
    sessionDescription: string | null;
    expansions: SelectedExpansion[];
  }) => Promise<void>;
}

// BGG Mechanic category for cooperative games
const COOP_CATEGORY = "Cooperative Game";

const SessionForm: React.FC<SessionFormProps> = ({
  userId,
  title,
  cardTitle,
  cardDescription,
  initialData,
  onSubmit,
}) => {
  const firstUpdate = useRef(!initialData?.tribe);
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [teamMode, setTeamMode] = useState(initialData?.teamMode ?? false);

  // Calendar controls
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ?? new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Game details
  const [gameDetails, setGameDetails] = useState<BGGDetailsInterface | null>(
    initialData?.gameDetails ?? null,
  );

  // Tribe details
  const [tribe, setTribe] = useState<SessionTribe | null>(
    initialData?.tribe ?? null,
  );

  // Coop vs Competitive view: Boolean determines the view user's see
  const [coop, setCoop] = useState(initialData?.coop ?? false);
  // Coop: Prevents auto-default from switching back after the user has switched it
  const coopTouched = useRef(initialData?.coop !== undefined);

  useEffect(() => {
    if (coopTouched.current || !gameDetails) return;
    const isCoopByDefault = gameDetails.mechanics.some(
      (mechanic) => mechanic.name === COOP_CATEGORY,
    );
    setCoop(isCoopByDefault);
  }, [gameDetails]);

  const handleCoopChange = (value: string) => {
    coopTouched.current = true;
    const nextCoop = value === "cooperative";
    setCoop(nextCoop);
    if (nextCoop && teamMode) {
      handleTeamModeChange(false);
    }
  };

  // Expansions selected for this session
  const [expansions, setExpansions] = useState<SelectedExpansion[]>(
    initialData?.expansions ?? [],
  );

  // Coop: Session description - for logging progress
  const [sessionDescription, setSessionDescription] = useState(
    initialData?.sessionDescription ?? "",
  );

  // Player details
  const [selectablePlayers, setSelectablePlayers] = useState<
    selectablePlayersType[]
  >([]);
  const [submittingPlayers, setSubmittingPlayers] = useState<Player[]>(
    initialData?.players ?? [
      {
        id: "1",
        profileId: 0,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
        groupId: "",
        isAnonymous: false,
        score: null,
        isWinner: false,
        isTie: false,
      },
      {
        id: "2",
        profileId: 0,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
        groupId: "",
        isAnonymous: false,
        score: null,
        isWinner: false,
        isTie: false,
      },
    ],
  );

  // Marks a solo game if the length of players is 1
  const isSolo = submittingPlayers.length === 1;

  // Rated vs Unrated sessions: Unrated scores do not contribute to the overall WPA
  // Auto Unrated for Coop & Solo sessions
  const [userIsVpChoice, setUserIsVpChoice] = useState(
    initialData?.isVp ?? true,
  );
  const isVpLocked = coop || isSolo;
  const isVp = isVpLocked ? false : userIsVpChoice;

  useEffect(() => {
    const fetchPlayerDetails = async (tribeId: string) => {
      try {
        const response = await getSelectablePlayers(tribeId);
        setSelectablePlayers(response);
      } catch (error) {
        console.error("Failed to retrieve selectable players:", error);
      }
    };

    // Prevents running function on mount for create mode
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (tribe?.id) {
      fetchPlayerDetails(tribe.id);
    } else {
      setSelectablePlayers([]);
    }
  }, [tribe]);

  // For edit mode: fetch selectable players on mount if tribe is pre-set
  useEffect(() => {
    if (initialData?.tribe?.id) {
      getSelectablePlayers(initialData.tribe.id).then(setSelectablePlayers);
    }
  }, []);

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setIsCalendarOpen(false);
    }
  };

  // Toggling team mode doesn't drop entries in player data. It expands based on the
  // current players position
  const handleTeamModeChange = (enabled: boolean) => {
    setTeamMode(enabled);
    setSubmittingPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        teamId: enabled ? crypto.randomUUID() : null,
      })),
    );
  };

  const handleFormSubmit = async () => {
    setSubmitted(true);

    const hasMissingPlayer = submittingPlayers.some(
      (player) => player.firstName === "",
    );
    if (!gameDetails || !date || !tribe || hasMissingPlayer) {
      toast.error("Please fill in all required fields.");
      return;
    }

    await onSubmit({
      date,
      gameDetails,
      tribe,
      players: submittingPlayers,
      teamMode,
      coop,
      isVp,
      sessionDescription: coop ? sessionDescription || null : null,
      expansions,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="flex flex-row items-center w-full gap-4 p-5 border-b">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      <div className="container mx-auto px-4 py-20">
        <Form
          action={handleFormSubmit}
          className="max-w-4xl mx-auto flex flex-col"
        >
          {/* Competitive/ Cooperative tab switcher */}
          <div
            role="tablist"
            aria-label="Game Mode"
            className="flex w-full gap-2"
          >
            {(
              [
                { value: false, label: "Competitive", Icon: SwordIcon },
                { value: true, label: "Cooperative", Icon: HandshakeIcon },
              ] as const
            ).map(({ value, label, Icon }) => {
              const active = coop === value;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    handleCoopChange(value ? "cooperative" : "competitive")
                  }
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors",
                    value ? "bg-accent/30" : "bg-card",
                    active
                      ? "z-10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <Card
            className={cn(
              "relative overflow-hidden rounded-t-none border-none py-0",
              coop && "bg-accent/30",
            )}
          >
            {coop ? (
              <HandshakeIcon
                aria-hidden
                weight="fill"
                className="pointer-events-none absolute -bottom-6 -right-5 z-0 size-32 text-foreground/5"
              />
            ) : (
              <SwordIcon
                aria-hidden
                weight="fill"
                className="pointer-events-none absolute -bottom-6 -right-5 z-0 size-32 text-foreground/5"
              />
            )}

            <CardContent className="relative z-10 space-y-6 py-6">
              {/* Header */}
              <div className="space-y-1">
                <CardTitle className="text-2xl">{cardTitle}</CardTitle>
                <CardDescription>{cardDescription}</CardDescription>
              </div>

              <Separator />

              {/* Date Played */}
              <div className="space-y-2">
                <Label className="pb-1 text-lg">Date Played</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      aria-invalid={submitted && !date}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Please select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="bg-background rounded-2xl border w-auto p-2 mt-2 z-10"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleCalendarSelect}
                      className="rounded-md bg-background"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Game Selection */}
              <div className="space-y-2">
                <Label className="text-lg">Game Title</Label>
                <BGGSearchBar
                  onSelect={(selected) => {
                    // Removing base game removes all previously selected expansions
                    // Refreshes the expansions list
                    if (selected.id !== gameDetails?.id) {
                      setExpansions([]);
                    }
                    setGameDetails(selected);
                  }}
                  onClear={() => {
                    setGameDetails(null);
                    setExpansions([]);
                  }}
                  initialGame={initialData?.gameDetails}
                  invalid={submitted && !gameDetails}
                  coop={coop}
                />
              </div>

              {/* Coop: Session Description field */}
              {coop && (
                <div className="space-y-2">
                  <Label htmlFor="session-description">
                    Session Description
                  </Label>
                  <Textarea
                    id="session-description"
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    placeholder="Log your scenario/ boss fight/ progress for this session"
                    className="bg-transparent dark:bg-transparent"
                  />
                </div>
              )}

              {/* Expansions: Follows BGG categorisation */}
              {gameDetails && gameDetails.expansions.length > 0 && (
                <ExpansionSelection
                  expansionLinks={gameDetails.expansions}
                  selected={expansions}
                  onChange={setExpansions}
                />
              )}

              <Separator />

              {/* Tribe Selection */}
              <div className="space-y-2">
                <Label htmlFor="tribe" className="text-lg">
                  Tribe
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select a tribe to tag the session to. A tribe MUST be selected
                  for players to be seen.
                </p>
                <GroupSearchBar
                  profileId={userId}
                  onSelect={setTribe}
                  initialTribeId={initialData?.tribe?.id}
                  invalid={submitted && !tribe}
                />
              </div>

              {/* Players */}
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-lg">Players</Label>
                    {isSolo && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <User className="size-3" />
                        Solo session
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center gap-2"
                      title={
                        isVpLocked
                          ? coop
                            ? "Cooperative games aren't scored"
                            : "Solo sessions aren't scored"
                          : undefined
                      }
                    >
                      <Label
                        htmlFor="is-vp"
                        className={cn(
                          "text-sm font-normal text-muted-foreground",
                          !isVpLocked && "cursor-pointer",
                        )}
                      >
                        {isVp ? "Rated" : "Unrated"}
                      </Label>
                      <Switch
                        id="is-vp"
                        checked={isVp}
                        disabled={isVpLocked}
                        onCheckedChange={setUserIsVpChoice}
                      />
                    </div>
                    {!coop && (
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="team-mode"
                          className="text-sm font-normal text-muted-foreground cursor-pointer"
                        >
                          Team mode
                        </Label>
                        <Switch
                          id="team-mode"
                          checked={teamMode}
                          onCheckedChange={handleTeamModeChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {coop
                    ? "Log everyone in the session, then mark whether the group won or lost together."
                    : teamMode
                      ? "Group players into teams. Each team shares one score and position."
                      : "Select player from the dropdown if they have an account else create an anonymous user. Position follows order."}
                </p>

                <PlayerSessionSelection
                  selectablePlayers={selectablePlayers}
                  players={submittingPlayers}
                  setPlayers={setSubmittingPlayers}
                  submitted={submitted}
                  teamMode={teamMode}
                  coop={coop}
                  isSolo={isSolo}
                />
              </div>
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default SessionForm;
