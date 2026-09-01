"use client";
import { useState } from "react";
import { Plus, CalendarDays, History, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import type { AttendanceRecordAdmin, AttendanceState } from "@/lib/admin-types";

function stateLabel(s: AttendanceState) {
  return { present: "출석", late: "지각", absent: "결석", excused: "공결" }[s];
}

export default function AdminAttendance() {
  const { attendanceSessions, attendanceRecords, addAttendanceSession, closeAttendanceSession, addAttendanceRecord, updateAttendanceRecord, bulkMarkAttendance, currentUser } = useAdmin();
  const { classes } = useApp();
  const [view, setView] = useState<"today" | "history">("today");
  const [historyMode, setHistoryMode] = useState<"day" | "week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState("all");
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    eventName: "주일예배",
    date: (() => {
      const d = new Date();
      const day = d.getDay();
      // 이미 오늘이 주일(0)이면 오늘, 아니면 다음 주일
      const daysUntilSun = day === 0 ? 0 : 7 - day;
      d.setDate(d.getDate() + daysUntilSun);
      return d.toISOString().slice(0, 10);
    })(),
    startTime: "10:00",
    endTime: "12:00",
    mileageReward: 100,
    xpReward: 100,
  });

  const students = useAdmin().students;
  const activeSession = attendanceSessions.find(s => s.active);

  // 날짜 범위 유틸
  const getWeekRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
  };

  const filteredSessions = attendanceSessions.filter(s => {
    if (historyMode === "day") return s.date === selectedDate;
    if (historyMode === "week") {
      const { start, end } = getWeekRange(selectedDate);
      return s.date >= start && s.date <= end;
    }
    // month
    return s.date.slice(0, 7) === selectedDate.slice(0, 7);
  });

  const filteredRecords = attendanceRecords.filter(r => {
    const session = attendanceSessions.find(s => s.id === r.sessionId);
    if (!session) return false;
    if (selectedClass !== "all") {
      const stu = students.find(x => x.id === r.studentId);
      if (stu?.classId !== selectedClass) return false;
    }
    return filteredSessions.some(s => s.id === r.sessionId);
  });

  function createSession() {
    const id = "as_" + Date.now();
    addAttendanceSession({ id, ...newSession, active: true });
    setShowNewSession(false);
  }

  function markBulk(state: AttendanceState) {
    if (activeSession && selectedStudents.length > 0) {
      bulkMarkAttendance(selectedStudents, activeSession.id, state);
      setSelectedStudents([]);
    }
  }

  function updateRecordState(recordId: string, newState: AttendanceState) {
    updateAttendanceRecord(recordId, { state: newState });
    setEditingRecordId(null);
  }

  function deleteRecord(recordId: string) {
    updateAttendanceRecord(recordId, { state: "absent" });
    setEditingRecordId(null);
  }

  function toggleSelect(id: string) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        {[
          { id: "today" as const, label: "주일 출석", icon: <CalendarDays size={14} /> },
          { id: "history" as const, label: "출석 기록", icon: <History size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              view === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* NEW / today view */}
      {view === "today" && (
        <>
          {!showNewSession && !activeSession && (
            <button
              onClick={() => setShowNewSession(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3.5 text-sm font-bold text-indigo-600"
            >
              <Plus size={16} /> 이번 주일 출석 체크
            </button>
          )}

          {showNewSession && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-neutral-800">출석 세션 생성</h3>
              <input
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                value={newSession.eventName}
                onChange={e => setNewSession({ ...newSession, eventName: e.target.value })}
                placeholder="이벤트 이름 (예: 주일예배)"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" className="rounded-lg border border-neutral-200 px-2 py-2 text-sm" value={newSession.startTime} onChange={e => setNewSession({ ...newSession, startTime: e.target.value })} />
                  <input type="time" className="rounded-lg border border-neutral-200 px-2 py-2 text-sm" value={newSession.endTime} onChange={e => setNewSession({ ...newSession, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-500">마일리지 보상</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={newSession.mileageReward} onChange={e => setNewSession({ ...newSession, mileageReward: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">XP 보상</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={newSession.xpReward} onChange={e => setNewSession({ ...newSession, xpReward: +e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createSession} className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-sm font-bold text-white">생성하기</button>
                <button onClick={() => setShowNewSession(false)} className="rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-600">취소</button>
              </div>
            </div>
          )}

          {activeSession && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-indigo-800">{activeSession.eventName}</p>
                  <p className="text-xs text-indigo-600">{activeSession.date} · {activeSession.startTime} ~ {activeSession.endTime}</p>
                  <p className="mt-1 text-xs text-indigo-600">보상: +{activeSession.mileageReward}M / +{activeSession.xpReward}XP</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 진행 중
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-white p-4 text-center text-sm text-neutral-500">
                <CalendarDays size={80} className="mx-auto text-neutral-300" />
                <p className="mt-2 text-xs text-neutral-400">출석 체크 시스템 (프로토타입)</p>
              </div>
              <button onClick={() => { closeAttendanceSession(activeSession.id); }} className="mt-3 w-full rounded-lg bg-neutral-800 py-2.5 text-sm font-bold text-white">
                세션 종료
              </button>
            </div>
          )}

          {/* Manual attendance */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">직접 출석 입력</h3>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{selectedStudents.length}명 선택</span>
            </div>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedStudents([]); }}
              >
                <option value="all">전체 반</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-100">
              {students.filter(s => selectedClass === "all" || s.classId === selectedClass).map(s => {
                const stuName = s.name;
                const stuClass = classes.find((c: any) => c.id === s.classId);
                const already = activeSession ? attendanceRecords.some(r => r.studentId === s.id && r.sessionId === activeSession.id) : false;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 border-b border-neutral-50 text-left ${
                      selectedStudents.includes(s.id) ? "bg-indigo-50" : ""
                    } ${already ? "opacity-50" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">{stuName}</p>
                      <p className="text-[11px] text-neutral-400">{stuClass?.name}</p>
                    </div>
                    {already ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 size={12} /> 체크됨</span>
                    ) : (
                      <span className={`h-4 w-4 rounded border ${selectedStudents.includes(s.id) ? "border-indigo-500 bg-indigo-500" : "border-neutral-300"} grid place-items-center`}>
                        {selectedStudents.includes(s.id) && <CheckCircle2 size={12} className="text-white" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => markBulk("present")} className="rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-white">출석 표시</button>
              <button onClick={() => markBulk("late")} className="rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white">지각 표시</button>
              <button onClick={() => markBulk("absent")} className="rounded-lg bg-rose-500 py-2.5 text-sm font-bold text-white">결석 표시</button>
              <button onClick={() => markBulk("excused")} className="rounded-lg bg-sky-500 py-2.5 text-sm font-bold text-white">공결 표시</button>
            </div>
          </div>

          {/* Today's records */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800">오늘 출석 현황</h3>
            </div>
            <div className="divide-y divide-neutral-50 max-h-72 overflow-y-auto">
              {filteredRecords.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                  <AlertCircle size={24} />
                  <p className="text-xs">아직 출석 기록이 없습니다.</p>
                </div>
              )}
              {filteredRecords.map(r => {
                const stu = students.find(x => x.id === r.studentId);
                const cls = classes.find((c: any) => c.id === stu?.classId);
                const isEditing = editingRecordId === r.id;
                return (
                  <div key={r.id}>
                    <button
                      onClick={() => setEditingRecordId(isEditing ? null : r.id)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-neutral-700">{stu?.name}</p>
                        <p className="text-[11px] text-neutral-400">{cls?.name} · {r.checkTime ? new Date(r.checkTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        r.state === "present" ? "bg-emerald-50 text-emerald-600"
                        : r.state === "late" ? "bg-amber-50 text-amber-600"
                        : r.state === "absent" ? "bg-rose-50 text-rose-600"
                        : "bg-sky-50 text-sky-600"
                      }`}>
                        {stateLabel(r.state)}
                      </span>
                    </button>
                    {isEditing && (
                      <div className="px-4 pb-3 pt-1 flex gap-1.5 flex-wrap">
                        {(["present", "late", "absent", "excused"] as AttendanceState[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateRecordState(r.id, s)}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                              r.state === s
                                ? s === "present" ? "bg-emerald-500 text-white"
                                  : s === "late" ? "bg-amber-500 text-white"
                                  : s === "absent" ? "bg-rose-500 text-white"
                                  : "bg-sky-500 text-white"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                          >{stateLabel(s)}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* History view */}
      {view === "history" && (
        <div className="space-y-3">
          {/* Day / Week / Month tabs */}
          <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
            {([
              { id: "day" as const, label: "일별" },
              { id: "week" as const, label: "주별" },
              { id: "month" as const, label: "월별" },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setHistoryMode(t.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  historyMode === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const d = new Date(selectedDate);
              if (historyMode === "day") d.setDate(d.getDate() - 1);
              else if (historyMode === "week") d.setDate(d.getDate() - 7);
              else d.setMonth(d.getMonth() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50"><ChevronLeft size={16} /></button>
            <div className="flex-1 text-center">
              <input
                type={historyMode === "month" ? "month" : "date"}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-center font-semibold"
                value={historyMode === "month" ? selectedDate.slice(0, 7) : selectedDate}
                onChange={e => setSelectedDate(historyMode === "month" ? e.target.value + "-01" : e.target.value)}
              />
              {historyMode === "week" && (
                <p className="mt-1 text-[10px] text-neutral-400">
                  {(() => {
                    const { start, end } = getWeekRange(selectedDate);
                    return `${start} ~ ${end}`;
                  })()}
                </p>
              )}
            </div>
            <button onClick={() => {
              const d = new Date(selectedDate);
              if (historyMode === "day") d.setDate(d.getDate() + 1);
              else if (historyMode === "week") d.setDate(d.getDate() + 7);
              else d.setMonth(d.getMonth() + 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 active:bg-neutral-50"><ChevronRight size={16} /></button>
          </div>
          {historyMode === "week" && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 active:bg-indigo-100"
            >
              이번 주로 이동
            </button>
          )}

          {/* Class filter */}
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="all">전체 반</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Summary */}
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

          {/* Session list */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {filteredSessions.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                <AlertCircle size={24} />
                <p className="text-xs">해당 기간에 출석 세션이 없습니다.</p>
              </div>
            )}
            {filteredSessions.map(sess => {
              const count = attendanceRecords.filter(r => r.sessionId === sess.id).length;
              const present = attendanceRecords.filter(r => r.sessionId === sess.id && r.state === "present").length;
              return (
                <div key={sess.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">{sess.eventName}</p>
                    <p className="text-[11px] text-neutral-400">{sess.date} · {sess.startTime}~{sess.endTime} · {count}명 체크</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${sess.active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                      {count > 0 ? `${present}/${count}` : sess.active ? "진행 중" : "종료"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}
