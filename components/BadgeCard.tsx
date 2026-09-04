import { Lock } from "lucide-react";

interface BadgeLevel {
  level: number;
  threshold: number;
  title: string;
  description: string;
  rewardMileage: number;
  rewardXp: number;
}

interface BadgeCardProps {
  badge: {
    id: string;
    icon: string;
    name: string;
    description: string;
    progress: number;
    currentLevel: number;
    levels: BadgeLevel[];
  };
}

const LEVEL_COLORS = [
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", bar: "bg-blue-400" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", bar: "bg-violet-400" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700", bar: "bg-rose-400" },
];

export default function BadgeCard({ badge }: BadgeCardProps) {
  const { icon, name, description, progress, currentLevel, levels } = badge;
  const maxLevel = levels.length;
  const isMaxLevel = currentLevel >= maxLevel;
  const colorIdx = Math.min(Math.max(currentLevel - 1, 0), LEVEL_COLORS.length - 1);
  const color = currentLevel > 0 ? LEVEL_COLORS[colorIdx] : null;

  const nextLevel = !isMaxLevel ? levels[currentLevel] : null;
  const prevThreshold = currentLevel > 0 ? levels[currentLevel - 1].threshold : 0;
  const nextThreshold = nextLevel ? nextLevel.threshold : prevThreshold;
  const progressInLevel = progress - prevThreshold;
  const neededForNext = nextThreshold - prevThreshold;
  const pct = neededForNext > 0 ? Math.min((progressInLevel / neededForNext) * 100, 100) : 100;

  return (
    <div className={`relative flex flex-col items-center rounded-2xl border p-3.5 text-center transition ${
      currentLevel > 0 ? `${color!.border} ${color!.bg}` : "border-neutral-100 bg-neutral-50/80"
    }`}>
      {currentLevel === 0 && (
        <span className="absolute right-2 top-2 text-neutral-300"><Lock size={12} /></span>
      )}
      <span className={`text-2xl ${currentLevel > 0 ? "" : "opacity-35 grayscale"}`}>{icon}</span>
      <p className={`mt-1.5 text-xs font-bold ${currentLevel > 0 ? color!.text : "text-neutral-400"}`}>{name}</p>

      {currentLevel > 0 && (
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${color!.badge}`}>
          {isMaxLevel ? "Lv.MAX" : `Lv.${currentLevel}`}
        </span>
      )}

      {currentLevel === 0 && (
        <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-400">
          미획득
        </span>
      )}

      {/* Progress info */}
      <div className="mt-2 w-full">
        {isMaxLevel ? (
          <p className="text-[11px] font-semibold text-neutral-500">
            {description.includes("연속") ? `최장 ${progress}일! 🎉` : "달성! 🎉"}
          </p>
        ) : nextLevel ? (
          <>
            <p className="text-[10px] text-neutral-500">
              {description.includes("연속") ? `최장 ${progress}일` : `${progress} / ${nextLevel.threshold}`}
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {description.includes("연속") ? `다음 레벨까지 ${Math.max(0, nextLevel.threshold - progress)}일` : `${nextLevel.title}까지 ${Math.max(0, nextLevel.threshold - progress)}남음`}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200/70">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color ? color.bar : "bg-neutral-300"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-[11px] font-semibold text-neutral-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
