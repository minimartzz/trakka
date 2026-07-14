"use client";

import AccountAvatarDialog from "@/components/account/AccountAvatarDialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import React from "react";

interface AccountProfileHeaderProps {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  defaultImageUrl: string;
  memberSince: string;
}

const AccountProfileHeader = ({
  userId,
  firstName,
  lastName,
  username,
  image,
  defaultImageUrl,
  memberSince,
}: AccountProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center md:flex-row md:items-start md:text-left">
      <AccountAvatarDialog
        userId={userId}
        image={image}
        defaultImageUrl={defaultImageUrl}
        altText={`${firstName} ${lastName}'s profile picture`}
      />

      <div className="flex flex-1 flex-col items-center gap-2 md:items-start">
        <h1 className="text-3xl font-bold">
          {firstName} {lastName}
        </h1>
        <p className="text-lg text-muted-foreground">@{username}</p>
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
          <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Member since {memberSince}
        </Badge>
      </div>
    </div>
  );
};

export default AccountProfileHeader;
