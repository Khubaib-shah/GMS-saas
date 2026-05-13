import { Suspense } from "react";
import SubscriptionsClient from "./SubscriptionsClient";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton-components";
import { PlanSkeleton } from "@/components/plan-skeleton";

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <PageHeaderSkeleton showButton={true} />
      <div className="space-y-4 md:space-y-8">
        <div className="h-4 w-32 bg-white/10 rounded-md mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlanSkeleton />
          <PlanSkeleton />
          <PlanSkeleton />
        </div>
      </div>
      <div className="mt-10">
        <div className="h-4 w-48 bg-white/10 rounded-md mb-6" />
        <TableSkeleton columns={6} rows={5} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SubscriptionsSkeleton />}>
      <SubscriptionsClient />
    </Suspense>
  );
}
