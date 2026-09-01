import { Sparkles } from "lucide-react";
import type { CommunityActivity } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  level: "🎉",
  prayer: "🙏",
  qt: "📖",
  xp: "🔥",
  milestone: "🎊",
};

export default function ActivityCard({ activity }: { activity: CommunityActivity }) {
  const icon = TYPE_ICONS[activity.type] ?? <Sparkles size={16} className="text-indigo-500" />;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-lg">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-neutral-800">{activity.message}</p>
        <p className="mt-1 text-xs text-neutral-400">{activity.timestamp}</p>
      </div>
    </div>
  );
}
