import { TrendingUp, Trophy } from "lucide-react";
import type { SchoolClass } from "@/lib/types";

export default function ClassRankingCard({ classes, myClassId }: { classes: SchoolClass[]; myClassId: string }) {
  const sorted = [...classes].sort((a, b) => b.xp - a.xp);
  const top = sorted[0];
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="text-base font-bold text-neutral-900">클래스 XP 랭킹</h2>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {sorted.map((c, i) => {
          const isMine = c.id === myClassId;
          const pct = top.xp > 0 ? (c.xp / top.xp) * 100 : 0;
          return (
            <div key={c.id} className={`rounded-xl px-3.5 py-2.5 ${isMine ? "bg-indigo-50 ring-1 ring-indigo-200" : "bg-neutral-50"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-neutral-200/70 text-neutral-500"}`}>{i + 1}</span>
                  <span className={`text-sm font-medium ${isMine ? "text-indigo-700" : "text-neutral-800"}`}>
                    {c.name} {isMine && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">나</span>}
                  </span>
                </div>
                <span className={`text-sm font-bold ${isMine ? "text-indigo-700" : "text-neutral-700"}`}>{c.xp.toLocaleString()} XP</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div className={`h-full rounded-full ${i === 0 ? "bg-amber-400" : isMine ? "bg-indigo-500" : "bg-neutral-300"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3.5 py-3">
        <TrendingUp size={16} className="text-orange-500" />
        <p className="text-sm text-orange-700">
          <span className="font-bold">🔥 이번 주 가장 많이 성장한 반</span>{" "}
          {top.name} +{top.weeklyXp.toLocaleString()} XP
        </p>
      </div>
    </div>
  );
}
