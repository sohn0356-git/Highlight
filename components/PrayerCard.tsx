import { HandHeart } from "lucide-react";
import type { PrayerRequest } from "@/lib/types";

export default function PrayerCard({ prayer, studentId, onPray }: {
  prayer: PrayerRequest; studentId: string; onPray: () => void;
}) {
  const already = prayer.prayedBy.includes(studentId);
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-neutral-800">
          {prayer.anonymous ? "익명" : prayer.authorName}
        </span>
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500">
          🙏 {prayer.prayerCount}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{prayer.content}</p>
      <button
        onClick={onPray}
        disabled={already}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-[0.98] ${
          already ? "bg-rose-100 text-rose-400" : "bg-rose-500 text-white active:bg-rose-600"
        }`}
      >
        <HandHeart size={14} />
        {already ? "기도했어요 🙏 (+5M)" : "기도했어요 🙏 +5M"}
      </button>
    </div>
  );
}
