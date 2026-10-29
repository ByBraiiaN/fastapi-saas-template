"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function TablePagination({
  total,
  limit,
  offset,
  hasNext,
  isFetching = false,
  onPrevious,
  onNext,
}: TablePaginationProps) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-400" aria-live="polite">
        Showing <span className="font-medium text-slate-200">{start}</span>–
        <span className="font-medium text-slate-200">{end}</span> of{" "}
        <span className="font-medium text-slate-200">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        {isFetching ? (
          <Loader2 className="size-3.5 animate-spin text-indigo-300" aria-hidden />
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={offset === 0 || isFetching}
          className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || isFetching}
          className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
        >
          Next
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
