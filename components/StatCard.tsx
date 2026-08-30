export default function StatCard({ label, value, icon, tone = "indigo" }: {
  label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: "indigo" | "amber" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  const iconCls = "bg-neutral-50 text-neutral-500";
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon && <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm ${tones[tone]}`}>{icon}</span>}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}
