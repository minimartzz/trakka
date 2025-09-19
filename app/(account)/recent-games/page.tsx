import React from "react";
import { Filter } from "lucide-react";
import { RecentGroupGames } from "@/lib/interfaces";
import { filterSessions } from "@/utils/recordsProcessing";

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

  const data = await fetchRecentGroupGames();
  const sessions: RecentGroupGames[] = data.groupSessions;
  const filteredSessions = filterSessions(sessions);
  console.log(filteredSessions[0]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Recent Games</h1>
        <p className="text-muted-foreground mt-2">
          You latest game sessions and results
        </p>
      </div>

      <ul>
        {sessions.map((item) => (
          <li key={item.comp_game_log.id}>
            <p>{item.comp_game_log.id}</p>
            <p>{item.sqGroup.id}</p>
            <p>{item.sqUser.id}</p>
          </li>
        ))}
      </ul>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>

          {/* Filter Selection */}
        </div>
      </div>
    </div>
  );
};

export default Page;
