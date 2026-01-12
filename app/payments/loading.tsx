import { PageHeaderSkeleton, StatsCardSkeleton, FormCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-components";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeaderSkeleton showButton={false} />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Filter Card */}
      <FormCardSkeleton />

      {/* Payments Table */}
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
