import { fetchSessions } from "@/app/(account)/recent-games/action";
import { filterSessionData } from "@/utils/recordsProcessing";
import { GroupedSession } from "@/lib/interfaces";
import ProfileDemo, { type DemoProfile } from "./profile-demo";
import TribeDemo from "./tribe-demo";

/**
 * Hardcoded demo identifiers for the public landing-page showcase.
 *   - DEMO_PROFILE: the user whose recent-games page is shown.
 *   - DEMO_TRIBE_ID: the tribe whose page is shown.
 */
const DEMO_PROFILE = {
  id: Number(process.env.LANDING_PAGE_RECENT_GAMES_ID),
  name: "Martin",
};
const DEMO_TRIBE = { id: process.env.LANDING_PAGE_TRIBE_ID, name: "John" };

async function loadDemoProfile(id: number, name: string): Promise<DemoProfile> {
  try {
    const response = await fetchSessions(id);
    if (!response.success || !response.data) {
      return { id, name, sessions: [] };
    }
    const sessions: GroupedSession[] = filterSessionData(
      id,
      response.data,
    ).filter((s) => s.isPlayer);
    return { id, name, sessions };
  } catch (error) {
    console.error(`Failed to load demo profile ${id}`, error);
    return { id, name, sessions: [] };
  }
}

const ProfileDemoServer = async () => {
  const profile = await loadDemoProfile(DEMO_PROFILE.id, DEMO_PROFILE.name);

  return (
    <ProfileDemo
      profile={profile}
      tribeView={<TribeDemo tribeId={DEMO_TRIBE.id!} name={DEMO_TRIBE.name} />}
    />
  );
};

export default ProfileDemoServer;
