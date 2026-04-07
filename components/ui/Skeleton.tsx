export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-border/30 ${className ?? ""}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border bg-bg-card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TheorySkeleton() {
  return (
    <div className="border border-border bg-bg-card px-5 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3].map(i => (
        <div key={i} className="px-5 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
