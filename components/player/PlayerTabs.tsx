"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const TABS = [
  { value: "profile", label: "Profile", icon: User },
  { value: "games", label: "Games", icon: Dices },
] as const;

// Radix remounts content on each switch, so the entry animation replays
const TAB_CONTENT =
  "mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none";

const PlayerTabs: React.FC<{
  profileContent: React.ReactNode;
  gamesContent: React.ReactNode;
}> = ({ profileContent, gamesContent }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const shouldReduceMotion = useReducedMotion();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <TabsList className="h-12 w-full justify-around rounded-none border-b bg-transparent p-1">
        {TABS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            // Strip the base trigger's static active box; the sliding indicator draws it instead
            className="relative h-full flex-1 gap-2 rounded-lg transition-colors data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-primary"
          >
            {activeTab === value && (
              // Shared layoutId slides the highlight between tabs
              <motion.span
                layoutId="player-tab-indicator"
                className="absolute inset-0 rounded-lg bg-primary/10 shadow-sm"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 30 }
                }
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile" className={TAB_CONTENT}>
        {profileContent}
      </TabsContent>
      <TabsContent value="games" className={TAB_CONTENT}>
        {gamesContent}
      </TabsContent>
    </Tabs>
  );
};

export default PlayerTabs;
