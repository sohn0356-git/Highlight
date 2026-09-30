"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, ChevronRight, LogOut, Settings, ShieldCheck, Target, Users, X, Award } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import BadgeCard from "@/components/BadgeCard";
import { useApp, useViewMode } from "@/lib/store-context";
import { getStudentLevel, getNextLevelXp, fetchStudentBadgesWithProgress } from "@/lib/db";

export default function MyContent() {
  const {
    student, isLoggedIn, classes, logout, missions, completedMissionIds, completeMission,
    dailyQuests, dailyQuestIds, completeDailyQuest, badgeRefreshKey, teachers,
    pushSupported, pushPermission, pushEnabled, pushPreferences,
    enablePushNotifications, disablePushNotifications, updatePushCategoryPreference,
  } = useApp();
  const { setMode } = useViewMode();
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (student?.id) {
      setBadgesLoading(true);
      fetchStudentBadgesWithProgress(student.id)
        .then(setBadges)
        .catch(() => setBadges([]))
        .finally(() => setBadgesLoading(false));
    }
  }, [student?.id, badgeRefreshKey]);

  if (!student || !isLoggedIn) return null;

  const isAdmin = student.role === "admin";

  const studentLevel = getStudentLevel(student.xp || 0);
  const studentNextXp = getNextLevelXp(studentLevel.level, false);
  const canTogglePush = pushSupported && pushPermission !== "denied";


  // 관리자 페이지에서 등록한 미션 전체(스페셜 포함) - 프로필 탭에 표시
  const activeMissions = missions.filter((m: any) => m.active !== false);
  const special = activeMissions.filter((m: any) => m.category === "special");
  const dailyTotal = dailyQuests.length;
  const dailyDone = dailyQuestIds.length;

  const handleDeleteMission = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    // Admin function - not implemented here
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader
          title="프로필"
          showBack
          subtitle={student.name}
          right={
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition active:scale-95 active:bg-neutral-50"
              aria-label="설정"
            >
              <Settings size={19} />
            </button>
          }
        />
      </div>

      {/* Student XP & Level Card */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-200">내 레벨</p>
              <p className="mt-1 text-2xl font-extrabold">LV.{studentLevel.level}</p>
              <p className="mt-0.5 text-xs text-indigo-200">총 {(student.xp || 0).toLocaleString()} D</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold">{(student.mileage || 0).toLocaleString()}<span className="text-sm font-bold text-indigo-200 ml-1">D</span></p>
              <p className="text-xs text-indigo-200">내 달란트</p>
            </div>
          </div>
          {studentNextXp < Infinity && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-indigo-200">
                <span>LV.{studentLevel.level}</span>
                <span>LV.{studentLevel.level + 1}</span>
              </div>
              <ProgressBar value={student.xp || 0} max={studentNextXp} className="bg-white/20" barClassName="bg-white" />
              <p className="mt-1 text-[10px] text-indigo-200 text-right">{studentNextXp - (student.xp || 0)} D 남음</p>
            </div>
          )}
        </Card>
      </section>



      {/* ── 오늘의 퀘스트 ── */}
      <section className="mt-5 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-indigo-500" />
          <h2 className="text-sm font-bold text-neutral-800">오늘의 퀘스트</h2>
          <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">{dailyDone}/{dailyTotal}</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 mb-3">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(dailyDone / dailyTotal) * 100}%` }} />
        </div>
        <div className="flex flex-col gap-2">
          {dailyQuests.map(q => {
            const done = dailyQuestIds.includes(q.id);
            return (
              <div key={q.id} className={`rounded-xl border p-3 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{q.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-800"}`}>{q.title}</p>
                    <p className="text-[11px] text-neutral-400">{q.description}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>+{q.reward}D</span>
                  {done && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 관리자 미션 전체 (스페셜 포함) ── */}
      {activeMissions.length > 0 && (
        <section className="mt-5 px-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500">⭐</span>
            <h2 className="text-sm font-bold text-neutral-800">미션</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">{activeMissions.length}개</span>
          </div>
          <div className="flex flex-col gap-2">
            {activeMissions.map(m => {
              const done = completedMissionIds.includes(m.id);
              return (
                <div key={m.id} className={`rounded-xl border p-3 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-100 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{m.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${done ? "text-emerald-700" : "text-neutral-800"}`}>{m.title}</p>
                      <p className="text-[11px] text-neutral-400">{m.description}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">+{m.reward}D</span>
                    {done && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 배지 컬렉션 ── */}
      <section className="mt-5 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-amber-500" />
          <h2 className="text-sm font-bold text-neutral-800">배지 컬렉션</h2>
        </div>
        {badgesLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {badges.map((b: any) => <BadgeCard key={b.id} badge={b} />)}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="mt-5 px-5">
          <button onClick={() => setMode("admin")}
            className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-left shadow-sm active:scale-[0.98] transition">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 text-white"><ShieldCheck size={22} /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-800">관리자 페이지</p>
              <p className="text-xs text-indigo-500">학생/출석/미션/달란트 관리</p>
            </div>
            <ChevronRight size={18} className="text-indigo-400" />
          </button>
        </section>
      )}

      <section className="mt-5 px-5 pb-8">
        <button onClick={() => { logout(); window.location.reload(); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-500 transition active:scale-[0.98] active:bg-red-100">
          <LogOut size={16} />
          로그아웃
        </button>
      </section>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSettingsOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-neutral-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-500" />
                <h2 className="text-base font-bold text-neutral-900">설정</h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-neutral-600 active:bg-neutral-300"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${pushEnabled ? "bg-indigo-50 text-indigo-500" : "bg-neutral-100 text-neutral-400"}`}>
                  {pushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900">푸시 알림</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                    {pushPermission === "denied" ? "브라우저 설정에서 알림 권한을 허용해야 해요." : pushSupported ? "앱을 닫아도 알림을 받을 수 있어요." : "이 기기에서는 푸시 알림을 지원하지 않아요."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-[11px] font-bold ${pushEnabled ? "text-indigo-500" : "text-neutral-400"}`}>
                    {!pushSupported ? "미지원" : pushPermission === "denied" ? "차단됨" : pushEnabled ? "ON" : "OFF"}
                  </span>
                  <Switch
                    checked={pushEnabled}
                    disabled={!canTogglePush}
                    onChange={() => pushEnabled ? disablePushNotifications() : enablePushNotifications()}
                    label="푸시 알림"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-neutral-100 pt-3">
                <NotificationToggle
                  label="공지"
                  description="새 공지가 등록될 때"
                  checked={pushPreferences.announcement}
                  disabled={!pushEnabled}
                  onChange={(checked) => updatePushCategoryPreference("announcement", checked)}
                />
                <NotificationToggle
                  label="기도"
                  description="누가 내 기도제목에 기도했을 때"
                  checked={pushPreferences.prayer}
                  disabled={!pushEnabled}
                  onChange={(checked) => updatePushCategoryPreference("prayer", checked)}
                />
                <NotificationToggle
                  label="칭찬"
                  description="누가 나를 칭찬했을 때"
                  checked={pushPreferences.praise}
                  disabled={!pushEnabled}
                  onChange={(checked) => updatePushCategoryPreference("praise", checked)}
                />
                <NotificationToggle
                  label="QT"
                  description="내 QT 공유글에 댓글이 달릴 때"
                  checked={pushPreferences.qt}
                  disabled={!pushEnabled}
                  onChange={(checked) => updatePushCategoryPreference("qt", checked)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${disabled ? "bg-neutral-50 opacity-60" : "bg-neutral-50"}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-800">{label}</p>
        <p className="mt-0.5 text-[11px] text-neutral-400">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={() => onChange(!checked)} label={`${label} 알림`} />
    </div>
  );
}

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-indigo-500" : "bg-neutral-300"}`}
    >
      <span className={`absolute top-1 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}
