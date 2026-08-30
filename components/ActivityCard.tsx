import { Sparkles } from "lucide-react";
import type { CommunityActivity } from "@/lib/types";

export default function ActivityCard({ activity }: { activity: CommunityActivity }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-base">
        {activity.message.match(/[🎉🙏📖🔥🎊]/)?.[0] ?? <Sparkles size={16} className="text-indigo-500" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-neutral-800">{activity.message}</p>
        <p className="mt-1 text-xs text-neutral-400">{activity.timestamp}</p>
      </div>
    </div>
  );
}
