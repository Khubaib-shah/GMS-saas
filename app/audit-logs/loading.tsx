
export default function AuditLogsLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="h-10 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>

      <div className="rounded-md border">
        <div className="h-12 bg-muted/50 border-b"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 border-b bg-card animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
