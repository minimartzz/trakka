import TimeFilteredPerformance from "@/components/dashboard/TimeFilteredPerformance";
import { RecentGames } from "@/lib/interfaces";
import { topGames, topOpponents } from "@/utils/dashboardProcessing";
import fetchUser from "@/utils/fetchServerUser";
import { filterSessions } from "@/utils/recordsProcessing";
import { redirect } from "next/navigation";
import React from "react";

const baseUrl = process.env.BASE_URL;

const fetchRecentGamesByProfile = async (id: number | string) => {
  const profileId = String(id);
  try {
    const response = await fetch(`${baseUrl}/api/session/profile/${profileId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const Page = async () => {
  // Get user details
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  // Get All games that user has played
  const fetchedData = await fetchRecentGamesByProfile(user.id);
  const sessions: RecentGames[] = fetchedData.rawSessions;
  const processedSessions = filterSessions(user.id as number, sessions);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Performance</h1>
      </div>

      {/* Global Metrics */}
      <TimeFilteredPerformance
        userId={user.id}
        recentActivity={processedSessions}
        sessions={sessions}
      />
    </div>
  );
};

export default Page;
