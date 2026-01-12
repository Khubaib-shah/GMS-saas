import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Stats Card Skeleton - matches StatsCard component
export function StatsCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
    </Card>
  );
}

// Table Skeleton - flexible table skeleton
interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  columns = 5, 
  rows = 5, 
  showHeader = true,
  className 
}: TableSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-6">
        <table className="w-full">
          {showHeader && (
            <thead>
              <tr className="border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="text-left py-4 px-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-4 px-4">
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-16" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Chart Skeleton - matches chart containers
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    </Card>
  );
}

// Form/Filter Card Skeleton - matches search and filter cards
export function FormCardSkeleton() {
  return (
    <Card className="p-6 mb-6">
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-64">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </Card>
  );
}

// Admin Table Skeleton - specific for admin page
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-20" /></th>
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-12" /></th>
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left py-4 px-6"><Skeleton className="h-4 w-24" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </td>
              <td className="py-4 px-6">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="py-4 px-6">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="py-4 px-6">
                <Skeleton className="h-8 w-20 rounded-full" />
              </td>
              <td className="py-4 px-6">
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
              <td className="py-4 px-6">
                <Skeleton className="h-4 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// Attendance Stats Skeleton
export function AttendanceStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton({ showButton = true }: { showButton?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      {showButton && <Skeleton className="h-10 w-32" />}
    </div>
  );
}
