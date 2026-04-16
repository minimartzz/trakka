import { fetchSessions } from "@/app/(account)/recent-games/action";
import { getRollingPlayerStats } from "@/app/(account)/tribe/[id]/action";
import TimeFilteredPerformance from "@/components/dashboard/TimeFilteredPerformance";
import { SessionDataInterface } from "@/lib/interfaces";
import fetchUser from "@/utils/fetchServerUser";
import { filterSessionData } from "@/utils/recordsProcessing";
import { redirect } from "next/navigation";
import React from "react";
import { toast } from "sonner";

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

const Page = async () => {
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  const [sessionData, rollingStats] = await Promise.all([
    fetchSessionsByProfile(user.id),
    getRollingPlayerStats({ profileId: user.id }),
  ]);
  const processedSessions = filterSessionData(user.id, sessionData);

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 mb-15">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          My Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your stats across all tribes
        </p>
      </div>

      {/* Content */}
      <TimeFilteredPerformance
        userId={user.id}
        recentActivity={processedSessions}
        sessions={sessionData}
        rollingStats={rollingStats}
      />
    </div>
  );
};

export default Page;