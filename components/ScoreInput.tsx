"use client";
import { Player } from "@/app/(generic)/session/create/page";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface ScoreInputProps {
  playerId: string;
  updateScore: (id: string, updates: Partial<Player>) => void;
}

const ScoreInput = ({ playerId, updateScore }: ScoreInputProps) => {
  const [input, setInput] = useState("");
  // const [isValid, setIsValid] = useState(true);

  // // Validation - null or integer
  const isValid = input === "" || /^-?\d+$/.test(input) || input === "-";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val === "" || val === "-") {
      updateScore(playerId, { score: null });
    } else {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && /^-?\d+$/.test(val)) {
        updateScore(playerId, { score: parsed });
      }
    }
  };

  return (
    <div className="flex flex-col">
      <Input
        type="text"
        value={input}
        onChange={handleChange}
        className={cn(
          !isValid && "border-destructive focus-visible:ring-destructive"
        )}
        placeholder="-"
      />
      {!isValid && (
        <p className="text-[0.7rem] font-medium text-destructive mt-1">
          Numbers only
        </p>
      )}
    </div>
  );
};

export default ScoreInput;
