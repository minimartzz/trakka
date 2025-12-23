"use client";
import { submitSessionRating } from "@/components/actions/submitSessionRating";
import { Star } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface StarRatingProps {
  profileId: number;
  sessionId: string;
  initialRating?: number;
  starSize: number;
}

const StarRating = ({
  profileId,
  sessionId,
  initialRating = 0,
  starSize,
}: StarRatingProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ratings = [1, 2, 3, 4, 5];

  // Prevent rating from being changed once selected
  // IMPROVEMENT: This might not be the best implementation
  const isLocked = rating > 0;

  const handleRating = async (newRating: number) => {
    if (isLocked || isSubmitting) return;

    setIsSubmitting(true);
    setRating(newRating); // NOTE: Optimistic handling

    const result = await submitSessionRating(profileId, sessionId, newRating);

    if (!result.success) {
      setRating(0);
      setIsSubmitting(false);
      toast.error("Failed to save rating. Please try again.");
    } else {
      toast.success("Rating successfully recorded!");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !isLocked && setHover(0)}
      >
        {ratings.map((star) => {
          const isFilled = isLocked ? star <= rating : star <= hover;

          return (
            <button
              key={star}
              type="button"
              disabled={isLocked || isSubmitting}
              className={`
                transition-all duration-200 focus:outline-none
                ${
                  isLocked ? "cursor-default" : "cursor-pointer hover:scale-110"
                }
              `}
              onClick={() => handleRating(star)}
              onMouseEnter={() => !isLocked && setHover(star)}
            >
              <Star
                size={starSize}
                fill={isFilled ? "#FFD700" : "transparent"}
                className={
                  isFilled ? "text-[#FFD700]" : "text-muted-foreground"
                }
                strokeWidth={isFilled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StarRating;
