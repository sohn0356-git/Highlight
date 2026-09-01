"use client";
import { useState } from "react";
import { TrendingUp, Trophy, User } from "lucide-react";
import type { SchoolClass } from "@/lib/types";

type RankTab = "class" | "personal";

export default function ClassRankingCard({ classes, myClassId, students, myStudentId }: {
  classes: SchoolClass[];
  myClassId: string;
  students?: { id: string; name: string; classId: string; mileage: number }[];
  myStudentId?: string;
}) {
  const [tab, setTab] = useState<RankTab>("class");

  const sorted = [...classes].sort((a, b) => b.xp - a.xp);
  const top = sorted[0];

  const sortedStudents = students
    ? [...students].filter(s => s.mileage > 0).sort((a, b) => b.mileage - a.mileage).slice(0, 20)
    : [];
  const topStudent = sortedStudents[0];

  const getRankStyle = (i: number, isMine: boolean) => {
    if (i === 0) return { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400", glow: "ring-1 ring-amber-200 bg-amber-50/50" };
    if (i === 1) return { badge: "bg-neutral-200 text-neutral-600", bar: "bg-neutral-400", glow: "ring-1 ring-neutral-200 bg-neutral-50/50" };
    if (i === 2) return { badge: "bg-orange-100 text-orange-700", bar: "bg-gradient-to-r from-orange-400 to-amber-400", glow: "ring-1 ring-orange-200 bg-orange-50/50" };
    return { badge: "bg-neutral-200/70 text-neutral-500", bar: isMine ? "bg-indigo-500" : "bg-neutral-300", glow: "" };
  };

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return null;
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="text-base font-bold text-neutral-900">랭킹</h2>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1 rounded-xl bg-neutral-100 p-0.5">
        <button
          onClick={() => setTab("class")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
            tab === "class" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
          }`}
        >
          🏫 클래스
        </button>
        <button
          onClick={() => setTab("personal")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
            tab === "personal" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
          }`}
        >
          👤 개인
        </button>
      </div>

      {tab === "class" ? (
        <>
          <div className="mt-4 flex flex-col gap-2.5">
            {sorted.map((c, i) => {
              const isMine = c.id === myClassId;
              const pct = top.xp > 0 ? (c.xp / top.xp) * 100 : 0;
              const medal = getMedal(i);
              const rs = getRankStyle(i, isMine);
              return (
                <div key={c.id} className={`rounded-xl px-3.5 py-2.5 ${isMine ? "bg-indigo-50 ring-1 ring-indigo-200" : rs.glow || "bg-neutral-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${rs.badge}`}>
                        {medal ? <span className="text-xs">{medal}</span> : i + 1}
                      </span>
                      <span className={`text-sm font-medium ${isMine ? "text-indigo-700" : "text-neutral-800"}`}>
                        {c.name} {isMine && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">나</span>}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isMine ? "text-indigo-700" : "text-neutral-700"}`}>{c.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div className={`h-full rounded-full ${rs.bar}`} style={{ width: `${pct}%` }} />
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
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2.5">
            {sortedStudents.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-400">아직 활동 내역이 없어요.</p>
            )}
            {sortedStudents.map((s, i) => {
              const isMine = s.id === myStudentId;
              const pct = topStudent && topStudent.mileage > 0 ? (s.mileage / topStudent.mileage) * 100 : 0;
              const medal = getMedal(i);
              const rs = getRankStyle(i, isMine);

              return (
                <div key={s.id} className={`rounded-xl px-3.5 py-2.5 ${isMine ? "bg-indigo-50 ring-1 ring-indigo-200" : rs.glow || "bg-neutral-50"} ${i === 2 ? "shadow-sm" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${rs.badge}`}>
                        {medal ? <span className="text-xs">{medal}</span> : i + 1}
                      </span>
                      <span className={`text-sm font-medium ${isMine ? "text-indigo-700" : "text-neutral-800"}`}>
                        {s.name} {isMine && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">나</span>}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isMine ? "text-indigo-700" : "text-neutral-700"}`}>{s.mileage.toLocaleString()}M</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div className={`h-full rounded-full ${rs.bar}`} style={{ width: `${pct}%` }} />
                  </div>

                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3.5 py-3">
            <User size={16} className="text-purple-500" />
            <p className="text-sm text-purple-700">
              <span className="font-bold">💎 마일리지 랭킹</span>{" "}
              총 {sortedStudents.length}명 활동 중
            </p>
          </div>
        </>
      )}
    </div>
  );
}
