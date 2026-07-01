import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback for the authenticated account shell (sidebar + header) while the
 * server resolves the user and their tribes.
 *
 * Deliberately renders only the static chrome and leaves the content region
 * empty: this lets each route's own `loading.tsx` skeleton take over the page
 * area instead of a full-screen spinner masking it. Routes without a skeleton
 * fall through to their own page-level loading state.
 */
export default function AccountShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar rail */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Nav items */}
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>

        {/* Tribes group */}
        <Skeleton className="mt-4 h-4 w-16" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="mt-auto flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-20 shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-10 px-4">
            <Skeleton className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-x-4 px-4 sm:pr-10">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-10 w-12 sm:w-36 rounded-full" />
          </div>
        </header>

        {/* Content area intentionally left empty for the route's own skeleton */}
        <div className="flex-1" />
      </div>
    </div>
  );
}
