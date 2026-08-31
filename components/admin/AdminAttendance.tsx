"use client";
import { useState } from "react";
import { QrCode, Plus, CalendarDays, History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import type { AttendanceRecordAdmin, AttendanceState } from "@/lib/admin-types";

function stateLabel(s: AttendanceState) {
  return { present: "출석", late: "지각", absent: "결석", excused: "공결" }[s];
}

export default function AdminAttendance() {
  const { attendanceSessions, attendanceRecords, addAttendanceSession, closeAttendanceSession, addAttendanceRecord, bulkMarkAttendance, currentUser } = useAdmin();
  const { classes } = useApp();
  const [view, setView] = useState<"today" | "history" | "qr">("today");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState("all");
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [newSession, setNewSession] = useState({
    eventName: "주일예배",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "12:00",
    mileageReward: 100,
    xpReward: 100,
  });

  const students = useAdmin().students;
  const activeSession = attendanceSessions.find(s => s.active);

  const filteredSessions = attendanceSessions.filter(s => s.date === selectedDate);
  const filteredRecords = attendanceRecords.filter(r => {
    const session = attendanceSessions.find(s => s.id === r.sessionId);
    if (!session) return false;
    if (selectedClass !== "all" && session.date === selectedDate) {
      const stu = students.find(x => x.id === r.studentId);
      if (stu?.classId !== selectedClass) return false;
    }
    return true;
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

  function toggleSelect(id: string) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        {[
          { id: "today" as const, label: "오늘 출석", icon: <CalendarDays size={14} /> },
          { id: "history" as const, label: "출석 기록", icon: <History size={14} /> },
          { id: "qr" as const, label: "QR 출석", icon: <QrCode size={14} /> },
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
              <Plus size={16} /> 오늘의 QR 출석 생성
            </button>
          )}

          {showNewSession && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-neutral-800">QR 출석 세션 생성</h3>
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
                <QrCode size={80} className="mx-auto text-neutral-300" />
                <p className="mt-2 text-xs text-neutral-400">QR 코드는 학생 앱에서 스캔됩니다 (프로토타입)</p>
              </div>
              <button onClick={() => { closeAttendanceSession(activeSession.id); }} className="mt-3 w-full rounded-lg bg-neutral-800 py-2.5 text-sm font-bold text-white">
                QR 종료
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
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
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
          <div className="flex gap-2">
            <input type="date" className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            <select className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="all">전체 반</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {filteredSessions.map(sess => {
              const count = attendanceRecords.filter(r => r.sessionId === sess.id).length;
              return (
                <div key={sess.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">{sess.eventName}</p>
                    <p className="text-[11px] text-neutral-400">{sess.date} · {sess.startTime}~{sess.endTime} · {count}명 체크</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${sess.active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                    {sess.active ? "진행 중" : "종료"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR view */}
      {view === "qr" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
            <QrCode size={120} className="mx-auto text-neutral-400" />
            <h3 className="mt-3 text-sm font-bold text-neutral-800">QR 출석 안내</h3>
            <p className="mt-1 text-xs text-neutral-500">교사 화면에서 QR 세션을 생성하고,<br />학생 앱에서 QR을 스캔하여 출석을 체크합니다.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-bold text-neutral-800 mb-2">QR 세션 내역</h4>
            <div className="space-y-2">
              {attendanceSessions.length === 0 && <p className="text-xs text-neutral-400">아직 세션이 없습니다.</p>}
              {attendanceSessions.map(s => {
                const count = attendanceRecords.filter(r => r.sessionId === s.id).length;
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">{s.eventName}</p>
                      <p className="text-[11px] text-neutral-400">{s.date} · {count}명 체크</p>
                    </div>
                    <span className={`text-[11px] font-bold ${s.active ? "text-emerald-600" : "text-neutral-400"}`}>
                      {s.active ? "진행 중" : "종료"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
