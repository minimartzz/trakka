import { fetchSessions } from "@/app/(account)/recent-games/action";
import { getDailyPlayerStats } from "@/app/(account)/tribe/[id]/action";
import TimeFilteredPerformance from "@/components/dashboard/TimeFilteredPerformance";
import { SessionDataInterface } from "@/lib/interfaces";
import fetchUser from "@/utils/fetchServerUser";
import { filterSessionData } from "@/utils/recordsProcessing";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { fetchGameMeta } from "./action";

const fetchSessionsByProfile = async (
  id: number,
): Promise<SessionDataInterface[]> => {
  try {
    const response = await fetchSessions(id);
    if (!response.success) {
      toast.error(response.message);
      return [];
    }
    return response.data ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const DashboardContent = async () => {
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  const [sessionData, dailyStats, gameMeta] = await Promise.all([
    fetchSessionsByProfile(user.id),
    getDailyPlayerStats({ profileId: user.id }),
    fetchGameMeta(user.id),
  ]);
  const processedSessions = filterSessionData(user.id, sessionData);

  return (
    <TimeFilteredPerformance
      userId={user.id}
      profile={{
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        image: user.image,
        memberSince: user.confirmed_at
          ? format(new Date(user.confirmed_at), "MMM yyyy")
          : "—",
        favouriteGames: user.favourite_games ?? [],
        showcaseSlots: user.showcase_slots ?? [],
      }}
      recentActivity={processedSessions}
      sessions={sessionData}
      dailyStats={dailyStats}
      gameMeta={gameMeta}
    />
  );
};

const Page = () => {
  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 mb-15">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
};

export default Page;
