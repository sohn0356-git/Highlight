"use client";
import { useState } from "react";
import { BookOpen, CheckCircle, Calendar, Pencil, Trash2, X, Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import SharedQTFeed from "@/components/SharedQTFeed";
import { useApp } from "@/lib/store-context";
import type { QTRecord } from "@/lib/types";

export default function QTContent() {
  const { student, isLoggedIn, qtToday, isQTDoneToday, completeQT, qtRecords, sharedTodayQT, shareQT, sharedQTDates, updateQTRecord, deleteQTRecord } = useApp();
  const [remembered, setRemembered] = useState("");
  const [application, setApplication] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [sharedMsg, setSharedMsg] = useState("");
  const [viewing, setViewing] = useState<QTRecord | null>(null);
  const [editing, setEditing] = useState<QTRecord | null>(null);
  const [editRemembered, setEditRemembered] = useState("");
  const [editApplication, setEditApplication] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!student || !isLoggedIn) return null;

  const handleShare = () => {
    const ok = shareQT();
    if (ok) {
      setSharedMsg("친구와 공유했어요! +10M");
      if (navigator.share) {
        navigator.share({
          title: "오늘의 QT",
          text: qtToday.passage + " — " + qtToday.verse,
          url: window.location.href,
        }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(qtToday.passage + " — " + qtToday.verse).catch(() => {});
      }
    } else {
      setSharedMsg("오늘은 이미 공유했어요.");
    }
  };

  const handleComplete = () => {
    if (!remembered.trim() || !application.trim()) return;
    completeQT(remembered.trim(), application.trim());
    setJustCompleted(true);
  };

  const openView = (r: QTRecord) => {
    setViewing(r);
    setConfirmDelete(false);
  };

  const startEdit = () => {
    if (!viewing) return;
    setEditing(viewing);
    setEditRemembered(viewing.remembered || "");
    setEditApplication(viewing.application || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateQTRecord(editing.id, editRemembered.trim(), editApplication.trim());
    setViewing({ ...editing, remembered: editRemembered.trim(), application: editApplication.trim() });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!viewing) return;
    await deleteQTRecord(viewing.id);
    setViewing(null);
    setEditing(null);
    setConfirmDelete(false);
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="오늘의 QT" subtitle={qtToday.date} right={<BookOpen size={18} className="text-indigo-400" />} />
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
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{qtToday.content}</p>
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
              이번 달 {qtRecords.filter(r => r.date.startsWith("2026-08")).length}번째 QT예요.
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

      <section className="mt-5 px-5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-neutral-400" />
          <h3 className="text-sm font-bold text-neutral-800">내 QT 기록</h3>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {qtRecords.length === 0 && (
            <p className="py-6 text-center text-sm text-neutral-400">아직 QT 기록이 없어요.</p>
          )}
          {qtRecords.slice().reverse().map(r => (
            <Card key={r.id} className="!p-3.5 cursor-pointer active:scale-[0.99] transition" onClick={() => openView(r)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-neutral-700">{r.date}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">+{r.reward}M</span>
                </div>
                <Eye size={14} className="text-neutral-300" />
              </div>
              <p className="mt-1 text-xs text-neutral-500">{r.passage}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-2 pb-6">
        <SharedQTFeed />
      </div>

      {/* 상세 보기 모달 */}
      {viewing && !editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setViewing(null)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-neutral-900">{viewing.date}</p>
                <p className="mt-0.5 text-sm font-semibold text-indigo-600">{viewing.passage}</p>
              </div>
              <button onClick={() => setViewing(null)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                <X size={18} />
              </button>
            </div>
            <blockquote className="mt-3 border-l-2 border-indigo-200 pl-3.5 text-sm italic text-neutral-600">
              &ldquo;{viewing.verse}&rdquo;
            </blockquote>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-neutral-500">가장 마음에 남은 말씀</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-800">{viewing.remembered || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500">오늘 어떻게 살아보고 싶나요?</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-800">{viewing.application || "—"}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-2.5">
              <button onClick={startEdit} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]">
                <Pencil size={16} /> 편집
              </button>
              <button onClick={() => setConfirmDelete(true)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-600 active:scale-[0.98]">
                <Trash2 size={16} /> 삭제
              </button>
            </div>
            {confirmDelete && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">이 QT 기록을 삭제할까요?</p>
                <p className="mt-0.5 text-xs text-rose-500">삭제하면 되돌릴 수 없어요.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-neutral-600 border border-neutral-200">취소</button>
                  <button onClick={handleDelete} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white">삭제</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-neutral-900">QT 편집 · {editing.date}</p>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">가장 마음에 남은 말씀</span>
                <textarea
                  value={editRemembered}
                  onChange={e => setEditRemembered(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">오늘 어떻게 살아보고 싶나요?</span>
                <textarea
                  value={editApplication}
                  onChange={e => setEditApplication(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-2xl border border-neutral-200 bg-white py-3.5 text-sm font-bold text-neutral-600">취소</button>
              <button onClick={saveEdit} disabled={!editRemembered.trim() || !editApplication.trim()} className="flex-1 rounded-2xl bg-indigo-500 py-3.5 text-sm font-bold text-white disabled:opacity-40">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
