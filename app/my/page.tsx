"use client";
import { useState } from "react";
import { ShoppingBag, LogOut, ChevronRight, Calendar, BookOpen, Target, HandHeart, ShieldCheck, X, ListChecks, Award } from "lucide-react";
import Card from "@/components/Card";
import MileageDisplay from "@/components/MileageDisplay";
import StatCard from "@/components/StatCard";
import { useApp, useViewMode } from "@/lib/store-context";
import type { TabId } from "@/lib/types";

type ModalType = "qt" | "attendance" | "mileage" | "mission" | null;

export default function MyContent() {
  const { student, isLoggedIn, logout, transactions, qtRecords, completedMissionIds, missions, badges } = useApp();
  const { setMode } = useViewMode();
  const [modal, setModal] = useState<ModalType>(null);
  if (!student || !isLoggedIn) return null;

  const isAdmin = student.role === "teacher" || student.role === "admin" || student.isTeacher;

  const initialTxns = [
    { id: "it0", type: "QT 완료", description: "오늘의 QT", amount: 20, date: "2026-08-30" },
    { id: "it1", type: "주일예배 출석", description: "주일 예배", amount: 100, date: "2026-08-27" },
    { id: "it2", type: "Weekly Quest", description: "인사하기 미션", amount: 30, date: "2026-08-27" },
    { id: "it3", type: "기도 참여", description: "기도 참여", amount: 5, date: "2026-08-26" },
  ];

  const allTxns = [...initialTxns, ...transactions].slice(-8).reverse();
  const fullTxns = [...initialTxns, ...transactions].reverse();
  const completedMissions = missions.filter(m => completedMissionIds.includes(m.id));

  const buttons: { label: string; icon: React.ReactNode; modal: ModalType }[] = [
    { label: "내 QT 기록", icon: <BookOpen size={16} className="text-indigo-400" />, modal: "qt" },
    { label: "출석 기록", icon: <Calendar size={16} className="text-emerald-400" />, modal: "attendance" },
    { label: "마일리지 내역", icon: <Award size={16} className="text-amber-400" />, modal: "mileage" },
    { label: "완료한 미션", icon: <Target size={16} className="text-rose-400" />, modal: "mission" },
  ];

  return (
    <div>
      <div className="px-5 pt-7">
        <h1 className="text-xl font-bold text-neutral-900">MY</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{student.name}님</p>
      </div>

      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-0 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-lg font-bold">{student.name[0]}</span>
            <div>
              <p className="text-lg font-bold">{student.name}</p>
              <p className="text-xs text-neutral-300">{myClassName(student.classId)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/10 p-4">
            <p className="text-xs text-neutral-300">나의 마일리지</p>
            <MileageDisplay amount={student.mileage} />
          </div>
        </Card>
      </section>

      {isAdmin && (
        <section className="mt-5 px-5">
          <button onClick={() => setMode("admin")} className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-left shadow-sm active:scale-[0.98] transition">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 text-white"><ShieldCheck size={22} /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-800">관리자 페이지</p>
              <p className="text-xs text-indigo-500">학생/출석/미션/마일리지 관리</p>
            </div>
            <ChevronRight size={18} className="text-indigo-400" />
          </button>
        </section>
      )}

      <section className="mt-5 px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="예배" value="4회" tone="emerald" icon={<Calendar size={14} />} />
          <StatCard label="QT" value="17회" tone="indigo" icon={<BookOpen size={14} />} />
          <StatCard label="미션" value="8개" tone="amber" icon={<Target size={14} />} />
          <StatCard label="기도" value="12회" tone="rose" icon={<HandHeart size={14} />} />
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold text-neutral-900">마일리지 내역</h2>
        <div className="mt-3 flex flex-col gap-2">
          {allTxns.map((t) => (
            <Card key={t.id} className="!p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{t.type}</p>
                  <p className="text-xs text-neutral-400">{t.date}</p>
                </div>
                <span className={`text-sm font-bold ${t.amount > 0 ? "text-indigo-600" : "text-neutral-400"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount}M
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-base font-bold text-neutral-900">내 기록</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {buttons.map(item => (
            <button key={item.label} onClick={() => setModal(item.modal)} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm active:scale-[0.98] transition">
              <span className="flex items-center gap-2">{item.icon} {item.label}</span>
              <ChevronRight size={16} className="text-neutral-300" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <Card className="border-amber-100 bg-amber-50/60">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-800">MILEAGE SHOP</h2>
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">준비 중</span>
          </div>
          <p className="mt-1.5 text-xs text-amber-700">모은 마일리지로 특별한 보상을 만나보세요.</p>
        </Card>
      </section>

      <section className="mt-5 px-5 pb-6">
        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 text-sm font-bold text-neutral-500 active:scale-[0.98] transition">
          <LogOut size={16} /> 로그아웃
        </button>
      </section>

      {/* ── 모달 ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
              <h3 className="text-base font-bold text-neutral-900">
                {modal === "qt" && "내 QT 기록"}
                {modal === "attendance" && "출석 기록"}
                {modal === "mileage" && "마일리지 내역"}
                {modal === "mission" && "완료한 미션"}
              </h3>
              <button onClick={() => setModal(null)} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                <X size={18} />
              </button>
            </div>

            {/* 바디 */}
            <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(85vh - 64px)" }}>

              {/* QT 기록 */}
              {modal === "qt" && (
                <div className="space-y-3">
                  {qtRecords.length === 0 ? (
                    <EmptyState icon="📖" text="아직 QT 기록이 없어요." />
                  ) : (
                    [...qtRecords].reverse().map(r => (
                      <div key={r.id} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-indigo-600">{r.passage}</p>
                          <span className="text-[10px] text-neutral-400">{r.date}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-neutral-500 italic">"{r.verse}"</p>
                        {r.remembered && (
                          <div className="mt-2 rounded-lg bg-indigo-50/60 px-3 py-2">
                            <p className="text-[10px] font-semibold text-indigo-500">가장 마음에 남은 말씀</p>
                            <p className="mt-0.5 text-xs text-neutral-700">{r.remembered}</p>
                          </div>
                        )}
                        {r.application && (
                          <div className="mt-1.5 rounded-lg bg-emerald-50/60 px-3 py-2">
                            <p className="text-[10px] font-semibold text-emerald-500">오늘 어떻게 살아볼까요</p>
                            <p className="mt-0.5 text-xs text-neutral-700">{r.application}</p>
                          </div>
                        )}
                        <div className="mt-2 text-right">
                          <span className="text-xs font-bold text-indigo-600">+{r.reward}M</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 출석 기록 */}
              {modal === "attendance" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-neutral-700">총 출석</span>
                      <span className="font-bold text-indigo-600">4회</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: "80%" }} />
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">이번 달 5주 중 4주 출석</p>
                  </div>
                  {[
                    { date: "2026-08-31", event: "주일예배", status: "출석" },
                    { date: "2026-08-24", event: "주일예배", status: "출석" },
                    { date: "2026-08-20", event: "수요예배", status: "출석" },
                    { date: "2026-08-17", event: "주일예배", status: "출석" },
                    { date: "2026-08-13", event: "수요예배", status: "결석" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{a.event}</p>
                        <p className="text-[11px] text-neutral-400">{a.date}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        a.status === "출석" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 마일리지 내역 */}
              {modal === "mileage" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 p-4 text-white">
                    <p className="text-xs text-indigo-100">현재 마일리지</p>
                    <p className="mt-1 text-2xl font-bold">{student.mileage.toLocaleString()}M</p>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-neutral-500">전체 내역</span>
                    <span className="text-[11px] text-neutral-400">{fullTxns.length}건</span>
                  </div>
                  {fullTxns.length === 0 ? (
                    <EmptyState icon="💰" text="마일리지 내역이 없어요." />
                  ) : (
                    fullTxns.map(t => (
                      <div key={t.id} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">{t.type}</p>
                          <p className="text-[11px] text-neutral-400">{t.description}</p>
                          <p className="text-[10px] text-neutral-300 mt-0.5">{t.date}</p>
                        </div>
                        <span className={`text-sm font-bold ${t.amount > 0 ? "text-indigo-600" : "text-rose-500"}`}>
                          {t.amount > 0 ? "+" : ""}{t.amount}M
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 미션 기록 */}
              {modal === "mission" && (
                <div className="space-y-3">
                  {completedMissions.length === 0 ? (
                    <EmptyState icon="🎯" text="아직 완료한 미션이 없어요." />
                  ) : (
                    completedMissions.map(m => (
                      <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                        <span className="text-2xl">{m.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-neutral-800">{m.title}</p>
                          <p className="text-[11px] text-neutral-400">{m.description}</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">+{m.reward}M</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
      `}</style>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-neutral-400">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function myClassName(classId: string) {
  const map: Record<string, string> = {
    c1: "고2-3반", c2: "고1-2반", c3: "고3-1반", c4: "고1-4반", c5: "고2-1반", c6: "고3-2반",
  };
  return map[classId] || "고등부";
}
