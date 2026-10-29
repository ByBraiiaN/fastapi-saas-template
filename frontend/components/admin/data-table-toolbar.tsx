"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ToolbarFilterOption = {
  value: string;
  label: string;
};

export type ToolbarFilter = {
  id: string;
  label: string;
  value: string;
  options: ToolbarFilterOption[];
  onChange: (value: string) => void;
};

type DataTableToolbarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  meta?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
};

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = [],
  meta,
  onRefresh,
  isRefreshing = false,
  className,
}: DataTableToolbarProps) {
  const showSearch = typeof onSearchChange === "function";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-white/10 px-4 py-3 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {showSearch ? (
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <Input
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 border-white/10 bg-white/5 pl-9 pr-8 text-sm text-slate-100 placeholder:text-slate-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition-colors hover:text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}

        {filters.map((filter) => (
          <label key={filter.id} className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              {filter.label}
            </span>
            <select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              aria-label={filter.label}
              className="h-9 min-w-[8.5rem] rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-slate-200 outline-none transition-colors hover:border-white/20 focus-visible:border-indigo-400/60 focus-visible:ring-2 focus-visible:ring-indigo-500/25"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#0b1220]">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {meta ? <p className="text-xs text-slate-400">{meta}</p> : null}
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        ) : null}
      </div>
    </div>
  );
}
