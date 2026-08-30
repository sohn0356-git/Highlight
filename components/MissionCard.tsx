import { CheckCircle2 } from "lucide-react";
import type { Mission } from "@/lib/types";

export default function MissionCard({ mission, completed, onComplete }: {
  mission: Mission; completed: boolean; onComplete: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition ${completed ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-50 text-xl">{mission.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-neutral-900">{mission.title}</h3>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">+{mission.reward}M</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{mission.description}</p>
        </div>
      </div>
      <button
        onClick={onComplete}
        disabled={completed}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
          completed ? "bg-emerald-100 text-emerald-600" : "bg-indigo-500 text-white active:bg-indigo-600"
        }`}
      >
        {completed ? (<><CheckCircle2 size={16} /> 완료했어요</>) : ("완료하기")}
      </button>
    </div>
  );
}
