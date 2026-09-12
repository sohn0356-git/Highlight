"use client";
import { useState, useMemo, useCallback } from "react";
import { CalendarDays, History, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import { koreaDate, getWeekNumber, sundayFromWeek, fmt, addDays as kAddDays } from "@/lib/korea-date";
import type { AttendanceState } from "@/lib/admin-types";

function stateLabel(s: AttendanceState) {
  return { present: "출석", late: "지각", online: "온라인", absent: "결석" }[s];
}
function stateColor(s: AttendanceState) {
  return {
    present: "bg-emerald-50 text-emerald-600 border-emerald-200",
    late: "bg-amber-50 text-amber-600 border-amber-200",
    online: "bg-blue-50 text-blue-600 border-blue-200",
    absent: "bg-rose-50 text-rose-600 border-rose-200",
  }[s];
}

/** Month/Year helper: approximate month from year+week */
function monthOfWeek(year: number, week: number): number {
  // Get the Sunday of this week, check its month
  const sunday = sundayFromWeek(year, week);
  return sunday.getMonth() + 1;
}

export default function AdminAttendance() {
  const { attendanceRecords, students, markStudentAttendance, confirmAttendanceRewards } = useAdmin();
  const { classes } = useApp();

  const [view, setView] = useState<"check" | "history">("check");
  const [historyMode, setHistoryMode] = useState<"month" | "year">("month");

  const today = koreaDate();
  const currentYear = new Date(today + "T00:00:00").getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekNumber(today));
  const [selectedClass, setSelectedClass] = useState("all");

  const sundayDate = useMemo(() => sundayFromWeek(selectedYear, selectedWeek), [selectedYear, selectedWeek]);
  const sundayStr = fmt(sundayDate);
  const weekRangeStart = kAddDays(sundayStr, -6);

  const filteredStudents = useMemo(() => {
    let list = students.filter(s => s.active);
    if (selectedClass !== "all") list = list.filter(s => s.classId === selectedClass);
    return list;
  }, [students, selectedClass]);

  const getRecord = useCallback((studentId: string) => {
    return attendanceRecords.find(r => r.studentId === studentId && r.year === selectedYear && r.week === selectedWeek) || null;
  }, [attendanceRecords, selectedYear, selectedWeek]);

  const attendedCount = useMemo(() => {
    return attendanceRecords.filter(r => r.year === selectedYear && r.week === selectedWeek && (r.state === "present" || r.state === "late" || r.state === "online")).length;
  }, [attendanceRecords, selectedYear, selectedWeek]);

  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");

  const handleConfirmAttendance = async () => {
    if (!attendedCount) {
      setConfirmMsg("이번 주 출석 기록이 없어요.");
      setTimeout(() => setConfirmMsg(""), 2500);
      return;
    }
    if (!confirm(`${attendedCount}명에게 20D씩 지급하시겠습니까?`)) return;
    setConfirming(true);
    setConfirmMsg("");
    const result = await confirmAttendanceRewards(selectedYear, selectedWeek);
    setConfirming(false);
    setConfirmMsg(result.awarded > 0 ? `${result.awarded}명에게 20D 지급 완료` : "이미 지급된 출석 기록이에요.");
    setTimeout(() => setConfirmMsg(""), 3000);
  };

  /* ── History ── */
  const [historyYear, setHistoryYear] = useState(currentYear);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);

  const historyRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      if (historyMode === "month") {
        return r.year === historyYear && monthOfWeek(r.year, r.week) === historyMonth;
      }
      return r.year === historyYear;
    });
  }, [attendanceRecords, historyMode, historyYear, historyMonth]);

  const historySummary = useMemo(() => ({
    present: historyRecords.filter(r => r.state === "present").length,
    late: historyRecords.filter(r => r.state === "late").length,
    online: historyRecords.filter(r => r.state === "online").length,
    absent: historyRecords.filter(r => r.state === "absent").length,
  }), [historyRecords]);

  const getStudentHistoryCount = useCallback((studentId: string, year: number, month?: number): number => {
    return attendanceRecords.filter(r => {
      if (r.studentId !== studentId) return false;
      if (r.state !== "present" && r.state !== "late" && r.state !== "online") return false;
      if (r.year !== year) return false;
      if (month !== undefined && monthOfWeek(r.year, r.week) !== month) return false;
      return true;
    }).length;
  }, [attendanceRecords]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        <button onClick={() => setView("check")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${view === "check" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
          <CalendarDays size={14} /> 주일 출석
        </button>
        <button onClick={() => setView("history")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${view === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
          <History size={14} /> 출석 기록
        </button>
      </div>

      {/* ═══ CHECK VIEW ═══ */}
      {view === "check" && (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <button onClick={() => { setSelectedWeek(w => w <= 1 ? w : w - 1); }} className="rounded-lg p-2 hover:bg-neutral-100 transition">
              <ChevronLeft size={18} className="text-neutral-500" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-neutral-800">{selectedYear}년 {selectedWeek}주차</p>
              <p className="text-[11px] text-neutral-400">{kAddDays(sundayStr, -6)} ~ {sundayStr}</p>
            </div>
            <button onClick={() => { setSelectedWeek(w => w >= 53 ? w : w + 1); }} className="rounded-lg p-2 hover:bg-neutral-100 transition">
              <ChevronRight size={18} className="text-neutral-500" />
            </button>
          </div>

          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm">
            <option value="all">전체 반</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-neutral-500">
              {filteredStudents.length}명 · {filteredStudents.filter(s => { const r = getRecord(s.id); return r?.state === "present" || r?.state === "late" || r?.state === "online"; }).length}명 출석
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                <User size={24} />
                <p className="text-xs">등록된 학생이 없습니다.</p>
              </div>
            )}
            {filteredStudents.map(stu => {
              const record = getRecord(stu.id);
              const stuClass = classes.find((c: any) => c.id === stu.classId);
              return (
                <div key={stu.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                    {stu.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-700 truncate">{stu.name}</p>
                    <p className="text-[10px] text-neutral-400">{stuClass?.name || ""}</p>
                  </div>
                  <div className="flex gap-1">
                    {(["present", "late", "online", "absent"] as AttendanceState[]).map(s => (
                      <button key={s} onClick={() => markStudentAttendance(stu.id, selectedYear, selectedWeek, s)}
                        className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition border ${
                          record?.state === s ? stateColor(s) : "border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50"
                        }`}>
                        {stateLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirmAttendance}
              disabled={confirming}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition"
            >
              {confirming ? "지급 중..." : `출석 확정 · ${attendedCount}명에게 20D 지급`}
            </button>
            {confirmMsg && (
              <p className="text-center text-xs font-semibold text-emerald-600">{confirmMsg}</p>
            )}
          </div>
        </>
      )}

      {/* ═══ HISTORY VIEW ═══ */}
      {view === "history" && (
        <>
          <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
            {[{ id: "month" as const, label: "월별" }, { id: "year" as const, label: "연별" }].map(t => (
              <button key={t.id} onClick={() => setHistoryMode(t.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${historyMode === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <button
              onClick={() => {
                if (historyMode === "month") {
                  setHistoryMonth(m => { if (m <= 1) { setHistoryYear(y => y - 1); return 12; } return m - 1; });
                } else {
                  setHistoryYear(y => y - 1);
                }
              }}
              className="rounded-lg p-2 hover:bg-neutral-100" aria-label="이전"
            >
              <ChevronLeft size={16} className="text-neutral-500" />
            </button>
            <p className="text-sm font-bold text-neutral-700">
              {historyMode === "month" ? `${historyYear}년 ${historyMonth}월` : `${historyYear}년`}
            </p>
            <button
              onClick={() => {
                if (historyMode === "month") {
                  setHistoryMonth(m => { if (m >= 12) { setHistoryYear(y => y + 1); return 1; } return m + 1; });
                } else {
                  setHistoryYear(y => y + 1);
                }
              }}
              className="rounded-lg p-2 hover:bg-neutral-100" aria-label="다음"
            >
              <ChevronRight size={16} className="text-neutral-500" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{historySummary.present}</p>
              <p className="text-[10px] font-semibold text-emerald-500">출석</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{historySummary.late}</p>
              <p className="text-[10px] font-semibold text-amber-500">지각</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{historySummary.online}</p>
              <p className="text-[10px] font-semibold text-blue-500">온라인</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <p className="text-lg font-bold text-rose-600">{historySummary.absent}</p>
              <p className="text-[10px] font-semibold text-rose-500">결석</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
              <p className="text-xs font-bold text-neutral-500">
                {historyMode === "month" ? `${historyYear}년 ${historyMonth}월` : `${historyYear}년`}
              </p>
            </div>
            <div className="divide-y divide-neutral-100">
              {filteredStudents.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                  <User size={24} />
                  <p className="text-xs">등록된 학생이 없습니다.</p>
                </div>
              )}
              {filteredStudents.map(stu => {
                const count = getStudentHistoryCount(stu.id, historyYear, historyMode === "month" ? historyMonth : undefined);
                const stuClass = classes.find((c: any) => c.id === stu.classId);
                return (
                  <div key={stu.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                      {stu.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-700 truncate">{stu.name}</p>
                      <p className="text-[10px] text-neutral-400">{stuClass?.name || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-700">{count}회</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
