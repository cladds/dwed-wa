import { TheorySkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="animate-pulse bg-border/30 h-6 w-32" />
        <div className="animate-pulse bg-border/30 h-8 w-28" />
      </div>
      <div className="flex gap-1 mb-6">
        <div className="animate-pulse bg-border/30 h-9 w-28" />
        <div className="animate-pulse bg-border/30 h-9 w-32" />
        <div className="animate-pulse bg-border/30 h-9 w-36" />
      </div>
      <div className="space-y-3">
        <TheorySkeleton />
        <TheorySkeleton />
        <TheorySkeleton />
      </div>
    </div>
  );
}
