"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import { Loader2 } from "lucide-react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen pb-60 items-center justify-center p-6 text-center gap-5">
      <Image
        src="/not_found_dark.svg"
        alt="not_found logo"
        height={230}
        width={230}
        className="hidden dark:block"
      />
      <Image
        src="/not_found.svg"
        alt="not_found logo"
        height={230}
        width={230}
        className="dark:hidden"
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-accent-4">
          Oops! We couldn't find that!
        </h2>
        <p className="text-gray-400 text-sm">
          Sorry! We didn't find what you were looking for. Return to the
          homepage and try again.
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => {
            setIsLoading(true);
            router.push("/dashboard");
          }}
          className="bg-accent-5/90 hover:bg-accent-5"
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Returning to Homepage...</span>
            </div>
          ) : (
            "Return to Homepage"
          )}
        </Button>
      </div>
    </div>
  );
}
