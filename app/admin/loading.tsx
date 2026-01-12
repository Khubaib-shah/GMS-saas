import { PageHeaderSkeleton, AdminTableSkeleton } from "@/components/ui/skeleton-components";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeaderSkeleton />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
