import { CardSkeleton, FeedSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="animate-pulse bg-border/30 w-9 h-9" />
        <div className="space-y-2">
          <div className="animate-pulse bg-border/30 h-5 w-40" />
          <div className="animate-pulse bg-border/30 h-3 w-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-bg-card">
          <div className="px-5 py-3 border-b border-border">
            <div className="animate-pulse bg-border/30 h-3 w-24" />
          </div>
          <FeedSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
