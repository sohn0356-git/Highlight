import { Lock } from "lucide-react";
import type { Badge } from "@/lib/types";

export default function BadgeCard({ badge }: { badge: Badge }) {
  const unlocked = badge.progress >= badge.criteria && !badge.locked;
  return (
    <div className={`relative flex flex-col items-center rounded-2xl border p-3.5 text-center ${unlocked ? "border-indigo-100 bg-indigo-50/70" : "border-neutral-100 bg-neutral-50/80"}`}>
      {!unlocked && (
        <span className="absolute right-2 top-2 text-neutral-300"><Lock size={12} /></span>
      )}
      <span className={`text-2xl ${unlocked ? "" : "opacity-35 grayscale"}`}>{badge.icon}</span>
      <p className={`mt-1.5 text-xs font-bold ${unlocked ? "text-indigo-700" : "text-neutral-400"}`}>{badge.name}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-neutral-400">{badge.description}</p>
      {!unlocked && badge.criteria > 1 && (
        <p className="mt-1 text-[10px] font-semibold text-neutral-300">{badge.progress} / {badge.criteria}</p>
      )}
    </div>
  );
}
