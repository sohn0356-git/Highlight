"use client";
import { useState } from "react";
import { BookOpen, CheckCircle, Calendar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import SharedQTFeed from "@/components/SharedQTFeed";
import { useApp } from "@/lib/store-context";

export default function QTContent() {
  const { student, isLoggedIn, qtToday, isQTDoneToday, completeQT, updateQT, deleteQT, qtRecords, sharedTodayQT, shareQT, sharedQTDates } = useApp();
  const [remembered, setRemembered] = useState("");
  const [application, setApplication] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [sharedMsg, setSharedMsg] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editRemembered, setEditRemembered] = useState("");
  const [editApplication, setEditApplication] = useState("");

  if (!student || !isLoggedIn) return null;

  const handleShare = async () => {
    const ok = await shareQT();
    if (ok) {
      setSharedMsg("QT 공유 완료! +10M");
    } else {
      setSharedMsg("오늘은 이미 공유했어요.");
    }
  };

  const handleComplete = () => {
    if (!remembered.trim() || !application.trim()) return;
    completeQT(remembered.trim(), application.trim());
    setJustCompleted(true);
  };

  const handleUpdateQT = () => {
    if (editRecordId && (editRemembered.trim() || editApplication.trim())) {
      updateQT(editRecordId, { remembered: editRemembered.trim(), application: editApplication.trim() });
      setEditRecordId(null);
    }
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="오늘의 QT" showBack subtitle={qtToday.date} right={<BookOpen size={18} className="text-indigo-400" />} />
      </div>

      <section className="mt-3 px-5">
        <Card>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-sm">📖</span>
            <p className="text-sm font-bold text-indigo-700">{qtToday.passage}</p>
          </div>
          <blockquote className="mt-3 border-l-2 border-indigo-200 pl-3.5 text-sm italic leading-relaxed text-neutral-700">
            &ldquo;{qtToday.verse}&rdquo;
          </blockquote>
          <div className="mt-3 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{qtToday.content}</div>
        </Card>
      </section>

      {!isQTDoneToday && !justCompleted ? (
        <section className="mt-5 px-5">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">1. 가장 마음에 남은 말씀은?</span>
              <textarea
                value={remembered}
                onChange={e => setRemembered(e.target.value)}
                rows={3}
                placeholder="오늘 느낀 말씀을 적어주세요…"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">2. 오늘 어떻게 살아보고 싶나요?</span>
              <textarea
                value={application}
                onChange={e => setApplication(e.target.value)}
                rows={3}
                placeholder="오늘의 결단을 적어주세요…"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </label>
          </div>
          <button
            onClick={handleComplete}
            disabled={!remembered.trim() || !application.trim()}
            className="mt-4 w-full rounded-2xl bg-indigo-500 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition active:scale-[0.98] active:bg-indigo-600 disabled:opacity-40 disabled:shadow-none"
          >
            QT 완료 +20M
          </button>
        </section>
      ) : (
        <section className="mt-5 px-5">
          <Card className="border-emerald-100 bg-emerald-50/70 text-center">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-lg font-bold text-emerald-700">🌱 오늘의 QT 완료!</p>
            <p className="mt-1 text-sm text-emerald-600">
              이번 달 {qtRecords.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}번째 QT예요.
            </p>
            <div className="mt-4 rounded-xl bg-emerald-100/60 px-4 py-2 text-sm font-semibold text-emerald-700">+20M 적립 완료</div>
          </Card>
          <div className="mt-3">
            <button
              onClick={handleShare}
              disabled={sharedTodayQT}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition active:scale-[0.98] ${
                sharedTodayQT ? "bg-neutral-100 text-neutral-400" : "bg-indigo-500 text-white shadow-lg shadow-indigo-200 active:bg-indigo-600"
              }`}
            >
              {sharedTodayQT ? "오늘 QT 공유 완료 ✓" : "친구와 QT 공유하기 +10M"}
            </button>
            {sharedMsg && <p className="mt-2 text-center text-xs font-semibold text-indigo-600">{sharedMsg}</p>}
          </div>
        </section>
      )}

      <section className="mt-5 px-5 pb-6">
        <button
          onClick={() => setShowRecordModal(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-lg">📖</span>
            <div className="text-left">
              <p className="text-sm font-bold text-neutral-800">내 QT 기록</p>
              <p className="text-xs text-neutral-400">{qtRecords.length}개의 기록</p>
            </div>
          </div>
          <span className="text-lg text-neutral-300">›</span>
        </button>
      </section>

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-bold text-neutral-900">QT 기록 ({qtRecords.length}개)</h2>
            <button onClick={() => setShowRecordModal(false)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {qtRecords.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-400">아직 QT 기록이 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {qtRecords.slice().reverse().map(r => (
                  <div key={r.id} onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)} className="cursor-pointer rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 transition active:bg-neutral-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📖</span>
                        <p className="text-sm font-bold text-neutral-800">{r.passage}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">+{r.reward}M</span>
                        <span className={`text-xs transition-transform ${expandedRecord === r.id ? "rotate-90" : ""}`}>›</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">{r.date}</p>
                    {expandedRecord === r.id && (
                      <div className="mt-3 rounded-xl bg-white p-3.5 border border-neutral-100">
                        {editRecordId === r.id ? (
                          <div className="space-y-2">
                            <textarea value={editRemembered} onChange={e => setEditRemembered(e.target.value)} rows={2} className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs outline-none" placeholder="기억나는 말씀" />
                            <textarea value={editApplication} onChange={e => setEditApplication(e.target.value)} rows={2} className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-xs outline-none" placeholder="실천할 것" />
                            <div className="flex gap-2">
                              <button onClick={handleUpdateQT} className="flex-1 rounded-lg bg-indigo-500 py-2 text-xs font-bold text-white">저장</button>
                              <button onClick={() => setEditRecordId(null)} className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600">취소</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <blockquote className="border-l-2 border-indigo-200 pl-3 text-sm italic text-neutral-600">&ldquo;{r.verse}&rdquo;</blockquote>
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
                                <button onClick={() => { setEditRecordId(r.id); setEditRemembered(r.remembered); setEditApplication(r.application); }} className="flex-1 rounded-lg bg-indigo-50 py-2 text-xs font-bold text-indigo-600">수정</button>
                                <button onClick={() => deleteQT(r.id)} className="flex-1 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-600">삭제</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 pb-6">
        <SharedQTFeed />
      </div>
    </div>
  );
}
