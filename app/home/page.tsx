"use client";
import { Flame, IceCream } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import ClassRankingCard from "@/components/ClassRankingCard";
import ActivityCard from "@/components/ActivityCard";
import { useApp } from "@/lib/store-context";

export default function HomeContent() {
  const { student, isLoggedIn, classes, activities, sharedGoal, season } = useApp();
  if (!student || !isLoggedIn) return null;
  const myClass = classes.find(c => c.id === student.classId);

  return (
    <div>
      <div className="px-5 pt-7">
        <p className="text-xs font-bold tracking-widest text-indigo-500">{season.label}</p>
        <PageHeader title={season.title} />
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

      <section className="mt-5 px-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-base font-bold text-neutral-900">고등부 소식</h2>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
        </div>
      </section>

    </div>
  );
}
