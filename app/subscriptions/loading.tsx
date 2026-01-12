import { PageHeaderSkeleton, StatsCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-components";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeaderSkeleton showButton={false} />
      
      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border">
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-10 w-32 mb-2" />
      </div>

      {/* Content Area */}
      <div className="grid gap-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
