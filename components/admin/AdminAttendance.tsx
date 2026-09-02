"use client";
import { useState, useMemo, useEffect } from "react";
import { CalendarDays, History, ChevronLeft, ChevronRight, User, Users } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
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

function getSunday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  if (day !== 0) r.setDate(r.getDate() + (7 - day));
  return r;
}
function toStr(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addWeeks(d: Date, n: number): Date { return addDays(d, n * 7); }

function getWeekNumber(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
  const jan1Day = jan1.getDay();
  return Math.ceil((dayOfYear + jan1Day + 1) / 7);
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sm = s.getMonth() + 1, sd = s.getDate();
  const em = e.getMonth() + 1, ed = e.getDate();
  if (sm === em) return `${sm}월 ${sd}일~${ed}일`;
  return `${sm}월 ${sd}일 ~ ${em}월 ${ed}일`;
}

export default function AdminAttendance() {
  const { attendanceSessions, attendanceRecords, addAttendanceSession, students, markStudentAttendance } = useAdmin();
  const { classes } = useApp();

  const [view, setView] = useState<"check" | "history">("check");
  const [historyMode, setHistoryMode] = useState<"month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState(() => toStr(getSunday(new Date())));
  const [selectedClass, setSelectedClass] = useState("all");

  const thisYear = new Date().getFullYear();
  const selectedMonth = new Date(selectedDate).getMonth() + 1;

  const anchorSunday = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    if (day !== 0) d.setDate(d.getDate() + (7 - day));
    return d;
  }, [selectedDate]);

  const weekNumber = getWeekNumber(anchorSunday);
  const anchorMonday = addDays(anchorSunday, -6);
  const weekRangeStart = toStr(anchorMonday);
  const weekRangeEnd = toStr(anchorSunday);

  // Find or create session for this Sunday
  const thisWeekSession = useMemo(() => {
    return attendanceSessions.find(s => {
      const sd = new Date(s.date);
      return toStr(getSunday(sd)) === toStr(anchorSunday);
    });
  }, [attendanceSessions, anchorSunday]);

  const activeSession = attendanceSessions.find(s => s.active);

  // Students filtered by class
  const filteredStudents = useMemo(() => {
    let list = students.filter(s => s.active);
    if (selectedClass !== "all") list = list.filter(s => s.classId === selectedClass);
    return list;
  }, [students, selectedClass]);

  // Get attendance record for a student on the selected Sunday
  const getRecord = (studentId: string) => {
    if (!thisWeekSession) return null;
    return attendanceRecords.find(r => r.studentId === studentId && r.sessionId === thisWeekSession.id) || null;
  };

  // History: per-student attendance count
  const getStudentCount = (studentId: string, year?: number, month?: number): number => {
    return attendanceRecords.filter(r => {
      if (r.studentId !== studentId) return false;
      if (r.state !== "present" && r.state !== "late" && r.state !== "online") return false;
      const session = attendanceSessions.find(s => s.id === r.sessionId);
      if (!session) return false;
      const d = new Date(session.date);
      if (year && d.getFullYear() !== year) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      return true;
    }).length;
  };

  // History summary counts
  const historyRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      const session = attendanceSessions.find(s => s.id === r.sessionId);
      if (!session) return false;
      const d = new Date(session.date);
      if (historyMode === "month") {
        return d.getFullYear() === thisYear && d.getMonth() + 1 === selectedMonth;
      }
      return d.getFullYear() === thisYear;
    });
  }, [attendanceRecords, attendanceSessions, historyMode, thisYear, selectedMonth]);

  const historySummary = useMemo(() => {
    const present = historyRecords.filter(r => r.state === "present").length;
    const late = historyRecords.filter(r => r.state === "late").length;
    const online = historyRecords.filter(r => r.state === "online").length;
    const absent = historyRecords.filter(r => r.state === "absent").length;
    return { present, late, online, absent };
  }, [historyRecords]);

  function handleCreateSession() {
    const id = "as_" + Date.now();
    addAttendanceSession({
      id,
      eventName: "주일예배",
      date: toStr(anchorSunday),
      startTime: "10:00",
      endTime: "12:00",
      mileageReward: 20,
      xpReward: 0,
      active: false,
    });
  }

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        {[
          { id: "check" as const, label: "주일 출석", icon: <CalendarDays size={14} /> },
          { id: "history" as const, label: "출석 기록", icon: <History size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition ${view === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Week navigator - common to both views */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate(toStr(addWeeks(anchorSunday, -1)))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-neutral-700">{anchorSunday.getFullYear()}년 {weekNumber}번째 주</p>
            <p className="text-[11px] text-neutral-400">{formatDateRange(weekRangeStart, weekRangeEnd)}</p>
          </div>
          <button onClick={() => setSelectedDate(toStr(addWeeks(anchorSunday, 1)))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
            <ChevronRight size={16} />
          </button>
        </div>
        {weekNumber !== getWeekNumber(new Date()) && (
          <button onClick={() => setSelectedDate(toStr(getSunday(new Date())))}
            className="mt-2 w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 active:bg-indigo-100">
            이번 주로 이동
          </button>
        )}
      </div>

      {/* Class filter */}
      <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
        value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
        <option value="all">전체 반 ({students.filter(s => s.active).length}명)</option>
        {classes.map((c: any) => {
          const count = students.filter(s => s.active && s.classId === c.id).length;
          return <option key={c.id} value={c.id}>{c.name} ({count}명)</option>;
        })}
      </select>

      {/* ═══ CHECK VIEW ═══ */}
      {view === "check" && (
        <>
          {/* Create session if none exists for this week */}
          {!thisWeekSession && (
            <button onClick={handleCreateSession}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3.5 text-sm font-bold text-indigo-600 active:bg-indigo-100">
              이 주일 출석 세션 만들기
            </button>
          )}

          {/* Quick actions */}
          {thisWeekSession && (
            <div className="flex gap-2">
              <button onClick={() => filteredStudents.forEach(s => markStudentAttendance(s.id, thisWeekSession!.id, "present"))}
                className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-600 active:bg-emerald-100">
                전체 출석
              </button>
              <button onClick={() => filteredStudents.forEach(s => markStudentAttendance(s.id, thisWeekSession!.id, "online"))}
                className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-600 active:bg-blue-100">
                전체 온라인
              </button>
              <button onClick={() => filteredStudents.forEach(s => markStudentAttendance(s.id, thisWeekSession!.id, "absent"))}
                className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-600 active:bg-rose-100">
                전체 결석
              </button>
            </div>
          )}

          {/* Student list with attendance buttons */}
          <div className="space-y-1.5">
            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                <Users size={24} />
                <p className="text-xs">등록된 학생이 없습니다.</p>
              </div>
            )}
            {filteredStudents.map(stu => {
              const record = getRecord(stu.id);
              const stuClass = classes.find((c: any) => c.id === stu.classId);
              return (
                <div key={stu.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                    {stu.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-700 truncate">{stu.name}</p>
                    <p className="text-[10px] text-neutral-400">{stuClass?.name || ""}</p>
                  </div>
                  {thisWeekSession ? (
                    <div className="flex gap-1">
                      {(["present", "late", "online", "absent"] as AttendanceState[]).map(s => (
                        <button key={s} onClick={() => markStudentAttendance(stu.id, thisWeekSession!.id, s)}
                          className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition border ${
                            record?.state === s ? stateColor(s) : "border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50"
                          }`}>
                          {stateLabel(s)}
                        </button>
                      ))}
                    </div>
                  ) : record ? (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${stateColor(record.state)}`}>
                      {stateLabel(record.state)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ HISTORY VIEW ═══ */}
      {view === "history" && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
            {[{ id: "month" as const, label: "월별" }, { id: "year" as const, label: "연별" }].map(t => (
              <button key={t.id} onClick={() => setHistoryMode(t.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${historyMode === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Summary */}
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

          {/* Per-student attendance table */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
              <p className="text-xs font-bold text-neutral-500">
                학생별 출석 현황 ({historyMode === "month" ? `${selectedMonth}월` : `${thisYear}년`})
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
                const count = getStudentCount(stu.id, thisYear, historyMode === "month" ? selectedMonth : undefined);
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
