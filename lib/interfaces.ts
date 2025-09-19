// Custom Interfaces
import { SelectCompGameLog } from "@/db/schema/compGameLog";

// For Recent Games section
interface SqUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}
interface SqGroup {
  id: string;
  name: string;
}
export interface RecentGroupGames {
  comp_game_log: SelectCompGameLog;
  sqUser: SqUser;
  sqGroup: SqGroup;
}
