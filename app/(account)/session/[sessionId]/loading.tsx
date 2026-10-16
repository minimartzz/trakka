import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the session page: header, the game rail (xl) or band, standings
export default function SessionLoading() {
  return (
    <div className="p-4 pb-16 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="mt-3 h-12 w-2/3 max-w-md" />
      <div className="mt-3 flex gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="mt-6 flex gap-8">
        {/* Game rail */}
        <div className="hidden w-72 shrink-0 overflow-hidden rounded-lg border xl:block">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-8">
          {/* Game band */}
          <div className="flex items-center gap-4 rounded-lg border p-4 xl:hidden">
            <Skeleton className="size-18 shrink-0 rounded-md sm:size-20" />
            <div className="flex-1 space-y-2 sm:max-w-xs">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Standings */}
          <div>
            <Skeleton className="h-7 w-32" />
            <div className="mt-3 divide-y rounded-lg border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-8 w-6" />
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Elo race */}
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
