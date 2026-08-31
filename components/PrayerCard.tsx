import { useState } from "react";
import { HandHeart, ChevronDown, X } from "lucide-react";
import type { PrayerRequest } from "@/lib/types";

export default function PrayerCard({ prayer, studentId, onPray, nameMap }: {
  prayer: PrayerRequest; studentId: string; onPray: () => void;
  nameMap?: Record<string, string>;
}) {
  const already = prayer.prayedBy.includes(studentId);
  const [showPrayed, setShowPrayed] = useState(false);

  const prayedNames = prayer.prayedBy
    .map(id => nameMap?.[id] || id)
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-neutral-800">
          {prayer.anonymous ? "익명" : prayer.authorName}
        </span>
        <button
          onClick={() => setShowPrayed(v => !v)}
          className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500 transition active:scale-95"
          title="기도한 친구 보기"
        >
          🙏 {prayer.prayerCount}
          <ChevronDown size={12} className={`transition-transform ${showPrayed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showPrayed && (
        <div className="mt-3 rounded-xl bg-rose-50/60 border border-rose-100 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-600">🙏 함께 기도한 친구들</p>
            <button onClick={() => setShowPrayed(false)} className="text-rose-300 hover:text-rose-500"><X size={14} /></button>
          </div>
          {prayedNames.length === 0 ? (
            <p className="mt-1.5 text-xs text-rose-400">아직 기도한 친구가 없어요.</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {prayedNames.map((name, i) => (
                <span key={i} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 shadow-sm">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
