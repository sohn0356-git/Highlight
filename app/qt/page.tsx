"use client";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle, ChevronDown, Share2, CalendarDays, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import SharedQTFeed from "@/components/SharedQTFeed";
import AppShell from "@/components/AppShell";
import { useApp } from "@/lib/store-context";
import { koreaDate } from "@/lib/korea-date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDisplayDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(d);
}

function monthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year}년 ${monthNumber}월`;
}

function addMonths(month: string, diff: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const d = new Date(year, monthNumber - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date, day: d.getDate(), inMonth: d.getMonth() === monthNumber - 1 };
  });
}

function QTCalendar({
  activeDates,
  selectedDate,
  visibleMonth,
  onMonthChange,
  onSelectDate,
}: {
  activeDates: Set<string>;
  selectedDate: string;
  visibleMonth: string;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
}) {
  const today = koreaDate();
  const days = buildCalendarDays(visibleMonth);

  return (
    <div className="absolute left-5 right-5 top-14 z-20 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-200/70">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
          className="grid h-9 w-9 place-items-center rounded-full bg-neutral-50 text-neutral-500 transition active:scale-95"
          aria-label="이전 달"
        >
          <ChevronLeft size={17} />
        </button>
        <p className="text-sm font-bold text-neutral-900">{monthTitle(visibleMonth)}</p>
        <button
          onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
          className="grid h-9 w-9 place-items-center rounded-full bg-neutral-50 text-neutral-500 transition active:scale-95"
          aria-label="다음 달"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-[11px] font-bold text-neutral-400">{day}</div>
        ))}
        {days.map(({ date, day, inMonth }) => {
          const isActive = activeDates.has(date);
          const isSelected = selectedDate === date;
          const isToday = today === date;
          return (
            <button
              key={date}
              onClick={() => isActive && onSelectDate(date)}
              disabled={!isActive}
              className={`relative grid aspect-square place-items-center rounded-xl text-sm font-bold transition ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  : isActive
                    ? "bg-indigo-50 text-indigo-700 active:scale-95"
                    : "text-neutral-300"
              } ${!inMonth ? "opacity-35" : ""}`}
            >
              {day}
              {isToday && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-indigo-500"}`} />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <p className="text-[11px] font-semibold text-neutral-500">공유내역이 있는 날짜만 선택할 수 있어요.</p>
        <button
          onClick={() => {
            onMonthChange(today.slice(0, 7));
            onSelectDate(today);
          }}
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
        >
          오늘
        </button>
      </div>
    </div>
  );
}

function QTContentView({ embedded = false }: { embedded?: boolean } = {}) {
  const { student, isLoggedIn, qtToday, isQTDoneToday, completeQT, updateQT, deleteQT, qtRecords, shareQT, unshareQT, sharedQTDates, sharedPosts } = useApp();
  const [remembered, setRemembered] = useState("");
  const [application, setApplication] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [sharedMsg, setSharedMsg] = useState("");
  const [sharing, setSharing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(koreaDate());
  const [visibleMonth, setVisibleMonth] = useState(koreaDate().slice(0, 7));
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editRemembered, setEditRemembered] = useState("");
  const [editApplication, setEditApplication] = useState("");
  const [recordsPage, setRecordsPage] = useState(0);
  const [locallySharedDates, setLocallySharedDates] = useState<Set<string>>(new Set());
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const PAGE_SIZE = 5;
  const today = koreaDate();
  const activeDates = useMemo(() => new Set([today, ...sharedPosts.map((post) => post.date).filter(Boolean)]), [sharedPosts, today]);

  // 절 파싱: 숫자로 시작하는 줄을 절로 간주
  const parseVerses = (content: string): string[] => {
    if (!content) return [];
    return content.split("\n").filter((line) => /^\d{1,3}\s/.test(line.trim()));
  };
  const verses = parseVerses(qtToday.content || "");

  const toggleVerse = (idx: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const copySelectedVerses = () => {
    const text = verses.filter((_, i) => selectedVerses.has(i)).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setSelectedVerses(new Set());
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!student || !isLoggedIn) return null;

  const selectedIsToday = selectedDate === today;

  const handleShare = async (date?: string) => {
    if (sharing) return;

    setSharing(true);
    try {
      const ok = await shareQT(date);
      if (ok) {
        if (date) setLocallySharedDates(prev => new Set([...prev, date]));
        setSharedMsg("QT 공유 완료!");
      } else {
        if (date) setLocallySharedDates(prev => new Set([...prev, date]));
        setSharedMsg("이미 공유된 기록입니다.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (date?: string) => {
    if (sharing) return;
    if (!confirm("공유를 취소하시겠습니까?")) return;
    setSharing(true);
    try {
      const ok = await unshareQT(date);
      if (ok && date) setLocallySharedDates(prev => { const n = new Set(prev); n.delete(date); return n; });
      setSharedMsg(ok ? "공유가 취소되었습니다." : "공유한 내용이 없습니다.");
    } finally {
      setSharing(false);
    }
  };

  const handleComplete = () => {
    if (!remembered.trim() || !application.trim()) return;
    completeQT(remembered.trim(), application.trim());
    setJustCompleted(true);
  };

  const handleUpdateQT = (r: any) => {
    if (editRecordId && (editRemembered.trim() || editApplication.trim())) {
      updateQT(editRecordId, { remembered: editRemembered.trim(), application: editApplication.trim() });
      // Update shared post if this record is shared
      (async () => {
        const { getSupabase } = await import("@/lib/supabase");
        const sb = getSupabase();
        if (sb) {
          await sb.from("shared_qt_posts").update({ remembered: editRemembered.trim(), application: editApplication.trim() }).eq("student_id", student!.id).eq("date", r.date);
        }
      })();
      setEditRecordId(null);
    }
  };

  const handleDeleteQT = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    deleteQT(id);
  };

  const content = (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title={selectedIsToday ? "오늘의 QT" : "QT 공유내역"} showBack right={<BookOpen size={18} className="text-indigo-400" />} />
      </div>

      <div className="relative px-5">
        <button
          onClick={() => setShowCalendar((open) => !open)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99]"
        >
          <span>
            <span className="block text-[11px] font-bold text-neutral-400">{selectedIsToday ? "오늘 말씀" : "과거 공유 기록"}</span>
            <span className="mt-0.5 block text-sm font-bold text-neutral-900">{formatDisplayDate(selectedDate)}</span>
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-500">
            <CalendarDays size={18} />
          </span>
        </button>

        {showCalendar && (
          <QTCalendar
            activeDates={activeDates}
            selectedDate={selectedDate}
            visibleMonth={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setShowCalendar(false);
              setExpandedRecord(null);
              setEditRecordId(null);
            }}
          />
        )}
      </div>

      {selectedIsToday && (
      <section className="mt-3 px-5">
        <Card>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-sm">📖</span>
            <p className="text-sm font-bold text-indigo-700">{qtToday.passage}</p>
          </div>
          <div className="mt-3 space-y-0.5">
            {verses.length > 0 ? (
              verses.map((v, i) => {
                const sel = selectedVerses.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleVerse(i)}
                    className={`w-full text-left text-sm leading-relaxed rounded-md px-2 py-1 -mx-2 transition ${
                      sel
                        ? "bg-indigo-100 text-indigo-800 font-medium"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {v}
                  </button>
                );
              })
            ) : (
              <div className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{qtToday.content}</div>
            )}
          </div>
          {selectedVerses.size > 0 && (
            <button
              onClick={copySelectedVerses}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
            >
              <Copy size={13} /> 선택한 절 복사 ({selectedVerses.size}절)
            </button>
          )}
          {copied && (
            <div className="pointer-events-none mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-100 py-3 text-sm font-bold text-emerald-600">
              ✅ 복사 완료!
            </div>
          )}
        </Card>
      </section>
      )}

      {selectedIsToday && (!isQTDoneToday && !justCompleted ? (
        <section className="mt-5 px-5">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">1. 가장 마음에 남은 말씀은?</span>
              <textarea value={remembered} onChange={e => setRemembered(e.target.value)} rows={3}
                placeholder="오늘 느낀 말씀을 적어주세요…"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">2. 오늘 어떻게 살아보고 싶나요?</span>
              <textarea value={application} onChange={e => setApplication(e.target.value)} rows={3}
                placeholder="오늘의 결단을 적어주세요…"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
            </label>
          </div>
          <button onClick={handleComplete} disabled={!remembered.trim() || !application.trim()}
            className="mt-4 w-full rounded-2xl bg-indigo-500 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition active:scale-[0.98] active:bg-indigo-600 disabled:opacity-40 disabled:shadow-none">
            QT 완료
          </button>
        </section>
      ) : (
        <section className="mt-5 px-5">
          <Card className="border-emerald-100 bg-emerald-50/70 text-center">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <p className="mt-2 text-sm font-bold text-emerald-700">QT 완료!</p>

          </Card>

        </section>
      ))}

      {/* QT 기록 보기 */}
      {selectedIsToday && qtRecords.length > 0 && (
        <section className="mt-5 px-5">
          <button onClick={() => setShowRecordModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm font-bold text-neutral-600 transition active:scale-[0.98]">
            <CalendarDays size={16} /> QT 기록 ({qtRecords.length}개)
          </button>
        </section>
      )}

      {/* QT 기록 모달 */}

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }} className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-bold text-neutral-900">QT 기록 ({qtRecords.length}개)</h2>
            <button onClick={() => { setShowRecordModal(false); setEditRecordId(null); }}
              className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {sharedMsg && (
              <div className="mb-3 rounded-xl bg-indigo-50 px-4 py-2.5 text-center text-xs font-semibold text-indigo-600">
                {sharedMsg}
              </div>
            )}
            {(() => {
              const paged = qtRecords.slice();
              const pageItems = paged.slice(recordsPage * PAGE_SIZE, (recordsPage + 1) * PAGE_SIZE);
              return (
                <>
                  {pageItems.map(r => (
              <div key={r.id} className="mb-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📖</span>
                    <p className="text-sm font-bold text-neutral-800">{r.passage}</p>
                  </div>
                  <div className="flex items-center gap-1.5">

                    {(() => {
                      const isToday = r.date === today;
                      const isShared = sharedQTDates.includes(r.date) || locallySharedDates.has(r.date);
                      const canShare = isToday && !isShared;
                      const isOwn = r.studentId === student?.id;
                      return isOwn ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (canShare) handleShare(r.date); }}
                          disabled={!canShare || sharing}
                          title={isShared ? "이미 공유됨" : !isToday ? "오늘 기록만 공유 가능" : "공유하기"}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition active:scale-95 ${
                            isShared
                              ? "bg-emerald-50 text-emerald-600"
                              : canShare
                                ? "bg-indigo-500 text-white"
                                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                          }`}
                        >
                          <Share2 size={10} />
                          {isShared ? "공유됨" : canShare ? "공유하기" : ""}
                        </button>
                      ) : null;
                    })()}
                    {/* Toggle button for collapse */}
                    <button onClick={(e) => { e.stopPropagation(); setExpandedRecord(expandedRecord === r.id ? null : r.id); }}
                      className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-neutral-400 active:bg-neutral-200 transition">
                      <ChevronDown size={14} className={`transition-transform ${expandedRecord === r.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">{r.date}</p>
                {expandedRecord === r.id && (
                  <div className="mt-3 rounded-xl bg-white p-3.5 border border-neutral-100">
                    {editRecordId === r.id ? (
                      <div className="space-y-2">
                        <textarea value={editRemembered} onChange={e => setEditRemembered(e.target.value)} rows={2}
                          className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs outline-none" placeholder="기억나는 말씀" />
                        <textarea value={editApplication} onChange={e => setEditApplication(e.target.value)} rows={2}
                          className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-xs outline-none" placeholder="실천할 것" />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateQT(r)} className="flex-1 rounded-lg bg-indigo-500 py-2 text-xs font-bold text-white">저장</button>
                          <button onClick={(e) => { e.stopPropagation(); setEditRecordId(null); }} className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600">취소</button>
                        </div>
                      </div>
                    ) : (
                      <>

                        <div className="mt-3 space-y-2">
                          <div className="rounded-lg bg-indigo-50/70 px-3 py-2.5">
                            <p className="text-[11px] font-bold text-indigo-600">💡 기억나는 말씀</p>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-700">{r.remembered}</p>
                          </div>
                          <div className="rounded-lg bg-emerald-50/70 px-3 py-2.5">
                            <p className="text-[11px] font-bold text-emerald-600">🌱 실천할 것</p>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-700">{r.application}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setEditRecordId(r.id); setExpandedRecord(r.id); setEditRemembered(r.remembered); setEditApplication(r.application); }}
                              className="flex-1 rounded-lg bg-indigo-50 py-2 text-xs font-bold text-indigo-600">수정</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteQT(r.id); }}
                              className="flex-1 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-600">삭제</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
                  ))}
                  {qtRecords.length > PAGE_SIZE && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button onClick={() => setRecordsPage(p => Math.max(0, p - 1))} disabled={recordsPage === 0} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40">← 이전</button>
                      <span className="text-xs text-neutral-400">{recordsPage + 1}/{Math.ceil(qtRecords.length / PAGE_SIZE)}</span>
                      <button onClick={() => setRecordsPage(p => p + 1)} disabled={(recordsPage + 1) * PAGE_SIZE >= qtRecords.length} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40">다음 →</button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mt-2 pb-6">
        <SharedQTFeed date={selectedDate} showEmpty />
      </div>
    </div>
  );

  return embedded ? content : <AppShell active="qt">{content}</AppShell>;
}

export default function QTContent() {
  return <QTContentView />;
}
