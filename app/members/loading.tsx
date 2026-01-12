import { PageHeaderSkeleton, FormCardSkeleton, TableSkeleton } from "@/components/ui/skeleton-components";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <FormCardSkeleton />
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
