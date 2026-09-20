import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 mb-15">
      <DashboardSkeleton />
    </div>
  );
}
