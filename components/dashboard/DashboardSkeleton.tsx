import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the layout in TimeFilteredPerformance section for section so the
// page doesn't jump when the real content streams in.

// A card with the bordered title strip most dashboard cards share
const HeaderCard = ({
  titleWidth = "w-24",
  children,
  className,
}: {
  titleWidth?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={`h-full gap-0 py-0 ${className ?? ""}`}>
    <CardContent className="flex h-full flex-col p-0">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <Skeleton className={`h-5 ${titleWidth}`} />
        <Skeleton className="size-4 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
    </CardContent>
  </Card>
);

// One row of the Tribes / Players cards: avatar, two lines, a bar, a chip
const PersonRow = () => (
  <div className="flex items-center gap-3 py-3">
    <Skeleton className="size-10 shrink-0 rounded-lg" />
    <div className="min-w-0 flex-1 space-y-1.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="hidden h-3.5 w-40 md:block" />
    <Skeleton className="h-5 w-10 rounded" />
    <Skeleton className="size-4" />
  </div>
);

/**
 * DashboardSkeleton - Placeholder for the dashboard while its data loads.
 *
 * Content only: the page shell (padding, min height) comes from whichever
 * parent renders it, so the route loading file and the in-page Suspense
 * fallback line up with the real content.
 */
const DashboardSkeleton = () => (
  <div className="space-y-8">
    {/* ── Heading + timeframe filter ─────────────────────────────────────── */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-full rounded-full sm:w-80" />
    </div>

    {/* ── Key stats: profile, two stat cards, latest session ─────────────── */}
    <section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
        <div className="col-span-2 lg:col-span-1 lg:row-span-2">
          <Card className="h-full gap-0 py-0">
            <CardContent className="flex h-full flex-col gap-5 p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 shrink-0 rounded-full lg:size-20" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
              <div className="hidden h-px bg-border lg:block" />
              <div className="hidden flex-1 flex-col justify-between gap-4 lg:flex">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <div className="flex justify-end gap-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="size-12 rounded-md" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {[...Array(2)].map((_, i) => (
          <Card key={i} className="h-full gap-0 border-0 py-0 shadow-sm">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="size-10 rounded-xl" />
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
                <Skeleton className="h-14 w-24" />
                <Skeleton className="hidden h-14 flex-1 lg:block" />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="col-span-2">
          <Card className="h-full gap-0 py-0">
            <CardContent className="flex h-full flex-col p-4 sm:p-5">
              <Skeleton className="mb-4 h-6 w-32" />
              <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                <Skeleton className="h-32 w-full shrink-0 rounded-lg sm:aspect-square sm:h-auto sm:w-36" />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex -space-x-3 sm:space-x-0 sm:gap-2">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="size-9 rounded-full ring-2 ring-background sm:size-11"
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-14 w-16 rounded-lg sm:w-20"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* ── Detailed stats + genre overview + summary ──────────────────────── */}
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="h-full gap-0 py-0">
          <CardContent className="p-0">
            {/* Tab strip */}
            <div className="flex gap-6 border-b px-4 py-3.5 sm:px-5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex gap-3">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
              <div className="divide-y">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                    <Skeleton className="h-4 w-40 sm:w-56" />
                    <div className="ml-auto flex items-center gap-4">
                      <Skeleton className="hidden h-4 w-12 md:block" />
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="hidden h-4 w-8 md:block" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col">
          <HeaderCard titleWidth="w-32">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <div className="flex min-h-100 flex-1 items-center justify-center lg:min-h-45">
              <Skeleton className="size-44 rounded-full" />
            </div>
          </HeaderCard>
        </div>

        <HeaderCard titleWidth="w-40">
          <div className="grid h-36 grid-cols-12 items-end gap-1">
            {[35, 60, 45, 80, 30, 70, 55, 90, 40, 65, 50, 75].map((h, i) => (
              <Skeleton
                key={i}
                className="rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <Skeleton className="mt-3 h-3 w-48" />
          <Skeleton className="mt-2 h-3 w-40" />
        </HeaderCard>
      </div>
    </section>

    {/* ── Tribes + players ───────────────────────────────────────────────── */}
    <section className="grid gap-4 lg:grid-cols-2">
      {[5, 6].map((rows, i) => (
        <Card key={i} className="h-full gap-0 py-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="divide-y px-4 sm:px-5">
              {[...Array(rows)].map((_, j) => (
                <PersonRow key={j} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  </div>
);

export default DashboardSkeleton;
