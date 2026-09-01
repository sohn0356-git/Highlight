"use client";
import { ChevronRight, ShieldCheck, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StatCard from "@/components/StatCard";
import { useApp, useViewMode } from "@/lib/store-context";

export default function MyContent() {
  const { student, isLoggedIn, classes } = useApp();
  const { setMode } = useViewMode();
  if (!student || !isLoggedIn) return null;

  const isAdmin = student.role === "teacher" || student.role === "admin" || student.isTeacher;
  const myClass = classes.find((c: any) => c.id === student.classId) as any;
  const nextLevelXp = 15000;

  if (!myClass) {
    return (
      <div>
        <div className="px-5 pt-7">
          <PageHeader title="우리 반" showBack subtitle="서로를 위해, 함께 걸어요" right={<Users size={18} className="text-indigo-400" />} />
        </div>
        <section className="mt-10 px-5">
          <Card className="text-center">
            <p className="py-8 text-sm text-neutral-400">반 정보를 불러오는 중...</p>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="우리 반" showBack subtitle="서로를 위해, 함께 걸어요" right={<Users size={18} className="text-indigo-400" />} />
      </div>

      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-amber-400 to-orange-400 border-0 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold">{myClass.name}</p>
              <p className="mt-1 text-sm text-amber-50">LV.{myClass.level}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold">{myClass.xp?.toLocaleString()} XP</p>
              <p className="text-xs text-amber-50">다음 레벨까지</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={myClass.xp} max={nextLevelXp} className="bg-white/30" barClassName="bg-white" />
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="출석" value={`${myClass.attendance?.attended} / ${myClass.attendance?.total}`} tone="emerald" icon={<span>⛪</span>} />
          <StatCard label="QT" value={`${myClass.qtCount}회`} tone="indigo" icon={<span>📖</span>} />
          <StatCard label="미션" value={`${myClass.missionCount}회`} tone="amber" icon={<span>🎯</span>} />
          <StatCard label="기도" value={`${myClass.prayerCount}회`} tone="rose" icon={<span>🙏</span>} />
        </div>
      </section>

      <section className="mt-5 px-5">
        <Card className="bg-indigo-50/60 border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-800">반 선생님 메시지</h3>
          <p className="mt-1.5 text-sm text-indigo-700">{myClass.classMessage}</p>
        </Card>
      </section>

      {isAdmin && (
        <section className="mt-5 px-5">
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
    </div>
  );
}
