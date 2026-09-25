"use client";
import { useEffect, useState } from "react";
import { Bell, Flame, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import ClassRankingCard from "@/components/ClassRankingCard";
import ActivityCard from "@/components/ActivityCard";
import { useApp } from "@/lib/store-context";
import { getStudentLevel, getNextLevelXp } from "@/lib/db";
import { koreaDate } from "@/lib/korea-date";

export default function HomeContent() {
  const {
    student, isLoggedIn, isLoading, classes, activities, season, dailyQuestIds, completeDailyQuest,
    allStudents, refreshActivities, announcements, notifications, unreadCount,
    pushSupported, pushPermission, pushEnabled, enablePushNotifications, disablePushNotifications,
    markNotificationRead, markAllNotificationsRead,
  } = useApp();
  const [feedOpen, setFeedOpen] = useState(false);
  const [feedTab, setFeedTab] = useState<"noti" | "news">("noti");
  const [selectedAnn, setSelectedAnn] = useState<any>(null);

  useEffect(() => { refreshActivities(); }, [refreshActivities]);
  useEffect(() => {
    if (!student || isLoading || !isLoggedIn || dailyQuestIds.includes("d8")) return;
    const key = `daily_quest_attempt:${student.id}:d8:${koreaDate()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    completeDailyQuest("d8");
  }, [student, isLoading, isLoggedIn, dailyQuestIds, completeDailyQuest]);

  if (!student || !isLoggedIn) return null;
  const myClass = classes.find(c => c.id === student.classId);
  const studentLevel = getStudentLevel(student.xp || 0);
  const nextXp = getNextLevelXp(studentLevel.level, false);

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader
          title="Highlight"
          subtitle={season.title}
          right={
            <button
              onClick={() => setFeedOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition active:scale-95 active:bg-neutral-50"
              aria-label="고등부 소식"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          }
        />
      </div>

      {/* ── 공지사항 (최상단) ── */}
      <section className="mt-3 px-5">
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg">📢</span>
            <h2 className="text-sm font-bold text-neutral-800">공지사항</h2>
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">등록된 공지가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 3).map((an: any) => (
                <button key={an.id} onClick={() => setSelectedAnn(an)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition active:scale-[0.98] ${an.important ? "bg-amber-50 border border-amber-200" : "bg-neutral-50 border border-neutral-100"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {an.important && <span className="text-xs shrink-0">📌</span>}
                      <p className="text-sm font-semibold text-neutral-800 truncate">{an.title}</p>
                    </div>
                    <p className="text-[10px] text-neutral-400 shrink-0">{an.createdAt?.slice(0, 10) || ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── Hero Card: 이름 + 레벨 ── */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold">{student.name}</p>
              <p className="mt-1 text-xs font-bold tracking-widest text-indigo-200">{myClass?.name || "반 미배정"}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-extrabold">{(student.mileage || 0).toLocaleString()}</p>
                <span className="text-sm font-bold text-indigo-200">D</span>
              </div>
            </div>
            <div className="text-right">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 ml-auto">
                <Flame className="text-amber-300" size={28} />
              </div>
              <p className="mt-1.5 text-sm font-bold text-amber-200">LV.{studentLevel.level}</p>
            </div>
          </div>
          {nextXp < Infinity && (
            <div className="mt-3">
              <ProgressBar value={student.xp || 0} max={nextXp} className="bg-white/20" barClassName="bg-white" />
              <p className="mt-1 text-[10px] text-indigo-200 text-right">다음 레벨까지 {nextXp - (student.xp || 0)} D</p>
            </div>
          )}
        </Card>
      </section>

      {/* ── 랭킹 ── */}
      <section className="mt-5 px-5">
        <ClassRankingCard
          classes={classes as any}
          myClassId={student.classId}
          students={allStudents as any}
          myStudentId={student.id}
        />
      </section>

      {/* ── 공지 상세 모달 ── */}
      {selectedAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedAnn(null)}>
          <div className="mx-4 w-full max-w-sm max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                {selectedAnn.important && <span className="text-xs">📌</span>}
                <h3 className="text-sm font-bold text-neutral-800">{selectedAnn.title}</h3>
              </div>
              <button onClick={() => setSelectedAnn(null)} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-0">
            {selectedAnn.content && <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{selectedAnn.content}</p>}
            <p className="mt-3 text-[10px] text-neutral-400">{selectedAnn.createdAt?.slice(0, 10) || ""}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 소식 모달 ── */}
      {feedOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setFeedOpen(false)}>
          <div
            className="max-h-[75vh] w-full max-w-md mx-auto overflow-y-auto rounded-t-3xl bg-neutral-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-full bg-neutral-200 p-1">
                <button
                  onClick={() => setFeedTab("noti")}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-bold transition ${feedTab === "noti" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
                >
                  🔔 알림
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFeedTab("news")}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${feedTab === "news" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
                >
                  💬 소식
                </button>
              </div>
              <button
                onClick={() => setFeedOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-neutral-600 active:bg-neutral-300"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            {feedTab === "noti" ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {pushSupported && (
                  <div className="rounded-2xl border border-neutral-100 bg-white p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-800">기도 푸시 알림</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                          {pushEnabled ? "누가 내 기도제목에 기도하면 휴대폰 알림을 받아요." : pushPermission === "denied" ? "브라우저 설정에서 알림 권한을 허용해야 해요." : "허용하면 앱을 닫아도 기도 알림을 받을 수 있어요."}
                        </p>
                      </div>
                      <button
                        onClick={() => pushEnabled ? disablePushNotifications() : enablePushNotifications()}
                        disabled={pushPermission === "denied"}
                        className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${pushEnabled ? "bg-neutral-100 text-neutral-700" : "bg-neutral-900 text-white"}`}
                      >
                        {pushEnabled ? "끄기" : "켜기"}
                      </button>
                    </div>
                  </div>
                )}
                {unreadCount > 0 && (
                  <button onClick={() => markAllNotificationsRead()} className="self-end text-[11px] font-bold text-indigo-500">
                    모두 읽음으로 표시
                  </button>
                )}
                {notifications.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">아직 알림이 없어요.</p>
                )}
                {notifications.map((n: any) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.isRead) markNotificationRead(n.id); }}
                    className={`w-full rounded-xl border p-3.5 text-left transition active:scale-[0.98] ${n.isRead ? "border-neutral-100 bg-white" : "border-rose-200 bg-rose-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                      <p className="text-sm font-bold text-neutral-800">{n.title || "알림"}</p>
                      <p className="ml-auto shrink-0 text-[10px] text-neutral-400">{(n.createdAt || "").slice(5, 16).replace("T", " ")}</p>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{n.body}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2.5">
                {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
