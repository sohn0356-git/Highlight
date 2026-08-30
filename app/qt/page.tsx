"use client";
import { useState } from "react";
import { BookOpen, CheckCircle, Calendar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { useApp } from "@/lib/store-context";

export default function QTContent() {
  const { student, isLoggedIn, qtToday, isQTDoneToday, completeQT, qtRecords } = useApp();
  const [remembered, setRemembered] = useState("");
  const [application, setApplication] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);

  if (!student || !isLoggedIn) return null;

  const handleComplete = () => {
    if (!remembered.trim() || !application.trim()) return;
    completeQT(remembered.trim(), application.trim());
    setJustCompleted(true);
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
        </section>
      )}

      <section className="mt-5 px-5 pb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-neutral-400" />
          <h3 className="text-sm font-bold text-neutral-800">내 QT 기록</h3>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {qtRecords.length === 0 && (
            <p className="py-6 text-center text-sm text-neutral-400">아직 QT 기록이 없어요.</p>
          )}
          {qtRecords.slice().reverse().map(r => (
            <Card key={r.id} className="!p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-neutral-700">{r.date}</p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">+{r.reward}M</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{r.passage}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
