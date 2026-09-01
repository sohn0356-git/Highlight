"use client";
import { useEffect } from "react";
import { Target, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import BadgeCard from "@/components/BadgeCard";
import { useApp } from "@/lib/store-context";

export default function MissionsContent() {
  const { student, isLoggedIn, missions, completedMissionIds, completeMission, badges, dailyQuests, dailyQuestIds, completeDailyQuest } = useApp();

  // (d6 제거됨 - 더 이상 미션 탭 방문으로 자동 달성하지 않음)

  if (!student || !isLoggedIn) return null;

  const special = missions.filter(m => m.category === "special");
  const dailyTotal = dailyQuests.length;
  const dailyDone = dailyQuestIds.length;

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="일일 퀘스트" showBack subtitle="활동하면 자동으로 달성돼요!" right={<Target size={18} className="text-indigo-400" />} />
      </div>

      {/* Progress bar */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-violet-500 border-0 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">오늘의 퀘스트</p>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{dailyDone}/{dailyTotal}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(dailyDone / dailyTotal) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-indigo-100">{dailyDone === dailyTotal ? "🎉 오늘 퀘스트 모두 달성!" : `${dailyTotal - dailyDone}개 남았어요`}</p>
        </Card>
      </section>

      {/* Daily quests */}
      <section className="mt-5 px-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
          <span className="text-indigo-500">📋</span>
          <span>오늘의 퀘스트</span>
        </h2>
        <p className="mt-1 text-xs text-neutral-500">QT, 공유, 기도 등 활동하면 자동으로 완료돼요.</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {dailyQuests.map(q => {
            const done = dailyQuestIds.includes(q.id);
            return (
              <div key={q.id} className={`rounded-2xl border p-4 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white shadow-sm"}`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-50 text-xl">{q.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-900"}`}>{q.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${done ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>+{q.reward}M</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{q.description}</p>
                  </div>
                </div>
                {done && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={14} /> 달성 완료!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Special missions */}
      {special.length > 0 && (
        <section className="mt-5 px-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
            <span className="text-amber-500">⭐</span>
            <span>SPECIAL QUEST</span>
          </h2>
          <p className="mt-1 text-xs text-neutral-500">특별한 이벤트 미션에 도전하세요.</p>
          <div className="mt-3 flex flex-col gap-3">
            {special.map(m => {
              const done = completedMissionIds.includes(m.id);
              return (
                <div key={m.id} className={`rounded-2xl border p-4 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white shadow-sm"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${done ? "bg-emerald-100" : "bg-neutral-50"}`}>{m.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-900"}`}>{m.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">+{m.reward}M</span>
                          {done && <CheckCircle2 size={18} className="text-emerald-500" />}
                        </div>
                      </div>
                      <p className={`mt-1 text-xs leading-relaxed ${done ? "text-emerald-600" : "text-neutral-500"}`}>{m.description}</p>
                      {done && <p className="mt-1.5 text-[11px] font-bold text-emerald-600">✅ 완료!</p>}
                      {!done && <p className="mt-1.5 text-[11px] font-semibold text-neutral-400">⏳ 진행 중</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-5 px-5 pb-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
          <span>🏆</span>
          <span>배지 컬렉션</span>
        </h2>
        <p className="mt-1 text-xs text-neutral-500">배지를 모아 고등부 활동을 기록하세요.</p>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {badges.map(b => <BadgeCard key={b.id} badge={b} />)}
        </div>
      </section>
    </div>
  );
}
