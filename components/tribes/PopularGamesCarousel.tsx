"use client";

import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Dices } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface PopularGame {
  gameId: string;
  gameTitle: string;
  playCount: number;
  lastPlayed: string;
  imageUrl?: string | null;
}

interface PopularGamesCarouselProps {
  games: PopularGame[];
  delay?: number;
}

const GameImage: React.FC<{
  imageUrl?: string | null;
  gameTitle: string;
}> = ({ imageUrl, gameTitle }) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mt-4 mb-3">
        <Dices className="w-6 h-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-32 justify-center rounded-lg overflow-hidden mx-auto">
      <Image
        src={imageUrl}
        alt={`${gameTitle} cover`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover object-top"
        onError={() => setImageError(true)}
        fill
      />
    </div>
  );
};

/**
 * PopularGamesCarousel - Scrollable carousel of popular games
 *
 * Design decisions:
 * - Games arranged left to right by play count (most played first)
 * - Position badge in top-left corner with special colors for top 3
 * - Shows game name, play count, and last played date
 * - Uses Shadcn Carousel with left/right navigation buttons
 */
const PopularGamesCarousel: React.FC<PopularGamesCarouselProps> = ({
  games,
  delay = 0,
}) => {
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-br from-amber-400 to-amber-600 text-white";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-br from-amber-600 to-amber-800 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatLastPlayed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  };

  if (games.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        className="flex flex-col items-center justify-center py-8 text-muted-foreground"
      >
        <Dices className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">No games played yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full mb-15"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {games.map((game, index) => {
            const position = index + 1;

            return (
              <CarouselItem
                key={game.gameId}
                className="pl-2 md:pl-4 basis-[45%] sm:basis-[35%] md:basis-[28%] lg:basis-[22%]"
              >
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + index * 0.05 }}
                >
                  <Card className="relative overflow-hidden hover:bg-muted/50 transition-colors h-full flex flex-col py-0 gap-0">
                    {/* Position badge */}
                    <div
                      className={cn(
                        "absolute z-10 top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                        getPositionStyle(position),
                      )}
                    >
                      {position}
                    </div>

                    {/* Game image or icon */}
                    <GameImage
                      imageUrl={game.imageUrl}
                      gameTitle={game.gameTitle}
                    />

                    {/* Game info */}
                    <div className="text-center space-y-1 flex-grow p-4">
                      <p
                        className="font-medium text-sm truncate"
                        title={game.gameTitle}
                      >
                        {game.gameTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {game.playCount}{" "}
                        {game.playCount === 1 ? "play" : "plays"}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatLastPlayed(game.lastPlayed)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-x-1/2" />
        <CarouselNext className="right-0 translate-x-1/2" />
      </Carousel>
    </motion.div>
  );
};

export default PopularGamesCarousel;
