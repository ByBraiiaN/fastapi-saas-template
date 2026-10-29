import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="shell flex h-16 items-center justify-between border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="shell grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-5">
          <Skeleton className="h-7 w-64 rounded-full" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-3/4 max-w-md" />
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-[420px] w-full rounded-[1.75rem]" />
      </div>
      <div className="shell pb-16">
        <Skeleton className="h-px w-full" />
      </div>
    </div>
  );
}
