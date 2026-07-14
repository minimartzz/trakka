import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const SettingsSkeleton = () => (
  <div className="w-full px-4 py-8 sm:px-8 lg:px-12">
    {/* Page title */}
    <Skeleton className="mb-8 h-9 w-56" />

    <div className="flex flex-col gap-10">
      {/* Details */}
      <div>
        <Skeleton className="mb-2 h-5 w-24" />
        <Skeleton className="mb-6 h-4 w-56" />
        <div className="mb-5 flex justify-center">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
        <Skeleton className="mb-4 h-9 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Players */}
      <div>
        <Skeleton className="mb-2 h-5 w-24" />
        <Skeleton className="mb-6 h-4 w-64" />
        <Skeleton className="mb-4 h-9 w-56" />
        <Skeleton className="mb-4 h-9 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        ))}
      </div>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  </div>
);

export default SettingsSkeleton;
