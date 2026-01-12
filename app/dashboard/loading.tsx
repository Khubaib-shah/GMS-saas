import { PageHeaderSkeleton, StatsCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton-components";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeaderSkeleton showButton={false} />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartSkeleton className="lg:col-span-2" />
        <ChartSkeleton />
      </div>

      {/* Members Table */}
      <div>
        <div className="mb-4">
          <div className="h-7 w-40 bg-accent animate-pulse rounded-md" />
        </div>
        <TableSkeleton columns={5} rows={5} />
      </div>
    </div>
  );
}
