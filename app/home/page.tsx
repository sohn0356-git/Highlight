"use client";
import { useEffect, useState } from "react";
import { Bell, Flame, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import ClassRankingCard from "@/components/ClassRankingCard";
import ActivityCard from "@/components/ActivityCard";
import { useApp } from "@/lib/store-context";
import { getStudentLevel, getNextLevelXp } from "@/lib/db";

export default function HomeContent() {
  const { student, isLoggedIn, classes, activities, season, dailyQuestIds, completeDailyQuest, allStudents, refreshActivities, announcements } = useApp();
  const [feedOpen, setFeedOpen] = useState(false);

  useEffect(() => { refreshActivities(); }, [refreshActivities]);
  useEffect(() => {
    if (isLoggedIn && !dailyQuestIds.includes("d8")) completeDailyQuest("d8");
  }, [isLoggedIn, dailyQuestIds, completeDailyQuest]);

  if (!student || !isLoggedIn) return null;
  const myClass = classes.find(c => c.id === student.classId);
  const studentLevel = getStudentLevel(student.xp || 0);
  const nextXp = getNextLevelXp(studentLevel.level, false);

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader
          title="Highlight"
          subtitle={season.title}
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

      {/* ── 공지사항 (최상단) ── */}
      <section className="mt-3 px-5">
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg">📢</span>
            <h2 className="text-sm font-bold text-neutral-800">공지사항</h2>
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">등록된 공지가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 3).map((an: any) => (
                <div key={an.id} className={`rounded-lg px-3 py-2.5 ${an.important ? "bg-amber-50 border border-amber-200" : "bg-neutral-50 border border-neutral-100"}`}>
                  <div className="flex items-center gap-1.5">
                    {an.important && <span className="text-xs">📌</span>}
                    <p className="text-sm font-semibold text-neutral-800 truncate">{an.title}</p>
                  </div>
                  {an.content && <p className="mt-1 text-[11px] text-neutral-500 line-clamp-2">{an.content}</p>}
                  <p className="mt-1 text-[10px] text-neutral-400">{an.createdAt?.slice(0, 10) || ""}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── Hero Card: 이름 + 레벨 ── */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold">{student.name}</p>
              <p className="mt-1 text-xs font-bold tracking-widest text-indigo-200">{myClass?.name || "반 미배정"}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-extrabold">{(student.mileage || 0).toLocaleString()}</p>
                <span className="text-sm font-bold text-indigo-200">M</span>
              </div>
            </div>
            <div className="text-right">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 ml-auto">
                <Flame className="text-amber-300" size={28} />
              </div>
              <p className="mt-1.5 text-sm font-bold text-amber-200">LV.{studentLevel.level}</p>
            </div>
          </div>
          {nextXp < Infinity && (
            <div className="mt-3">
              <ProgressBar value={student.xp || 0} max={nextXp} className="bg-white/20" barClassName="bg-white" />
              <p className="mt-1 text-[10px] text-indigo-200 text-right">다음 레벨까지 {nextXp - (student.xp || 0)} XP</p>
            </div>
          )}
        </Card>
      </section>

      {/* ── 랭킹 ── */}
      <section className="mt-5 px-5">
        <ClassRankingCard
          classes={classes as any}
          myClassId={student.classId}
          students={allStudents as any}
          myStudentId={student.id}
        />
      </section>

      {/* ── 소식 모달 ── */}
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
