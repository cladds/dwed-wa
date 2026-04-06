interface OperativeProfileProps {
  params: { id: string };
}

export default function OperativeProfilePage({ params }: OperativeProfileProps) {
  return (
    <div>
      <p className="font-system text-coord-blue text-xs mb-4 tracking-widest uppercase">
        Operative // {params.id}
      </p>
      <h1 className="font-heading text-2xl text-gold tracking-wide mb-6">
        Operative Profile
      </h1>
      <div className="border border-border bg-bg-card p-6 min-h-[200px]">
        <p className="font-system text-text-dim text-xs">
          {"// operative data pending Supabase connection"}
        </p>
      </div>
    </div>
  );
}
