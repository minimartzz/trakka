import { fetchSessions } from "@/app/(account)/recent-games/action";
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
  // Get user details
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  // Get All games that user has played
  const sessionData = await fetchSessionsByProfile(user.id);
  const processedSessions = filterSessionData(user.id, sessionData);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Performance</h1>
      </div>

      {/* Global Metrics */}
      <TimeFilteredPerformance
        userId={user.id}
        recentActivity={processedSessions}
        sessions={sessionData}
      />
    </div>
  );
};

export default Page;
