import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 py-8 text-center md:flex-row md:items-start md:text-left">
        <Skeleton className="h-28 w-28 shrink-0 rounded-full md:h-32 md:w-32" />
        <div className="flex flex-1 flex-col items-center gap-2 md:items-start">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-40 rounded-md" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b">
        <div className="flex h-14 items-center justify-around gap-2 p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-full flex-1 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tab content: section header band + fields, matching ProfileTab */}
      <div className="py-6">
        <div className="flex items-center justify-between border-b px-1 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-1 py-6 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
