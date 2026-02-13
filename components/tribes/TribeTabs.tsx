"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Home, Users, Dices } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface TribeTabsProps {
  homeContent: React.ReactNode;
  playersContent: React.ReactNode;
  gamesContent: React.ReactNode;
}

/**
 * TribeTabs - A mobile-first tab navigation for tribe content
 *
 * Design decisions:
 * - Full-width tabs on mobile for easy thumb access
 * - Icons with labels for clear affordance
 * - Sticky positioning so tabs remain visible while scrolling
 * - Subtle animation on tab change for visual feedback
 * - Bottom border creates clear separation from content
 * - Uses the existing shadcn/ui Tabs component for accessibility
 */
const TribeTabs: React.FC<TribeTabsProps> = ({
  homeContent,
  playersContent,
  gamesContent,
}) => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <Tabs
      defaultValue="home"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      {/* Tab Navigation Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <TabsList className="w-full h-14 p-1 bg-transparent rounded-none justify-around">
          <TabsTrigger
            value="home"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Players</span>
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">Games</span>
          </TabsTrigger>
        </TabsList>

        {/* Active tab indicator line */}
        <div className="relative h-0.5 bg-muted">
          <motion.div
            className="absolute h-full bg-primary rounded-full"
            initial={false}
            animate={{
              left:
                activeTab === "home"
                  ? "0%"
                  : activeTab === "players"
                    ? "33.33%"
                    : "66.66%",
              width: "33.33%",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent value="home" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {homeContent}
        </motion.div>
      </TabsContent>

      <TabsContent value="players" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {playersContent}
        </motion.div>
      </TabsContent>

      <TabsContent value="games" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {gamesContent}
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

export default TribeTabs;
