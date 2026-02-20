"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Crown,
  Settings,
  Users2,
  Dices,
  BicepsFlexed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import RequestInbox from "./RequestInbox";

interface TribeAdmin {
  profileGroup: {
    id: number;
    profileId: number;
    groupId: string;
    roleId: number;
  };
  profile: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
  } | null;
}

interface TribeHeaderProps {
  tribeId: string;
  tribeName: string;
  tribeImage: string;
  tribeDescription: string;
  dateFormed: string;
  memberCount: number;
  gamesPlayed: number;
  creatorUsername: string;
  admins: TribeAdmin[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  userId: number;
}

/**
 * TribeHeader - Information about the tribe
 *
 * Design decisions:
 * - Gradient background creates depth and visual interest
 * - Floating card effect with subtle shadow for the tribe image
 * - Stats displayed as compact badges for quick scanning
 * - Admin avatars shown as a horizontal stack for social proof
 * - Animations on mount create a polished, premium feel
 * - Mobile-first responsive design with stacked layout on small screens
 */
const TribeHeader: React.FC<TribeHeaderProps> = ({
  tribeId,
  tribeName,
  tribeImage,
  tribeDescription,
  dateFormed,
  memberCount,
  gamesPlayed,
  creatorUsername,
  admins,
  isSuperAdmin,
  isAdmin,
  userId,
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-3/5 dark:from-primary/10 dark:to-accent-3/10" />

      {/* Decorative circles */}
      {/* <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-accent-3/5 blur-3xl" /> */}

      <div className="relative px-4 py-6 sm:px-8 sm:py-10">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Tribe Image Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Image container with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-3/20 blur-xl scale-110" />
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden ring-4 ring-background shadow-2xl">
                <Image
                  src={tribeImage}
                  alt={`${tribeName} tribe picture`}
                  className="object-cover"
                  fill
                  priority
                />
              </div>
            </div>

            {/* Admin controls - Mobile position */}
            {isSuperAdmin && (
              <div>
                <div className="absolute -top-2 -right-2 sm:hidden flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 rounded-full shadow-lg bg-gray-300"
                    asChild
                  >
                    <Link href={`/tribe/${tribeId}/edit`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="absolute -top-2 -right-13 sm:hidden flex gap-2">
                  <RequestInbox
                    profileId={userId}
                    tribeId={tribeId}
                    tribeImageUrl={tribeImage}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Tribe Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 text-center lg:text-left"
          >
            {/* Title row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {tribeName}
              </h1>
              {isSuperAdmin && (
                <Badge variant="secondary" className="w-fit mx-auto lg:mx-0">
                  <Crown className="w-3 h-3 mr-1 text-accent-5 fill-accent-5" />
                  SuperAdmin
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="secondary" className="w-fit mx-auto lg:mx-0">
                  <BicepsFlexed className="w-3 h-3 mr-1 text-accent-4 fill-accent-4" />
                  Admin
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground italic mb-5 max-w-xl mx-auto lg:mx-0">
              &ldquo;{tribeDescription}&rdquo;
            </p>

            {/* Stats row - pill badges for quick info */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm font-normal"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  Formed {dateFormed}
                </Badge>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm font-normal"
                >
                  <Users2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {memberCount} {memberCount === 1 ? "Member" : "Members"}
                </Badge>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm font-normal"
                >
                  <Dices className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {gamesPlayed} {gamesPlayed === 1 ? "Game" : "Games"} Played
                </Badge>
              </motion.div>
            </div>

            {/* Admins section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-accent-5 fill-accent-5" />
                SuperAdmins:
              </span>
              <div className="flex -space-x-2">
                {admins.map((admin, index) => (
                  <Tooltip key={admin.profileGroup.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: 0.4 + index * 0.05,
                        }}
                      >
                        <Avatar className="w-8 h-8 ring-2 ring-background cursor-pointer hover:ring-primary transition-all hover:scale-110 hover:z-10">
                          <AvatarImage
                            src={admin.profile?.image || ""}
                            alt={admin.profile?.username || "Admin"}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {admin.profile?.firstName?.[0] || "A"}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">
                        {admin.profile?.firstName} {admin.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        @{admin.profile?.username}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                Created by: @{creatorUsername}
              </span>
            </motion.div>
          </motion.div>

          {/* Admin Controls - Desktop position */}
          {isSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="hidden sm:flex sm:flex-row flex-col gap-3"
            >
              <RequestInbox
                profileId={userId}
                tribeId={tribeId}
                tribeImageUrl={tribeImage}
              />
              <Button variant="outline" className="gap-2 bg-gray-300" asChild>
                <Link href={`/tribe/${tribeId}/edit`}>
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TribeHeader;
