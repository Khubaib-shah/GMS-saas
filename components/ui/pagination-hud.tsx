"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationHUDProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationHUD({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  className
}: PaginationHUDProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems === 0) return null;

  return (
    <div className={cn("p-4 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
          Showing <span className="text-primary">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> - <span className="text-primary">{Math.min(totalItems, currentPage * pageSize)}</span> of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-8 px-4 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black tracking-tighter uppercase transition-all hover:bg-primary hover:text-black disabled:opacity-30 disabled:grayscale"
        >
          Previous
        </Button>

        <div className="flex items-center gap-1 px-4">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            // Show current, first, last, and neighbors
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                    currentPage === pageNum
                      ? "bg-primary text-black shadow-lg shadow-primary/20"
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  {pageNum}
                </button>
              );
            } else if (
              (pageNum === 2 && currentPage > 3) ||
              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return <span key={pageNum} className="text-slate-700">...</span>;
            }
            return null;
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-8 px-4 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black tracking-tighter uppercase transition-all hover:bg-primary hover:text-black disabled:opacity-30 disabled:grayscale"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
