"use client";

import AccountProfileHeader from "@/components/account/AccountProfileHeader";
import AccountsTab from "@/components/account/AccountsTab";
import AccountTabs from "@/components/account/AccountTabs";
import GamesTab from "@/components/account/GamesTab";
import ProfileTab from "@/components/account/ProfileTab";
import SocialsTab from "@/components/account/SocialsTab";
import { TribeGridCardData } from "@/components/account/TribeGridCard";
import type { FavouriteGame } from "@/db/schema/profile";
import React, { useState } from "react";

interface AccountUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  gender: string;
  description: string;
  image: string;
}

interface AccountPageClientProps {
  user: AccountUser;
  memberSince: string;
  tribes: TribeGridCardData[];
  defaultImageUrl: string;
  favouriteGames: FavouriteGame[];
}

const AccountPageClient = ({
  user,
  memberSince,
  tribes,
  defaultImageUrl,
  favouriteGames,
}: AccountPageClientProps) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);

  const handleTabChange = (tab: string) => {
    // Leaving the Profile tab mid-edit discards the in-progress edit state
    if (tab !== "profile") setEditMode(false);
    setActiveTab(tab);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 mb-20">
      <AccountProfileHeader
        userId={user.id}
        firstName={user.first_name}
        lastName={user.last_name}
        username={user.username}
        image={user.image}
        defaultImageUrl={defaultImageUrl}
        memberSince={memberSince}
      />

      <AccountTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profileContent={
          <ProfileTab
            user={user}
            editMode={editMode}
            onEditModeChange={setEditMode}
          />
        }
        socialsContent={<SocialsTab tribes={tribes} />}
        gamesContent={<GamesTab favouriteGames={favouriteGames} />}
        accountsContent={<AccountsTab />}
      />
    </div>
  );
};

export default AccountPageClient;
