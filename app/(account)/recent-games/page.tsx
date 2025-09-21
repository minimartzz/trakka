import React from "react";
import { RecentGroupGames } from "@/lib/interfaces";
import { filterSessions, getFilteredCounts } from "@/utils/recordsProcessing";

const BASE_URL = process.env.BASE_URL;

const Page = async () => {
  const fetchRecentGroupGames = async () => {
    // TODO: Get the user group?
    const groupId = "a16cb5c8-8272-4fef-bf8d-5c0a532ce22d";
    try {
      const response = await fetch(`${BASE_URL}/api/session/group/${groupId}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Get the initial groups data
  const data = await fetchRecentGroupGames();
  const sessions: RecentGroupGames[] = data.groupSessions;
  const filteredSessions = filterSessions(1, sessions); // TODO: Change this to the Users ID
  const filteredCounts = getFilteredCounts(filteredSessions);
  console.log(filteredSessions);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Recent Games</h1>
        <p className="text-muted-foreground mt-2">
          You latest game sessions and results
        </p>
      </div>
    </div>
  );
};

export default Page;
