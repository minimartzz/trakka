import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Timeframe Selection */}
      <div className="flex flex-col sm:flex-row gap-y-3 sm:gap-x-3 items-start sm:items-center">
        <div className="flex items-center gap-x-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-x-3">
          <Skeleton className="h-5 w-6" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* General Metrics - 3 Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:gap-x-4 gap-y-5 my-8">
        {/* Games Played Card */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
          </CardContent>
        </Card>

        {/* Win Rate Card */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-6 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-12" />
          </CardContent>
        </Card>

        {/* Top 5 Opponents Card */}
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-6 rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Game Performance */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch my-8 sm:gap-x-4 gap-y-5">
        {/* Recent Activity Card */}
        <Card className="w-full mb-3">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex-col space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <div className="flex -space-x-1">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-6 w-6 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Performance Card */}
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="flex justify-between items-center pb-2 border-b">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              {/* Table Rows */}
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-2 w-24 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
