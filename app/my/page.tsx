"use client";
import { useEffect, useState } from "react";
import { ChevronRight, ShieldCheck, Users, LogOut, Award, Target, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import BadgeCard from "@/components/BadgeCard";
import { useApp, useViewMode } from "@/lib/store-context";
import { getStudentLevel, getClassLevel, getNextLevelXp, fetchStudentBadgesWithProgress } from "@/lib/db";

export default function MyContent() {
  const { student, isLoggedIn, classes, logout, missions, completedMissionIds, completeMission, dailyQuests, dailyQuestIds, completeDailyQuest, badgeRefreshKey, teachers } = useApp();
  const { setMode } = useViewMode();
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  useEffect(() => {
    if (student?.id) {
      setBadgesLoading(true);
      fetchStudentBadgesWithProgress(student.id)
        .then(setBadges)
        .catch(() => setBadges([]))
        .finally(() => setBadgesLoading(false));
    }
  }, [student?.id, badgeRefreshKey]);

  if (!student || !isLoggedIn) return null;

  const isAdmin = student.role === "teacher" || student.role === "admin" || student.isTeacher || teachers.some((t: any) => t.id === student.id);
  const myClass = classes.find((c: any) => c.id === student.classId) as any;
  const studentLevel = getStudentLevel(student.xp || 0);
  const studentNextXp = getNextLevelXp(studentLevel.level, false);
  const classLevel = getClassLevel(myClass?.xp || 0);
  const classNextXp = getNextLevelXp(classLevel.level, true);

  const special = missions.filter((m: any) => m.category === "special");
  const dailyTotal = dailyQuests.length;
  const dailyDone = dailyQuestIds.length;

  const handleDeleteMission = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    // Admin function - not implemented here
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="프로필" showBack subtitle={student.name} right={<Users size={18} className="text-indigo-400" />} />
      </div>

      {/* Student XP & Level Card */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-200">내 레벨</p>
              <p className="mt-1 text-2xl font-extrabold">LV.{studentLevel.level}</p>
              <p className="mt-0.5 text-xs text-indigo-200">총 {(student.xp || 0).toLocaleString()} XP</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold">{(student.mileage || 0).toLocaleString()}<span className="text-sm font-bold text-indigo-200 ml-1">M</span></p>
              <p className="text-xs text-indigo-200">내 마일리지</p>
            </div>
          </div>
          {studentNextXp < Infinity && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-indigo-200">
                <span>LV.{studentLevel.level}</span>
                <span>LV.{studentLevel.level + 1}</span>
              </div>
              <ProgressBar value={student.xp || 0} max={studentNextXp} className="bg-white/20" barClassName="bg-white" />
              <p className="mt-1 text-[10px] text-indigo-200 text-right">{studentNextXp - (student.xp || 0)} XP 남음</p>
            </div>
          )}
        </Card>
      </section>

      {myClass && (
        <section className="mt-3 px-5">
          <Card className="bg-gradient-to-br from-amber-400 to-orange-400 border-0 text-white shadow-lg shadow-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-extrabold">{myClass.name}</p>
                <p className="mt-1 text-sm text-amber-50">LV.{classLevel.level}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold">{(myClass.xp ?? 0).toLocaleString()} XP</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ── 오늘의 퀘스트 ── */}
      <section className="mt-5 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-indigo-500" />
          <h2 className="text-sm font-bold text-neutral-800">오늘의 퀘스트</h2>
          <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">{dailyDone}/{dailyTotal}</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 mb-3">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(dailyDone / dailyTotal) * 100}%` }} />
        </div>
        <div className="flex flex-col gap-2">
          {dailyQuests.map(q => {
            const done = dailyQuestIds.includes(q.id);
            return (
              <div key={q.id} className={`rounded-xl border p-3 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{q.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-800"}`}>{q.title}</p>
                    <p className="text-[11px] text-neutral-400">{q.description}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>+{q.reward}M</span>
                  {done && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 스페셜 미션 ── */}
      {special.length > 0 && (
        <section className="mt-5 px-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500">⭐</span>
            <h2 className="text-sm font-bold text-neutral-800">SPECIAL QUEST</h2>
          </div>
          <div className="flex flex-col gap-2">
            {special.map(m => {
              const done = completedMissionIds.includes(m.id);
              return (
                <div key={m.id} className={`rounded-xl border p-3 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{m.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-800"}`}>{m.title}</p>
                      <p className="text-[11px] text-neutral-400">{m.description}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">+{m.reward}M</span>
                    {done && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 배지 컬렉션 ── */}
      <section className="mt-5 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-amber-500" />
          <h2 className="text-sm font-bold text-neutral-800">배지 컬렉션</h2>
        </div>
        {badgesLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {badges.map((b: any) => <BadgeCard key={b.id} badge={b} />)}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="mt-5 px-5">
          <button onClick={() => setMode("admin")}
            className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-left shadow-sm active:scale-[0.98] transition">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 text-white"><ShieldCheck size={22} /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-800">관리자 페이지</p>
              <p className="text-xs text-indigo-500">학생/출석/미션/마일리지 관리</p>
            </div>
            <ChevronRight size={18} className="text-indigo-400" />
          </button>
        </section>
      )}

      <section className="mt-5 px-5 pb-8">
        <button onClick={() => { logout(); window.location.reload(); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-500 transition active:scale-[0.98] active:bg-red-100">
          <LogOut size={16} />
          로그아웃
        </button>
      </section>
    </div>
  );
}
