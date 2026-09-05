"use client";
import { useState } from "react";
import { Trophy } from "lucide-react";
import type { SchoolClass } from "@/lib/types";

type RankTab = "grade" | "personal";

interface RankRow {
  key: string;
  name: string;
  value: number;
  isMine: boolean;
}

function getGradeFromClass(classId: string): number {
  if (classId.includes("_g1_")) return 1;
  if (classId.includes("_g2_")) return 2;
  if (classId.includes("_g3_")) return 3;
  return 1;
}

const GRADE_NAMES: Record<number, string> = { 1: "고1", 2: "고2", 3: "고3" };

export default function ClassRankingCard({ classes, myClassId, students, myStudentId }: {
  classes: SchoolClass[];
  myClassId: string;
  students?: { id: string; name: string; classId: string; grade?: number; mileage: number; xp?: number }[];
  myStudentId?: string;
}) {
  const [tab, setTab] = useState<RankTab>("grade");

  /* ── 학년별 마일리지 집계 (학생 DB 기준) ── */
  const gradeTotals = new Map<number, number>();
  const gradeSet = new Map<number, string>();
  (classes || []).forEach((c: any) => {
    const g = getGradeFromClass(String(c.id || ""));
    if (!gradeSet.has(g)) gradeSet.set(g, GRADE_NAMES[g] || `고${g}`);
    if (!gradeTotals.has(g)) gradeTotals.set(g, 0);
  });
  const myGrade = students?.find(s => s.id === myStudentId)?.grade || (myClassId ? getGradeFromClass(myClassId) : 0);
  if (myGrade && !gradeSet.has(myGrade)) gradeSet.set(myGrade, GRADE_NAMES[myGrade] || `고${myGrade}`);

  (students || []).forEach((s: any) => {
    const g = s.grade || getGradeFromClass(String(s.classId || ""));
    if (!gradeSet.has(g)) gradeSet.set(g, GRADE_NAMES[g] || `고${g}`);
    gradeTotals.set(g, (gradeTotals.get(g) || 0) + (Number(s.mileage) || 0));
  });

  const gradeRows: RankRow[] = [...gradeSet.entries()]
    .map(([grade, name]) => ({
      key: `g${grade}`,
      name,
      value: gradeTotals.get(grade) || 0,
      isMine: grade === myGrade,
    }))
    .sort((a, b) => b.value - a.value || Number(a.name.replace(/\D/g, "")) - Number(b.name.replace(/\D/g, "")));
  const topGrade = gradeRows[0];

  /* ── 개인별 마일리지 랭킹 (최대 10위) ── */
  const personalRows: RankRow[] = (students || [])
    .map((s: any) => ({
      key: s.id,
      name: s.name || "이름없음",
      value: Number(s.mileage) || 0,
      isMine: s.id === myStudentId,
    }))
    .filter(r => r.name !== "이름없음")
    .sort((a, b) => b.value - a.value || (a.isMine ? -1 : b.isMine ? 1 : 0))
    .slice(0, 10);
  const topStudent = personalRows[0];

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

  const renderRows = (rows: RankRow[], top: RankRow | undefined, valueSuffix: string) => (
    <div className="mt-4 flex flex-col gap-2.5">
      {rows.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-400">아직 활동 내역이 없어요.</p>
      )}
      {rows.map((row, i) => {
        const rs = getRankStyle(i, row.isMine);
        const medal = getMedal(i);
        const pct = top && top.value > 0 ? (row.value / top.value) * 100 : 0;
        return (
          <div key={row.key} className={`rounded-xl px-3.5 py-2.5 ${row.isMine ? "bg-indigo-50 ring-1 ring-indigo-200" : rs.glow || "bg-neutral-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${rs.badge}`}>
                  {medal ? <span className="text-xs">{medal}</span> : i + 1}
                </span>
                <span className={`text-sm font-medium ${row.isMine ? "text-indigo-700" : "text-neutral-800"}`}>
                  {row.name} {row.isMine && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">나</span>}
                </span>
              </div>
              <span className={`text-sm font-bold ${row.isMine ? "text-indigo-700" : "text-neutral-700"}`}>
                {row.value.toLocaleString()} {valueSuffix}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
              <div className={`h-full rounded-full ${rs.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="text-base font-bold text-neutral-900">랭킹</h2>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1 rounded-xl bg-neutral-100 p-0.5">
        <button
          onClick={() => setTab("grade")}
          aria-pressed={tab === "grade"}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
            tab === "grade" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
          }`}
        >
          🏫 학년
        </button>
        <button
          onClick={() => setTab("personal")}
          aria-pressed={tab === "personal"}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
            tab === "personal" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
          }`}
        >
          👤 개인
        </button>
      </div>

      {tab === "grade" ? (
        <>
          {renderRows(gradeRows, topGrade, "M")}
          {topGrade && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3.5 py-3">
              <p className="text-sm text-orange-700">
                <span className="font-bold">🔥 현재 1위 학년</span>{" "}
                {topGrade.name} ({topGrade.value.toLocaleString()} M)
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-[10px] text-neutral-400">개인 마일리지 기준 TOP 10</p>
          {renderRows(personalRows, topStudent, "M")}
          {topStudent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3.5 py-3">
              <p className="text-sm text-orange-700">
                <span className="font-bold">🏆 개인 1위</span>{" "}
                {topStudent.name} ({topStudent.value.toLocaleString()} M)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
