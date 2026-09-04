"use client";
import { useState } from "react";
import { Coins, Gift, Sun, Award, BarChart3, ScrollText, Settings, Plus, X, ChevronDown, RefreshCw } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import type { AdminPageId } from "@/lib/admin-types";

type MgmtTab = "mileage" | "rewards" | "season" | "badges" | "stats" | "audit" | "settings";

export default function AdminManagement({ onNavigate }: { onNavigate: (page: AdminPageId) => void }) {
  const {
    students, teachers, season, updateSeason,
    rewards, addReward, updateReward, redemptions, updateRedemption,
    badges, addBadge, updateBadge,
    allTransactions, awardsMileage,
    auditLogs, addAuditLog,
    settings, updateSettings, resetToSeedData,
  } = useAdmin();
  const { classes } = useApp();
  const [tab, setTab] = useState<MgmtTab>("mileage");

  const tabs: { id: MgmtTab; label: string; icon: typeof Coins }[] = [
    { id: "mileage", label: "마일리지", icon: Coins },
    { id: "rewards", label: "상점", icon: Gift },
    { id: "season", label: "시즌", icon: Sun },
    { id: "badges", label: "배지", icon: Award },
    { id: "stats", label: "통계", icon: BarChart3 },
    { id: "audit", label: "기록", icon: ScrollText },
    { id: "settings", label: "설정", icon: Settings },
  ];

  // Mileage state
  const [mileageTarget, setMileageTarget] = useState("student");
  const [mileageTargetId, setMileageTargetId] = useState("");
  const [mileageAmount, setMileageAmount] = useState(50);
  const [mileageReason, setMileageReason] = useState("");

  // Reward form state
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "", description: "", mileageCost: 500, inventory: 10, category: "교환권",
  });

  // Badge form state
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [badgeForm, setBadgeForm] = useState({
    name: "", description: "", icon: "🏅", requirementType: "qt_count" as "qt_count" | "attendance_count" | "mission_count" | "prayer_count", requirementValue: 1, mileageReward: 10,
  });

  // Transaction history open state
  const [isTxOpen, setIsTxOpen] = useState(false);

  function handleAwardMileage() {
    if (!mileageReason) return;
    const target = mileageTarget as "student" | "class" | "grade" | "all";
    awardsMileage(target, mileageTargetId, mileageAmount, mileageReason);
    addAuditLog({ actorName: "관리자", actorRole: "admin", actionType: "mileage_award", target: mileageTarget, description: `${mileageAmount}M 지급: ${mileageReason}` });
    setMileageReason("");
  }

  function submitReward() {
    if (!rewardForm.name) return;
    addReward({ id: "r_" + Date.now(), ...rewardForm, active: true, redemptionLimit: 2, image: "" });
    setShowRewardForm(false);
    setRewardForm({ name: "", description: "", mileageCost: 500, inventory: 10, category: "교환권" });
  }

  // Badge management removed

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition ${tab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Mileage tab */}
      {tab === "mileage" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-neutral-800">마일리지 지급/차감</h3>
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={mileageTarget} onChange={e => { setMileageTarget(e.target.value); setMileageTargetId(""); }}>
                <option value="student">개별 학생</option>
                <option value="class">반 전체</option>
                <option value="grade">학년 전체</option>
                <option value="all">전체 학생</option>
              </select>
              {mileageTarget === "student" && (
                <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={mileageTargetId} onChange={e => setMileageTargetId(e.target.value)}>
                  <option value="">학생 선택</option>
                  {students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              {mileageTarget === "class" && (
                <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={mileageTargetId} onChange={e => setMileageTargetId(e.target.value)}>
                  <option value="">반 선택</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-500">금액 (M)</label>
                <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={mileageAmount} onChange={e => setMileageAmount(+e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-neutral-500">유형</label>
                <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={mileageAmount >= 0 ? "plus" : "minus"} onChange={e => setMileageAmount(Math.abs(mileageAmount) * (e.target.value === "minus" ? -1 : 1))}>
                  <option value="plus">지급</option>
                  <option value="minus">차감</option>
                </select>
              </div>
            </div>
            <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="사유를 입력하세요" value={mileageReason} onChange={e => setMileageReason(e.target.value)} />
            <button onClick={handleAwardMileage} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">지급하기</button>
          </div>

          {/* Transaction history */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">마일리지 내역</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">전체 {allTransactions.length}건</p>
              </div>
              <button onClick={() => setIsTxOpen(prev => !prev)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600">
                {isTxOpen ? "닫기" : "내역 보기"}
              </button>
            </div>
            {isTxOpen && (
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50 border-t border-neutral-100">
                {allTransactions.length === 0 && <p className="px-4 py-6 text-center text-xs text-neutral-400">내역이 없습니다.</p>}
                {allTransactions.slice(-20).reverse().map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">{tx.studentName}</p>
                      <p className="text-[11px] text-neutral-400">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${tx.amount > 0 ? "text-indigo-600" : "text-rose-500"}`}>{tx.amount > 0 ? "+" : ""}{tx.amount}M</span>
                      <p className="text-[10px] text-neutral-400">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewards tab */}
      {tab === "rewards" && (
        <>
          <button onClick={() => setShowRewardForm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 보상 추가
          </button>

          {showRewardForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">새 보상 추가</h3>
                <button onClick={() => setShowRewardForm(false)}><X size={18} className="text-neutral-400" /></button>
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="보상 이름" value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="설명" value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-500">마일리지</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={rewardForm.mileageCost} onChange={e => setRewardForm({ ...rewardForm, mileageCost: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">재고</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={rewardForm.inventory} onChange={e => setRewardForm({ ...rewardForm, inventory: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">카테고리</label>
                  <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={rewardForm.category} onChange={e => setRewardForm({ ...rewardForm, category: e.target.value })} />
                </div>
              </div>
              <button onClick={submitReward} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">추가하기</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {rewards.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{r.name}</p>
                  <p className="text-[11px] text-neutral-400">{r.description}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">{r.mileageCost}M · 재고 {r.inventory}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                    {r.active ? "활성" : "비활성"}
                  </span>
                  <button onClick={() => updateReward(r.id, { active: !r.active })} className="text-[11px] font-bold text-indigo-600">토글</button>
                </div>
              </div>
            ))}
          </div>

          {/* Redemption approvals */}
          {redemptions.filter(r => r.status === "requested").length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
              <div className="px-4 py-3 border-b border-amber-100">
                <h3 className="text-sm font-bold text-amber-800">신청 대기 ({redemptions.filter(r => r.status === "requested").length})</h3>
              </div>
              <div className="divide-y divide-amber-100">
                {redemptions.filter(r => r.status === "requested").map(r => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">{r.studentName} → {r.rewardName}</p>
                      <p className="text-[11px] text-neutral-400">{r.mileageCost}M</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => updateRedemption(r.id, "approved")} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">승인</button>
                      <button onClick={() => updateRedemption(r.id, "cancelled")} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600">취소</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All redemptions */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800">신청 내역</h3>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-neutral-50">
              {redemptions.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm text-neutral-700">{r.studentName} · {r.rewardName}</p>
                    <p className="text-[11px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.status === "completed" ? "bg-emerald-50 text-emerald-600"
                    : r.status === "approved" ? "bg-indigo-50 text-indigo-600"
                    : r.status === "cancelled" ? "bg-rose-50 text-rose-600"
                    : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {r.status === "requested" ? "신청됨" : r.status === "approved" ? "승인됨" : r.status === "completed" ? "수령완료" : "취소됨"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Season tab */}
      {tab === "season" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-neutral-800">시즌 관리</h3>
          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-indigo-600">{season.name}</p>
            <p className="text-base font-bold text-indigo-800 mt-1">{season.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-neutral-500">시즌 이름</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.name} onChange={e => updateSeason({ name: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500">테마</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.subtitle} onChange={e => updateSeason({ subtitle: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500">시작일</label>
              <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.startDate} onChange={e => updateSeason({ startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500">종료일</label>
              <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.endDate} onChange={e => updateSeason({ endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-neutral-500">공동 목표 XP</label>
              <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.sharedGoalXp} onChange={e => updateSeason({ sharedGoalXp: +e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500">상품</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={season.sharedReward} onChange={e => updateSeason({ sharedReward: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Badges tab */}
      {tab === "badges" && (
        <>
          <p className="text-xs text-neutral-500 mb-2">배지는 시스템에서 자동으로 관리됩니다.</p>
          <div className="grid grid-cols-2 gap-2.5">
            {badges.map(b => (
              <div key={b.id} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{b.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-800 truncate">{b.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{b.description}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-neutral-500">
                    {b.levelThresholds ? `레벨: ${b.levelThresholds.join(" / ")}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stats tab */}
      {tab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "주간 출석률", value: "84%", change: "+3% 전주 대비" },
              { label: "QT 참여율", value: "72%", change: "+12% 전주 대비" },
              { label: "미션 참여", value: "62%", change: "+5% 전주 대비" },
              { label: "기도 참여", value: "45%", change: "+8% 전주 대비" },
              { label: "마일리지 지급", value: `${allTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}M`, change: "이번 달" },
              { label: "마일리지 사용", value: `${allTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}M`, change: "이번 달" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] text-neutral-400">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-neutral-800">{s.value}</p>
                <p className="mt-0.5 text-[10px] text-emerald-600">{s.change}</p>
              </div>
            ))}
          </div>

          {/* Class XP growth */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 mb-3">반별 XP</h3>
            <div className="space-y-2.5">
              {classes.sort((a: any, b: any) => b.xp - a.xp).map((c: any) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700">{c.name}</span>
                    <span className="text-neutral-500">{c.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(c.xp / 15000) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit tab - Mileage Transactions */}
      {tab === "audit" && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">마일리지 내역</h3>
            <span className="text-[11px] text-neutral-400">{allTransactions.length}건</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-neutral-50">
            {allTransactions.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">아직 마일리지 내역이 없습니다.</p>
            )}
            {allTransactions.map((tx: any) => (
              <div key={tx.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">
                      {tx.studentName?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate">{tx.studentName}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{tx.description} · {tx.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}M
                    </p>
                    <p className="text-[10px] text-neutral-400">{tx.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-neutral-800">기본 마일리지 설정</h3>
            {[
              { key: "defaultAttendanceMileage", label: "기본 출석 마일리지", icon: "📅" },
              { key: "defaultQTMileage", label: "기본 QT 마일리지", icon: "📖" },
              { key: "prayerMileage", label: "기도 참여 마일리지", icon: "🙏" },
              { key: "weeklyMissionReward", label: "주간 미션 기본 보상", icon: "🎯" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{item.icon} {item.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-right"
                    value={(settings as any)[item.key]}
                    onChange={e => updateSettings({ [item.key]: +e.target.value })}
                  />
                  <span className="text-xs text-neutral-400">M</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-neutral-800">앱 설정</h3>
            {[
              { key: "anonymousPrayerEnabled", label: "익명 기도 활성화" },
              { key: "mileageShopEnabled", label: "마일리지 상점 활성화" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{item.label}</span>
                <button onClick={() => updateSettings({ [item.key]: !(settings as any)[item.key] })} className={`relative h-6 w-11 rounded-full transition ${(settings as any)[item.key] ? "bg-indigo-500" : "bg-neutral-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${(settings as any)[item.key] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-rose-800 mb-2">데이터 초기화</h3>
            <p className="text-xs text-rose-600 mb-3">모든 관리자 데이터를 샘플 데이터로 초기화합니다. 이 작업은 되돌릴 수 없습니다.</p>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.confirm("정말로 모든 데이터를 초기화하시겠습니까?")) {
                  resetToSeedData();
                }
              }}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCw size={14} className="inline mr-1" /> 샘플 데이터 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
