import { Skeleton } from "@/components/ui/skeleton"

export const LoadingState = () => (
  <div className="w-full space-y-6 animate-in fade-in-0 duration-300">
    <div className="space-y-2">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <Skeleton className="h-4 w-56 rounded-lg" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-5 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-3 w-36 rounded-lg" />
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-3">
      <Skeleton className="h-5 w-48 rounded-lg" />
      <Skeleton className="h-3 w-64 rounded-lg" />
      <Skeleton className="h-64 md:h-80 w-full rounded-xl" />
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-3 w-20 rounded-lg" />
        ))}
      </div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <Skeleton className="h-5 w-40 rounded-lg" />
    </div>
  </div>
)
