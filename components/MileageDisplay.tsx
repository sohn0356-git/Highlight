export default function MileageDisplay({ amount, size = "lg" }: { amount: number; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <div className="flex items-baseline gap-1">
      <span className={`${cls} font-extrabold text-indigo-600`}>{amount.toLocaleString()}</span>
      <span className="text-lg font-semibold text-indigo-400">M</span>
    </div>
  );
}
