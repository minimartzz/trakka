"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Users, Dices, Shield } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface AccountTabsProps {
  profileContent: React.ReactNode;
  socialsContent: React.ReactNode;
  gamesContent: React.ReactNode;
  accountsContent: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TAB_POSITIONS: Record<string, string> = {
  profile: "0%",
  socials: "25%",
  games: "50%",
  accounts: "75%",
};

/**
 * AccountTabs - tab navigation for the account page
 *
 * Mirrors TribeTabs' icon+label sizing and animated underline for visual
 * consistency between the tribe and account surfaces, but stays static
 * (no sticky positioning/backdrop-blur) since this page is a profile you
 * scroll through, not a persistent workspace shell.
 */
const AccountTabs: React.FC<AccountTabsProps> = ({
  profileContent,
  socialsContent,
  gamesContent,
  accountsContent,
  activeTab,
  onTabChange,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Tabs
      defaultValue="profile"
      value={activeTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      {/* Tab Navigation Bar */}
      <div className="border-b">
        <TabsList className="w-full h-14 p-1 bg-transparent rounded-none justify-around">
          <TabsTrigger
            value="profile"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="socials"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Socials</span>
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">Games</span>
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="flex-1 h-full gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold rounded-lg transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
        </TabsList>

        {/* Active tab indicator line */}
        <div className="relative h-0.5 bg-muted">
          <motion.div
            className="absolute h-full bg-primary rounded-full"
            initial={false}
            animate={{
              left: TAB_POSITIONS[activeTab] ?? "0%",
              width: "25%",
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 30 }
            }
          />
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent value="profile" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          {profileContent}
        </motion.div>
      </TabsContent>

      <TabsContent value="socials" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          {socialsContent}
        </motion.div>
      </TabsContent>

      <TabsContent value="games" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          {gamesContent}
        </motion.div>
      </TabsContent>

      <TabsContent value="accounts" className="mt-0 focus-visible:ring-0">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          {accountsContent}
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

export default AccountTabs;
