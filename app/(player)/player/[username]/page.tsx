/**
 * @page PlayerPage
 * @route `/player/[username]`
 *
 * @description Public player page: anyone with the link can see a player's
 * stats unless they've turned their profile private. Rendered on every
 * request so a visibility change applies straight away.
 */
import { fetchGameElos, fetchGameMeta } from "@/app/(account)/dashboard/data";
import { fetchSessions } from "@/app/(account)/recent-games/data";
import {
  LatestSessionBanner,
  PlayerHeader,
  RecordsStrip,
} from "@/components/player/PlayerSections";
import PlayerGames from "@/components/player/PlayerGames";
import PlayerTabs from "@/components/player/PlayerTabs";
import SessionFrequencyChart from "@/components/player/SessionFrequencyChart";
import TopTagsChart from "@/components/player/TopTagsChart";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteUrl } from "@/lib/seo";
import {
  averageComplexity,
  averageWpa,
  highestEloGame,
  lastMonthAverages,
  mostPlayedGame,
  playedGames,
  topTags,
  topTribe,
  weeklySessions,
} from "@/utils/playerProfile";
import { filterSessionData } from "@/utils/recordsProcessing";
import { getAuthUser } from "@/utils/supabase/server";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGameImages, getPlayerProfile, type PlayerProfile } from "./data";

type PlayerParams = Promise<{ username: string }>;

export async function generateMetadata({
  params,
}: {
  params: PlayerParams;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPlayerProfile(username);
  // Shared links preview, but player pages stay out of search results
  const base: Metadata = {
    robots: { index: false, follow: false },
    alternates: { canonical: absoluteUrl(`/player/${username}`) },
  };
  if (!profile?.isPublic) return { ...base, title: "Player" };

  const name = `${profile.firstName} ${profile.lastName}`;
  const description = `${name}'s board game stats on Trakka`;
  return {
    ...base,
    title: `${name} (@${profile.username})`,
    description,
    openGraph: {
      title: `${name} on Trakka`,
      description,
      images: profile.image ? [{ url: profile.image }] : undefined,
    },
    twitter: { card: "summary", title: `${name} on Trakka`, description },
  };
}

const PrivateNotice = () => (
  <div className="flex flex-col items-center py-24 text-center">
    <Lock className="size-8 text-muted-foreground" />
    <h1 className="mt-4 font-display text-4xl font-bold">This profile is private</h1>
    <p className="mt-2 max-w-sm text-muted-foreground">
      This player has chosen to keep their stats to themselves.
    </p>
  </div>
);

const PlayerStats = async ({ profile }: { profile: PlayerProfile }) => {
  const [sessionsResult, elos, gameMeta] = await Promise.all([
    fetchSessions(profile.id),
    fetchGameElos(profile.id),
    fetchGameMeta(profile.id),
  ]);
  // Newest first, only sessions this player was in
  const sessions = filterSessionData(
    profile.id,
    sessionsResult.data ?? [],
  ).filter((s) => s.isPlayer);
  const latest = sessions[0];
  const today = new Date();
  const images = await getGameImages([...new Set(sessions.map((s) => s.gameId))]);
  const favouriteIds = new Set(profile.favouriteGames.map((g) => g.bggId));
  const games = playedGames(sessions, elos, favouriteIds).map((g) => ({
    ...g,
    image: images[g.gameId] ?? g.thumbnail,
    categories: gameMeta.categories[g.gameId] ?? [],
    mechanics: gameMeta.mechanics[g.gameId] ?? [],
  }));

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <PlayerHeader
          firstName={profile.firstName}
          lastName={profile.lastName}
          username={profile.username}
          image={profile.image}
          joinedAt={profile.joinedAt}
          lastPlayed={latest?.datePlayed ?? null}
        />
        {latest && (
          <div className="lg:w-md lg:shrink-0">
            <LatestSessionBanner
              session={latest}
              profileId={profile.id}
              image={images[latest.gameId] ?? null}
            />
          </div>
        )}
      </div>

      <PlayerTabs
        profileContent={
          latest ? (
            <div className="flex flex-col gap-4">
              <RecordsStrip
                wpa={averageWpa(sessions, profile.id)}
                sessionCount={sessions.length}
                complexity={averageComplexity(sessions)}
                topGame={mostPlayedGame(sessions)}
                topElo={highestEloGame(elos, sessions)}
                tribe={topTribe(sessions)}
              />
              <SessionFrequencyChart
                weeks={weeklySessions(sessions, today)}
                averages={lastMonthAverages(sessions, today)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TopTagsChart
                  title="Top Mechanics"
                  tags={topTags(sessions, gameMeta.mechanics)}
                  tone="cool"
                  empty="No mechanic data yet."
                />
                <TopTagsChart
                  title="Top Categories"
                  tags={topTags(sessions, gameMeta.categories)}
                  tone="warm"
                  empty="No category data yet."
                />
              </div>
            </div>
          ) : (
            <p className="rounded-xl border bg-card p-6 text-muted-foreground">
              No sessions yet.
            </p>
          )
        }
        gamesContent={<PlayerGames games={games} />}
      />
    </>
  );
};

const PlayerContent = async ({ params }: { params: PlayerParams }) => {
  const { username } = await params;
  const profile = await getPlayerProfile(username);
  if (!profile) notFound();

  const viewer = await getAuthUser();
  const isOwner = Boolean(viewer && viewer.id === profile.uuid);
  if (!profile.isPublic && !isOwner) return <PrivateNotice />;

  return (
    <>
      {!profile.isPublic && (
        <p className="mb-6 rounded-lg border px-4 py-3 text-sm">
          Only you can see this -{" "}
          <Link
            href="/account?tab=accounts"
            className="font-semibold text-primary underline underline-offset-4"
          >
            make it public in Account settings
          </Link>
        </p>
      )}
      <PlayerStats profile={profile} />
    </>
  );
};

const PlayerPageSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <Skeleton className="size-28 rounded-full sm:size-36" />
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-28 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const Page = ({ params }: { params: PlayerParams }) => (
  <main className="mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-8 sm:pt-28">
    <Suspense fallback={<PlayerPageSkeleton />}>
      <PlayerContent params={params} />
    </Suspense>
  </main>
);

export default Page;
