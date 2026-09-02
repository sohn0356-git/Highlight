"use client";
import { useState, useMemo } from "react";
import { Plus, CalendarDays, History, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, User, Users } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import type { AttendanceRecordAdmin, AttendanceState } from "@/lib/admin-types";

function stateLabel(s: AttendanceState) {
  return { present: "출석", late: "지각", absent: "결석", excused: "공결" }[s];
}
function stateColor(s: AttendanceState) {
  return {
    present: "bg-emerald-50 text-emerald-600 border-emerald-200",
    late: "bg-amber-50 text-amber-600 border-amber-200",
    absent: "bg-rose-50 text-rose-600 border-rose-200",
    excused: "bg-blue-50 text-blue-600 border-blue-200",
  }[s];
}
function stateBg(s: AttendanceState) {
  return {
    present: "bg-emerald-100",
    late: "bg-amber-100",
    absent: "bg-rose-100",
    excused: "bg-blue-100",
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
function addMonths(d: Date, n: number): Date { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }

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
  const { attendanceSessions, attendanceRecords, addAttendanceSession, closeAttendanceSession, students, markStudentAttendance, currentUser } = useAdmin();
  const { classes } = useApp();

  const [view, setView] = useState<"check" | "history">("check");
  const [historyMode, setHistoryMode] = useState<"month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState(() => toStr(getSunday(new Date())));
  const [selectedClass, setSelectedClass] = useState("all");
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const todayStr = toStr(new Date());
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth() + 1;

  // Select a Sunday as the anchor date
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
  const selectedMonth = anchorSunday.getMonth() + 1;

  const activeSession = attendanceSessions.find(s => s.active);
  const thisWeekSession = attendanceSessions.find(s => {
    const sd = new Date(s.date);
    const su = getSunday(sd);
    return toStr(su) === toStr(anchorSunday);
  });

  // Students filtered by class
  const filteredStudents = useMemo(() => {
    let list = students.filter(s => s.active);
    if (selectedClass !== "all") list = list.filter(s => s.classId === selectedClass);
    return list;
  }, [students, selectedClass]);

  // History sessions based on mode
  const filteredSessions = useMemo(() => {
    if (historyMode === "month") {
      return attendanceSessions.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === thisYear && d.getMonth() + 1 === selectedMonth;
      }).sort((a, b) => b.date.localeCompare(a.date));
    } else {
      return attendanceSessions.filter(s => {
        return new Date(s.date).getFullYear() === thisYear;
      }).sort((a, b) => b.date.localeCompare(a.date));
    }
  }, [attendanceSessions, historyMode, selectedMonth, thisYear]);

  // Attendance records for filtered sessions
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(r => filteredSessions.some(s => s.id === r.sessionId));
  }, [attendanceRecords, filteredSessions]);

  // Per-student attendance count
  const getStudentCount = (studentId: string, year?: number, month?: number): number => {
    return attendanceRecords.filter(r => {
      if (r.studentId !== studentId) return false;
      if (r.state !== "present" && r.state !== "late") return false;
      const session = attendanceSessions.find(s => s.id === r.sessionId);
      if (!session) return false;
      const d = new Date(session.date);
      if (year && d.getFullYear() !== year) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      return true;
    }).length;
  };

  // Total sessions in this month / year
  const totalSessionsThisMonth = attendanceSessions.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === thisYear && d.getMonth() + 1 === selectedMonth;
  }).length;
  const totalSessionsThisYear = attendanceSessions.filter(s => {
    return new Date(s.date).getFullYear() === thisYear;
  }).length;

  function createSession() {
    const id = "as_" + Date.now();
    addAttendanceSession({ id, eventName: "주일예배", date: toStr(anchorSunday), startTime: "10:00", endTime: "12:00", mileageReward: 20, xpReward: 0, active: true });
    setShowNewSession(false);
  }

  function toggleSelect(id: string) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function quickMarkAll(state: AttendanceState) {
    if (!activeSession) return;
    filteredStudents.forEach(s => markStudentAttendance(s.id, activeSession.id, state));
    setSelectedStudents([]);
  }

  function handleRecordState(recordId: string, newState: AttendanceState) {
    const record = attendanceRecords.find(r => r.id === recordId);
    if (record) markStudentAttendance(record.studentId, record.sessionId, newState);
    setEditingRecordId(null);
  }

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        {[
          { id: "check" as const, label: "주일 출석", icon: <CalendarDays size={14} /> },
          { id: "history" as const, label: "출석 기록", icon: <History size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition ${
              view === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ═══ CHECK VIEW ═══ */}
      {view === "check" && (
        <>
          {/* Week navigator */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => { const p = addWeeks(anchorSunday, -1); setSelectedDate(toStr(p)); }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-neutral-700">{thisYear}년 {weekNumber}번째 주</p>
                <p className="text-[11px] text-neutral-400">{formatDateRange(weekRangeStart, weekRangeEnd)}</p>
              </div>
              <button onClick={() => { const n = addWeeks(anchorSunday, 1); setSelectedDate(toStr(n)); }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
                <ChevronRight size={16} />
              </button>
            </div>
            {weekNumber !== getWeekNumber(new Date()) && (
              <button
                onClick={() => setSelectedDate(toStr(getSunday(new Date())))}
                className="mt-2 w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 active:bg-indigo-100"
              >
                이번 주로 이동
              </button>
            )}
          </div>

          {/* Active session info or create button */}
          {activeSession && toStr(getSunday(new Date(activeSession.date))) === toStr(anchorSunday) ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-700">✓ {activeSession.eventName} 진행 중</p>
                  <p className="text-[11px] text-emerald-500">{activeSession.date} · {activeSession.startTime}~{activeSession.endTime}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-600">출석 중</span>
              </div>
            </div>
          ) : thisWeekSession ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-700">{thisWeekSession.eventName}</p>
                  <p className="text-[11px] text-neutral-400">{thisWeekSession.date} · 완료됨</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-500">완료</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSession(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3.5 text-sm font-bold text-indigo-600 active:bg-indigo-100"
            >
              <Plus size={16} /> 이번 주일 출석 시작
            </button>
          )}

          {showNewSession && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <p className="text-sm font-bold text-indigo-700">새 출석 세션</p>
              <p className="text-xs text-indigo-500">{toStr(anchorSunday)} 주일예배</p>
              <div className="flex gap-2">
                <button onClick={createSession} className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white active:bg-indigo-700">시작</button>
                <button onClick={() => setShowNewSession(false)} className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-xs font-bold text-neutral-500 active:bg-neutral-50">취소</button>
              </div>
            </div>
          )}

          {/* Class filter */}
          <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="all">전체 반 ({students.filter(s => s.active).length}명)</option>
            {classes.map((c: any) => {
              const count = students.filter(s => s.active && s.classId === c.id).length;
              return <option key={c.id} value={c.id}>{c.name} ({count}명)</option>;
            })}
          </select>

          {/* Quick actions */}
          {activeSession && (
            <div className="flex gap-2">
              <button onClick={() => { filteredStudents.forEach(s => markStudentAttendance(s.id, activeSession.id, "present")); setSelectedStudents([]); }}
                className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-600 active:bg-emerald-100">
                전체 출석
              </button>
              <button onClick={() => { filteredStudents.forEach(s => markStudentAttendance(s.id, activeSession.id, "absent")); setSelectedStudents([]); }}
                className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-600 active:bg-rose-100">
                전체 결석
              </button>
            </div>
          )}

          {/* Student list for attendance */}
          <div className="space-y-1.5">
            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                <Users size={24} />
                <p className="text-xs">등록된 학생이 없습니다.</p>
              </div>
            )}
            {filteredStudents.map(stu => {
              const record = activeSession ? attendanceRecords.find(r => r.sessionId === activeSession.id && r.studentId === stu.id) : null;
              const thisMonthCount = getStudentCount(stu.id, thisYear, selectedMonth);
              const thisYearCount = getStudentCount(stu.id, thisYear);
              const stuClass = classes.find((c: any) => c.id === stu.classId);

              return (
                <div key={stu.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                    {stu.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-700 truncate">{stu.name}</p>
                    <p className="text-[10px] text-neutral-400">{stuClass?.name || ""} · 이번달 {thisMonthCount}회 · 올해 {thisYearCount}회</p>
                  </div>
                  {activeSession && (
                    <div className="flex gap-1">
                      {(["present", "late", "absent", "excused"] as AttendanceState[]).map(s => (
                        <button
                          key={s}
                          onClick={() => markStudentAttendance(stu.id, activeSession.id, s)}
                          className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition border ${
                            record?.state === s ? stateColor(s) : "border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50"
                          }`}
                        >
                          {stateLabel(s)}
                        </button>
                      ))}
                    </div>
                  )}
                  {!activeSession && record && (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${stateColor(record.state)}`}>
                      {stateLabel(record.state)}
                    </span>
                  )}
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
            {[
              { id: "month" as const, label: "월별" },
              { id: "year" as const, label: "연별" },
            ].map(t => (
              <button key={t.id} onClick={() => setHistoryMode(t.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${historyMode === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const d = new Date(selectedDate);
              if (historyMode === "month") d.setMonth(d.getMonth() - 1); else d.setFullYear(d.getFullYear() - 1);
              setSelectedDate(toStr(d));
            }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center">
              <input
                type={historyMode === "month" ? "month" : "number"}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-center font-bold"
                value={historyMode === "month" ? `${thisYear}-${String(selectedMonth).padStart(2, "0")}` : thisYear}
                onChange={e => {
                  if (historyMode === "month") {
                    setSelectedDate(`${e.target.value}-01`);
                  } else {
                    setSelectedDate(`${e.target.value}-12-31`);
                  }
                }}
              />
            </div>
            <button onClick={() => {
              const d = new Date(selectedDate);
              if (historyMode === "month") d.setMonth(d.getMonth() + 1); else d.setFullYear(d.getFullYear() + 1);
              setSelectedDate(toStr(d));
            }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{filteredRecords.filter(r => r.state === "present").length}</p>
              <p className="text-[10px] font-semibold text-emerald-500">출석</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{filteredRecords.filter(r => r.state === "late").length}</p>
              <p className="text-[10px] font-semibold text-amber-500">지각</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <p className="text-lg font-bold text-rose-600">{filteredRecords.filter(r => r.state === "absent").length}</p>
              <p className="text-[10px] font-semibold text-rose-500">결석</p>
            </div>
          </div>

          {/* Class filter */}
          <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="all">전체 반</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Per-student attendance table */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
              <p className="text-xs font-bold text-neutral-500">
                학생별 출석 현황 ({historyMode === "month" ? `${selectedMonth}월` : `${thisYear}년`})
                · {historyMode === "month" ? `총 ${totalSessionsThisMonth}회` : `총 ${totalSessionsThisYear}회`} 예배
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
                const totalCount = historyMode === "month" ? totalSessionsThisMonth : totalSessionsThisYear;
                const rate = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
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
                      <p className="text-[10px] text-neutral-400">{rate}%</p>
                    </div>
                    <div className="w-16 rounded-full bg-neutral-100 h-1.5">
                      <div className="rounded-full bg-indigo-500 h-1.5 transition-all" style={{ width: `${Math.min(rate, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session history list */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
              <p className="text-xs font-bold text-neutral-500">출석 세션 기록</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {filteredSessions.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                  <AlertCircle size={24} />
                  <p className="text-xs">해당 기간에 출석 세션이 없습니다.</p>
                </div>
              )}
              {filteredSessions.map(sess => {
                const sessRecords = attendanceRecords.filter(r => r.sessionId === sess.id);
                const present = sessRecords.filter(r => r.state === "present").length;
                const late = sessRecords.filter(r => r.state === "late").length;
                const absent = sessRecords.filter(r => r.state === "absent").length;
                const sessDate = new Date(sess.date);
                const sessWeek = getWeekNumber(sessDate);

                return (
                  <div key={sess.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-700">{sess.eventName}</p>
                        <p className="text-[11px] text-neutral-400">
                          {sess.date} · {sess.startTime}~{sess.endTime} · {sessWeek}번째 주
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">출석 {present}</span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">지각 {late}</span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">결석 {absent}</span>
                      </div>
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
