"use client";
import { useEffect, useState } from "react";
import { Bell, Flame, IceCream, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import ClassRankingCard from "@/components/ClassRankingCard";
import ActivityCard from "@/components/ActivityCard";
import { useApp } from "@/lib/store-context";

export default function HomeContent() {
  const { student, isLoggedIn, classes, activities, sharedGoal, season, dailyQuestIds, completeDailyQuest } = useApp();
  const [feedOpen, setFeedOpen] = useState(false);

  // 홈 확인 일일 퀘스트 자동 달성
  useEffect(() => {
    if (isLoggedIn && !dailyQuestIds.includes("d5")) {
      completeDailyQuest("d5");
    }
  }, [isLoggedIn, dailyQuestIds, completeDailyQuest]);

  if (!student || !isLoggedIn) return null;
  const myClass = classes.find(c => c.id === student.classId);

  return (
    <div>
      <div className="px-5 pt-7">
        <p className="text-xs font-bold tracking-widest text-indigo-500">{season.label}</p>
        <PageHeader
          title={season.title}
          right={
            <button
              onClick={() => setFeedOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition active:scale-95 active:bg-neutral-50"
              aria-label="고등부 소식"
            >
              <Bell size={20} />
              {activities.length > 0 && (
                <span className="absolute right-2 top-2 grid h-2.5 w-2.5 place-items-center rounded-full bg-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
            </button>
          }
        />
      </div>

      <section className="mt-2 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold">{myClass?.name}</p>
              <p className="mt-0.5 text-sm text-indigo-100">
                현재 {myClass?.xp.toLocaleString()} XP
              </p>
              <p className="mt-0.5 text-sm font-semibold text-amber-200">
                이번 주 +{myClass?.weeklyXp.toLocaleString()} XP
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl">
              <Flame className="text-amber-300" size={26} />
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5">
        <ClassRankingCard classes={classes as any} myClassId={student.classId} />
      </section>

      <section className="mt-5 px-5">
        <Card className="border-amber-100 bg-amber-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🎯</span>
              <h2 className="text-sm font-bold text-neutral-800">{sharedGoal.label}</h2>
            </div>
            <span className="text-xs font-semibold text-amber-600">
              {sharedGoal.current.toLocaleString()} / {sharedGoal.target.toLocaleString()} XP
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={sharedGoal.current} max={sharedGoal.target} className="bg-amber-200/70" barClassName="bg-amber-400" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <IceCream size={14} />
            <span>{sharedGoal.reward}</span>
          </div>
        </Card>
      </section>

      <div className="h-6" />

      {feedOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setFeedOpen(false)}>
          <div
            className="max-h-[75vh] w-full max-w-md mx-auto overflow-y-auto rounded-t-3xl bg-neutral-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <h2 className="text-lg font-bold text-neutral-900">고등부 소식</h2>
              </div>
              <button
                onClick={() => setFeedOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-neutral-600 active:bg-neutral-300"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
