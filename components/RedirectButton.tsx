"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import React, { ComponentPropsWithoutRef, useState } from "react";
import { useFormStatus } from "react-dom";

interface RedirectButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  url?: string;
  label: string;
  loadLabel?: string;
}

const RedirectButton = ({
  url,
  label,
  loadLabel,
  className,
  onClick,
  ...props
}: RedirectButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);
  const router = useRouter();

  const { pending } = useFormStatus();
  const isLoading = isClicked || pending;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (url) {
      setIsClicked(true);
      router.push(url);
    }

    if (onClick) onClick(e);
  };

  return (
    <Button
      className={cn("font-semibold", className)}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadLabel}
        </div>
      ) : (
        <p>{label}</p>
      )}
    </Button>
  );
};

export default RedirectButton;
