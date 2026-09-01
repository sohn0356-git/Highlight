import { Lock } from "lucide-react";
import type { Badge } from "@/lib/types";

const LEVEL_COLORS = [
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", label: "Lv.1" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", label: "Lv.2" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", label: "Lv.3" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", label: "Lv.MAX" },
];

function getLevel(progress: number, thresholds: number[]): number {
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (progress >= thresholds[i]) level = i + 1;
  }
  return level;
}

export default function BadgeCard({ badge }: { badge: Badge }) {
  const thresholds = badge.levelThresholds || [badge.criteria];
  const maxLevel = thresholds.length;
  const level = getLevel(badge.progress, thresholds);
  const unlocked = level > 0;
  const color = unlocked ? LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)] : null;

  return (
    <div className={`relative flex flex-col items-center rounded-2xl border p-3.5 text-center transition ${
      unlocked ? `${color!.border} ${color!.bg}` : "border-neutral-100 bg-neutral-50/80"
    }`}>
      {!unlocked && (
        <span className="absolute right-2 top-2 text-neutral-300"><Lock size={12} /></span>
      )}
      <span className={`text-2xl ${unlocked ? "" : "opacity-35 grayscale"}`}>{badge.icon}</span>
      <p className={`mt-1.5 text-xs font-bold ${unlocked ? color!.text : "text-neutral-400"}`}>{badge.name}</p>

      {unlocked && (
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${color!.badge}`}>
          {level >= maxLevel ? "Lv.MAX" : `Lv.${level}`}
        </span>
      )}

      {unlocked && level < maxLevel && (
        <p className="mt-1 text-[10px] text-neutral-400">
          {badge.progress} / {thresholds[level]}
        </p>
      )}

      {!unlocked && (
        <p className="mt-1 text-[10px] font-semibold text-neutral-300">
          {badge.progress} / {thresholds[0]}
        </p>
      )}
    </div>
  );
}
