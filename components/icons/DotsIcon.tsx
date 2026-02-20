import React from "react";
import { cn } from "@/lib/utils"; // Standard shadcn utility

interface DiceIconProps {
  value: number;
  className?: string;
}

const DotsIcon = ({ value, className }: DiceIconProps) => {
  // Logic: 1-10 are shown as dots, > 10 shown as a number
  const isNumeric = value > 10;

  // Map of dot positions for a 3x3 grid
  // Grid positions:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  const dotMapping: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
    7: [0, 2, 3, 4, 5, 6, 8],
    8: [0, 1, 2, 6, 7, 8, 3, 5],
    9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    10: [0, 1, 2, 3, 5, 6, 7, 8, 4], // 10 is crowded, so we just fill most
  };

  return (
    <div
      className={cn(
        "flex aspect-square h-6 w-6 items-center justify-center rounded-md p-1 mr-1",
        className,
      )}
    >
      {isNumeric ? (
        <span className="text-xs font-bold leading-none">{value}</span>
      ) : (
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              {dotMapping[value]?.includes(i) && (
                <div className="h-full w-full max-h-[5px] max-w-[5px] rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DotsIcon;
