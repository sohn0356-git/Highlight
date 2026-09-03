"use client";
import { ChevronRight, ShieldCheck, Users, LogOut } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StatCard from "@/components/StatCard";
import { useApp, useViewMode } from "@/lib/store-context";
import { getStudentLevel, getClassLevel, getNextLevelXp } from "@/lib/db";

export default function MyContent() {
  const { student, isLoggedIn, classes, logout } = useApp();
  const { setMode } = useViewMode();
  if (!student || !isLoggedIn) return null;

  const isAdmin = student.role === "teacher" || student.role === "admin" || student.isTeacher;
  const myClass = classes.find((c: any) => c.id === student.classId) as any;

  const studentLevel = getStudentLevel(student.xp || 0);
  const studentNextXp = getNextLevelXp(studentLevel.level, false);
  const classLevel = getClassLevel(myClass?.xp || 0);
  const classNextXp = getNextLevelXp(classLevel.level, true);

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="우리 반" showBack subtitle="서로를 위해, 함께 걸어요" right={<Users size={18} className="text-indigo-400" />} />
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
                <p className="text-xs text-amber-50">다음 레벨까지</p>
              </div>
            </div>
            {classNextXp < Infinity && (
              <div className="mt-4">
                <ProgressBar value={myClass.xp ?? 0} max={classNextXp} className="bg-white/30" barClassName="bg-white" />
                <p className="mt-1 text-[10px] text-amber-100 text-right">{classNextXp - (myClass.xp || 0)} XP 남음</p>
              </div>
            )}
          </Card>
        </section>
      )}

      {myClass && (
        <section className="mt-5 px-5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="출석" value={`${myClass.attendance?.attended ?? 0} / ${myClass.attendance?.total ?? 0}`} tone="emerald" icon={<span>⛪</span>} />
            <StatCard label="QT" value={`${myClass.qtCount ?? 0}회`} tone="indigo" icon={<span>📖</span>} />
            <StatCard label="미션" value={`${myClass.missionCount ?? 0}회`} tone="amber" icon={<span>🎯</span>} />
            <StatCard label="기도" value={`${myClass.prayerCount ?? 0}회`} tone="rose" icon={<span>🙏</span>} />
          </div>
        </section>
      )}

      {myClass?.classMessage && (
        <section className="mt-5 px-5">
          <Card className="bg-indigo-50/60 border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800">반 선생님 메시지</h3>
            <p className="mt-1.5 text-sm text-indigo-700">{myClass.classMessage}</p>
          </Card>
        </section>
      )}

      <section className="mt-5 px-5">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm">👤</span>
          <div>
            <p className="text-sm font-bold text-neutral-800">{student.name}</p>
            <p className="text-[11px] text-neutral-400">{myClass?.name || student.classId}</p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="mt-4 px-5">
          <button onClick={() => setMode("admin")} className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-left shadow-sm active:scale-[0.98] transition">
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
        <button
          onClick={() => { logout(); window.location.reload(); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-500 transition active:scale-[0.98] active:bg-red-100"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </section>
    </div>
  );
}
