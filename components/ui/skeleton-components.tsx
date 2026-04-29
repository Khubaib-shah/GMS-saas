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

// Chart Content Skeletons - pure visualization placeholders
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-[250px] flex flex-col justify-end gap-1 pb-4", className)}>
      <div className="flex-1 flex items-end gap-1 px-2">
        {Array.from({ length: 40 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 bg-white/[0.03] rounded-t-[2px] transition-all" 
            style={{ 
              height: `${40 + Math.sin(i / 5) * 20 + Math.random() * 15}%`,
              opacity: 0.2 + (i % 8 === 0 ? 0.3 : 0)
            }}
          />
        ))}
      </div>
      <div className="h-4 flex justify-between px-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-1.5 w-12 bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// Specifically for Dashboard Bar Charts (Revenue/Attendance)
export function VerticalBarChartSkeleton() {
  return (
    <div className="w-full h-[250px] flex flex-col justify-end pb-4">
      <div className="flex-1 flex items-end justify-around px-8 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-1 max-w-[40px] gap-2">
            <Skeleton 
              className="w-full bg-white/[0.03] rounded-t-md relative overflow-hidden" 
              style={{ 
                height: i % 3 === 0 ? `${20 + Math.random() * 60}%` : '4px',
                opacity: i % 3 === 0 ? 0.8 : 0.2
              }}
            >
               {i % 3 === 0 && <div className="absolute inset-x-0 top-0 h-1 bg-primary/20" />}
            </Skeleton>
          </div>
        ))}
      </div>
      <div className="h-4 flex justify-around px-8 mt-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-1.5 w-10 bg-white/5" />
        ))}
      </div>
    </div>
  )
}

export function PieChartSkeleton() {
  return (
    <div className="w-full h-[250px] flex flex-col items-center justify-center">
      <div className="relative w-36 h-36 rounded-full border-[10px] border-white/[0.03] flex items-center justify-center animate-pulse">
        <div className="w-20 h-20 rounded-full border-4 border-white/[0.02]" />
        {/* Fake neon segment hint */}
        <div className="absolute inset-0 rounded-full border-[10px] border-primary/20 border-t-transparent border-l-transparent rotate-[30deg]" />
      </div>
      <div className="flex flex-wrap justify-center gap-6 mt-8 w-full px-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary/40' : 'bg-purple-500/40'}`} />
            <Skeleton className="h-2 w-16 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BarChartSkeleton() {
  return (
    <div className="w-full h-[250px] flex flex-col justify-center space-y-5 px-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-2 w-24 bg-white/5" />
            <Skeleton className="h-2 w-12 bg-white/5" />
          </div>
          <div className="relative w-full h-6 bg-white/[0.02] rounded-r-md overflow-hidden">
             <Skeleton 
               className="absolute inset-y-0 left-0 bg-white/5" 
               style={{ width: `${90 - (i * 15)}%` }} 
             />
             {/* Neon hint on the leading edge */}
             <div className="absolute inset-y-0 left-0 w-1 bg-primary/30" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Full Card Skeleton with Header (for Dashboard)
export function ChartCardSkeleton({ title, subtitle, type = "bar" }: { title?: string, subtitle?: string, type?: "bar" | "area" | "pie" }) {
  return (
    <Card className="p-6 glass-premium border-border bg-card dark:bg-slate-950/40 h-full flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          {title ? (
             <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{title}</h3>
          ) : (
            <Skeleton className="h-4 w-32 bg-white/5" />
          )}
          <Skeleton className="h-3 w-40 bg-white/5" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-2 w-24 ml-auto bg-primary/10" />
          <Skeleton className="h-7 w-28 bg-white/5" />
        </div>
      </div>
      <div className="flex-1 min-h-[250px]">
        {type === "bar" && <VerticalBarChartSkeleton />}
        {type === "area" && <ChartSkeleton />}
        {type === "pie" && <PieChartSkeleton />}
      </div>
    </Card>
  )
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
