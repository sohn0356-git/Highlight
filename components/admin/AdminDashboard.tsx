"use client";
import {
  Users, CalendarCheck, BookOpen, Target, HandHeart, Coins, ArrowUpRight,
  FilePlus2, Megaphone, ChevronRight, TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import { fetchRecentActivities, type RecentActivity } from "@/lib/admin-activity-service";
import { koreaDate } from "@/lib/korea-date";
import type { AdminPageId } from "@/lib/admin-types";

export default function AdminDashboard({ onNavigate }: { onNavigate: (page: AdminPageId) => void }) {
  const { students, teachers, attendanceSessions, attendanceRecords, qtContents, missions, missionCompletions, prayers, allTransactions, season } = useAdmin();
  const { classes } = useApp();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const today = koreaDate();

  useEffect(() => {
    fetchRecentActivities().then(setRecentActivities);
  }, []);

  const todayRecords = attendanceRecords.filter(r => {
    const session = attendanceSessions.find(s => s.id === r.sessionId);
    return session?.date === today;
  });
  const thisWeekQT = qtContents.filter(q => q.active);
  const pendingMissions = missionCompletions.filter(m => m.status === "pending");
  const weekBonus = allTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const activeStudents = students.filter(s => s.active);
  const presentToday = todayRecords.filter(r => r.state === "present" || r.state === "late").length;
  const approvedMissions = missionCompletions.filter(m => m.status === "approved").length;
  const approvedMissionStudents = missionCompletions.filter(m => m.status === "approved").map(m => m.studentId);
  const prayerParticipations = new Set(approvedMissionStudents).size;
  const totalMileageAwarded = allTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

  const quickActions = [
    { label: "출석 직접 입력", icon: CalendarCheck, page: "attendance" as AdminPageId, tone: "bg-emerald-500" },
    { label: "마일리지 지급", icon: Coins, page: "management" as AdminPageId, tone: "bg-amber-500" },
    { label: "QT 등록", icon: FilePlus2, page: "content" as AdminPageId, tone: "bg-rose-500" },
    { label: "미션 생성", icon: Target, page: "content" as AdminPageId, tone: "bg-sky-500" },
    { label: "공지 작성", icon: Megaphone, page: "content" as AdminPageId, tone: "bg-violet-500" },
  ];

  const stats = [
    { label: "재적", value: `${activeStudents.length}명`, icon: <Users size={16} />, tone: "bg-neutral-100 text-neutral-700" },
    { label: "오늘 출석", value: `${presentToday}명`, icon: <CalendarCheck size={16} />, tone: "bg-emerald-50 text-emerald-600" },
    { label: "이번 주 QT", value: `${thisWeekQT.length * 3}회`, icon: <BookOpen size={16} />, tone: "bg-indigo-50 text-indigo-600" },
    { label: "미션 완료", value: `${approvedMissions}회`, icon: <Target size={16} />, tone: "bg-sky-50 text-sky-600" },
    { label: "기도 참여", value: `${prayerParticipations}명`, icon: <HandHeart size={16} />, tone: "bg-rose-50 text-rose-600" },
    { label: "마일리지 지급", value: `${totalMileageAwarded.toLocaleString()}M`, icon: <Coins size={16} />, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Season banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">{season.name}</p>
            <h2 className="mt-1 text-lg font-bold">{season.subtitle}</h2>
            <p className="mt-1 text-xs text-indigo-100">{season.startDate} ~ {season.endDate}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-indigo-100">공동 목표</p>
            <p className="text-base font-bold">{(season.sharedGoalXp / 1000).toFixed(1)}K XP</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-neutral-800">빠른 작업</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate(a.page)}
                className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md active:scale-[0.98]"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.tone} text-white`}>
                  <Icon size={16} />
                </span>
                <span className="text-xs font-semibold text-neutral-700 leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Stats grid */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-neutral-800">주요 통계</h3>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${s.tone}`}>{s.icon}</span>
              </div>
              <p className="mt-3 text-lg font-bold text-neutral-900">{s.value}</p>
              <p className="text-xs text-neutral-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Class overview */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-800">반별 현황</h3>
          <button onClick={() => onNavigate("students")} className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600">
            전체보기 <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => {
            const classStudents = students.filter(s => s.classId === c.id && s.active);
            const teacher = teachers.find(t => t.assignedClassIds?.includes(c.id));
            return (
              <button
                key={c.id}
                onClick={() => onNavigate("students")}
                className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-neutral-800">{c.name}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">LV.{c.level}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">담당: {teacher?.name || "미배정"} · {classStudents.length}명</p>
                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-[11px]">
                  <span className="text-neutral-500">{c.xp.toLocaleString()} XP</span>
                  <span className="font-semibold text-emerald-600">+{c.weeklyXp} 이번 주</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-neutral-800">최근 활동</h3>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
          {recentActivities.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-400">아직 활동 내역이 없어요.</div>
          ) : recentActivities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-base">{a.icon}</span>
              <p className="flex-1 text-sm text-neutral-700">{a.text}</p>
              <span className="text-[11px] text-neutral-400 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending approvals alert */}
      {pendingMissions.length > 0 && (
        <button
          onClick={() => onNavigate("content")}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-white">
            <ArrowUpRight size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">승인 대기 {pendingMissions.length}건</p>
            <p className="text-xs text-amber-600">미션 완료 승인이 필요합니다.</p>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </button>
      )}
    </div>
  );
}
