export default function ProgressBar({ value, max, className = "", barClassName = "" }: {
  value: number; max: number; className?: string; barClassName?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 ${className}`}>
      <div
        className={`h-full rounded-full bg-indigo-500 transition-all duration-500 ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
