export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="animate-pulse bg-border/30 h-6 w-32" />
        <div className="animate-pulse bg-border/30 h-4 w-48" />
      </div>
      <div className="border border-border bg-bg-card animate-pulse" style={{ height: "calc(100vh - 160px)" }} />
    </div>
  );
}
