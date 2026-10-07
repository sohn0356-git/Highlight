"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Gift, Mailbox, MessageCirclePlus, Send, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import AppShell from "@/components/AppShell";
import { useApp } from "@/lib/store-context";
import { formatKoreaDateTime, koreaDate } from "@/lib/korea-date";
import {
  createRandomTalentDonation,
  fetchReceivedTalentDonations,
  fetchTalentDonationHistory,
  fetchTalentDonationStatus,
  insertNotification,
  openTalentDonation,
  recalculateBadgeProgress,
  sendPushForNotification,
} from "@/lib/db";
import { TALENT_DONATION_CONFIG, validateTalentDonationConfig } from "@/lib/talent-donation-config";
import type { TalentDonationHistory, TalentDonationResult, TalentDonationStatus } from "@/lib/types";

interface PraiseRecord {
  id: string;
  praiser_id: string;
  praiser_name: string;
  praised_id: string;
  praised_name: string;
  reason: string;
  anonymous: boolean;
  created_at: string;
}

function PraiseContentView({ embedded = false }: { embedded?: boolean } = {}) {
  const { student, isLoggedIn, allStudents, refreshAll, dailyQuestIds, completeDailyQuest } = useApp();
  const [praises, setPraises] = useState<PraiseRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [praisedId, setPraisedId] = useState("");
  const [reason, setReason] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [hasPraisedToday, setHasPraisedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"praise" | "gift">("praise");
  const [giftInfoOpen, setGiftInfoOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState("100");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftStatus, setGiftStatus] = useState<TalentDonationStatus>({ donationCountToday: 0, remainingGiftsToday: 3, giftedRecipientIds: [] });
  const [giftConfirming, setGiftConfirming] = useState(false);
  const [giftSending, setGiftSending] = useState(false);
  const [giftResult, setGiftResult] = useState<TalentDonationResult | null>(null);
  const [giftError, setGiftError] = useState("");
  const [donationHistory, setDonationHistory] = useState<TalentDonationHistory[]>([]);
  const [donationHistoryPage, setDonationHistoryPage] = useState(0);
  const [receivedGifts, setReceivedGifts] = useState<TalentDonationHistory[]>([]);
  const [openingGiftId, setOpeningGiftId] = useState("");
  const [openGiftResult, setOpenGiftResult] = useState<TalentDonationResult | null>(null);
  const PAGE_SIZE = 5;
  const DONATION_HISTORY_PAGE_SIZE = 10;

  const [allTargets, setAllTargets] = useState<any[]>([]);

  const loadPraises = useCallback(async () => {
    setLoading(true);
    const { getSupabase } = await import("@/lib/supabase");
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("praises").select("*").order("created_at", { ascending: false }).limit(500);
    if (data) setPraises(data as PraiseRecord[]);
    // Load teachers as praise targets too
    const { data: teachers } = await sb.from("teachers").select("*").eq("active", true);
    const teacherList = (teachers || []).map((t: any) => ({ id: t.id, name: t.name, classId: t.assignedClassIds?.[0] || "", mileage: 0, active: true, isTeacher: true }));
    setAllTargets([...allStudents.filter((s: any) => s.id !== student?.id && s.active !== false), ...teacherList.filter((t: any) => !allStudents.find((s: any) => s.id === t.id))]);
    // Check if already praised today (date 컬럼 기반)
    if (student) {
      const today = koreaDate();
      const { data: todayPraise } = await sb.from("praises").select("id").eq("praiser_id", student.id).eq("date", today).limit(1);
      setHasPraisedToday(!!todayPraise && todayPraise.length > 0);
      setGiftStatus(await fetchTalentDonationStatus(student.id));
      setDonationHistory(await fetchTalentDonationHistory(100));
      setReceivedGifts(await fetchReceivedTalentDonations(student.id, 50));
    }
    setLoading(false);
  }, [student?.id, allStudents]);

  useEffect(() => { validateTalentDonationConfig(); }, []);
  useEffect(() => { if (isLoggedIn) loadPraises(); }, [isLoggedIn, loadPraises]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(donationHistory.length / DONATION_HISTORY_PAGE_SIZE) - 1);
    setDonationHistoryPage(p => Math.min(p, maxPage));
  }, [donationHistory.length]);

  const classmates = allTargets;
  const filtered = useMemo(() => {
    if (!search) return classmates;
    return classmates.filter((c: any) => c.name.includes(search));
  }, [classmates, search]);
  const parsedGiftAmount = Number(giftAmount);
  const giftAmountValid = Number.isInteger(parsedGiftAmount)
    && parsedGiftAmount >= TALENT_DONATION_CONFIG.minDonation
    && parsedGiftAmount <= TALENT_DONATION_CONFIG.maxDonation;
  const donationHistoryTotalPages = Math.max(1, Math.ceil(donationHistory.length / DONATION_HISTORY_PAGE_SIZE));
  const donationHistoryPageItems = donationHistory.slice(
    donationHistoryPage * DONATION_HISTORY_PAGE_SIZE,
    (donationHistoryPage + 1) * DONATION_HISTORY_PAGE_SIZE
  );

  if (!student || !isLoggedIn) return null;

  const handleSubmit = async () => {
    if (!praisedId || !reason.trim() || hasPraisedToday || submitting) return;
    const praised = allTargets.find((c: any) => c.id === praisedId);
    if (!praised) return;
    const { getSupabase } = await import("@/lib/supabase");
    const sb = getSupabase();
    if (!sb) return;

    setSubmitting(true);
    const today = koreaDate();
    const praiseId = `praise_${Date.now()}`;
    try {
      // Insert praise record (date 컬럼으로 하루 1회 DB 제한)
      const { error: insertError } = await sb.from("praises").insert([{
        id: praiseId,
        praiser_id: student.id,
        praiser_name: student.name,
        praised_id: praisedId,
        praised_name: praised.name,
        reason: reason.trim(),
        anonymous,
        date: today,
        created_at: new Date().toISOString(),
      }]);
      if (insertError) {
        // 하루 1회 제한 위반(중복) 또는 칭찬대상 문제
        setHasPraisedToday(true);
        return;
      }

      // Award mileage: praised +10, praiser +5 (교사는 students 계정으로 지급)
      let praisedBase: number = praised.mileage || 0;
      if (praised.isTeacher) {
        // 교사에게 칭찬 시 FK 대상인 students 행 보장 (+ 기존 잔액 유지)
        const { data: st } = await sb.from("students").select("id, talents").eq("id", praisedId).limit(1);
        if (!st || !st.length) {
          await sb.from("students").insert([{
            id: praisedId, name: praised.name, birth_date: "", class_id: praised.classId || "",
            role: "teacher", is_teacher: true, active: true, grade: 0, talents: 0,
          }]);
        } else {
          praisedBase = Number(st[0].talents) || 0;
        }
      }
      const praisedMileage = praisedBase + 10;
      await sb.from("students").update({ talents: praisedMileage }).eq("id", praisedId);
      const myMileage = (student.mileage || 0) + 5;
      await sb.from("students").update({ talents: myMileage }).eq("id", student.id);

      // Add transactions (실제 mileage_transactions 스키마 컬럼만 사용)
      await sb.from("mileage_transactions").insert([
        { id: `tx_${Date.now()}_p`, student_id: praisedId, type: "칭찬", description: `${student.name}에게 칭찬받음`, amount: 10, date: today },
        { id: `tx_${Date.now()}_s`, student_id: student.id, type: "칭찬", description: `${praised.name}을 칭찬함`, amount: 5, date: today },
      ]);

      try {
        const snippet = reason.trim().slice(0, 30);
        const sender = anonymous ? "익명" : student.name;
        const notification = await insertNotification({
          userId: praisedId,
          type: "praise",
          title: "칭찬 알림",
          body: `${sender}님이 나를 칭찬했어요` + (snippet ? ` · “${snippet}”` : ""),
          relatedId: praiseId,
        });
        if (notification?.id) await sendPushForNotification(notification.id);
      } catch {}

      // 칭찬 일일퀘스트 (d9) 완료
      if (!dailyQuestIds.includes("d9")) {
        await completeDailyQuest("d9");
      }

      // 칭찬 횟수 배지 캐시 즉시 갱신
      recalculateBadgeProgress(student.id);

      setHasPraisedToday(true);
      setShowForm(false);
      setPraisedId("");
      setReason("");
      setAnonymous(false);
      refreshAll();
      loadPraises();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiftSend = async () => {
    if (!student || !giftAmountValid || giftSending) return;
    setGiftSending(true);
    setGiftError("");
    setGiftResult(null);
    try {
      const result = await createRandomTalentDonation(student.id, parsedGiftAmount, giftMessage);
      setGiftResult(result);
      setGiftConfirming(false);
      setGiftStatus({
        donationCountToday: TALENT_DONATION_CONFIG.dailyDonationLimit - (result.remainingGiftsToday ?? 0),
        remainingGiftsToday: result.remainingGiftsToday ?? 0,
        giftedRecipientIds: [...new Set([...giftStatus.giftedRecipientIds, result.recipientId])],
      });
      try {
        await insertNotification({
          userId: result.recipientId,
          type: "praise",
          title: "선물 알림",
          body: `${student.name}님이 ${result.donationAmount.toLocaleString()}달란트 선물을 보냈어요`,
          relatedId: result.donationId,
        });
      } catch {}
      setGiftAmount("100");
      setGiftMessage("");
      setDonationHistory(await fetchTalentDonationHistory(100));
      await refreshAll();
    } catch (e: any) {
      setGiftError(e?.message || "선물 보내기에 실패했어요.");
    } finally {
      setGiftSending(false);
    }
  };

  const handleOpenGift = async (donationId: string) => {
    if (!student || openingGiftId) return;
    setOpeningGiftId(donationId);
    setOpenGiftResult(null);
    setGiftError("");
    try {
      const [result] = await Promise.all([
        openTalentDonation(student.id, donationId),
        new Promise(resolve => setTimeout(resolve, 2400)),
      ]);
      setOpenGiftResult(result);
      setReceivedGifts(await fetchReceivedTalentDonations(student.id, 50));
      setDonationHistory(await fetchTalentDonationHistory(100));
      await refreshAll();
    } catch (e: any) {
      setGiftError(e?.message || "선물을 열 수 없어요.");
    } finally {
      setOpeningGiftId("");
    }
  };

  const content = (
    <div>
      <div className="px-5 pt-7">
        <PageHeader
          title="칭찬"
          showBack
          subtitle="서로를 칭찬해요"
          right={
            <button
              onClick={() => { setGiftInfoOpen(true); setOpenGiftResult(null); setGiftError(""); }}
              className="relative grid h-9 w-9 place-items-center rounded-full border border-amber-100 bg-white text-amber-500 shadow-sm transition active:scale-95 active:bg-amber-50"
              aria-label="받은 선물함"
              title="받은 선물함"
            >
              <Mailbox size={18} />
              {receivedGifts.some(g => g.status === "pending") && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          }
        />
      </div>

      {giftInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setGiftInfoOpen(false)}>
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500">
                  <Mailbox size={22} />
                </span>
                <div>
                  <p className="text-base font-extrabold text-neutral-900">받은 선물함</p>
                  <p className="mt-0.5 text-xs text-neutral-500">처음 열 때만 랜덤 달란트가 지급돼요.</p>
                </div>
              </div>
              <button
                onClick={() => { setGiftInfoOpen(false); setOpenGiftResult(null); }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {openingGiftId && (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-28 w-28 animate-pulse place-items-center rounded-[2rem] bg-amber-400 text-white shadow-xl shadow-amber-200">
                  <Gift size={48} />
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-rose-400 [animation-delay:300ms]" />
                </div>
                <p className="mt-4 text-sm font-bold text-neutral-700">선물을 여는 중...</p>
              </div>
            )}

            {!openingGiftId && openGiftResult && (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-24 w-24 animate-bounce place-items-center rounded-full bg-amber-100 text-amber-600">
                  <Gift size={38} />
                </div>
                <p className="mt-5 text-2xl font-black text-neutral-900">개봉 완료</p>
                <p className="mt-2 text-sm text-neutral-500">{openGiftResult.senderName}님의 선물을 열었어요.</p>
                <button
                  onClick={() => setOpenGiftResult(null)}
                  className="mt-6 w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white"
                >
                  완료
                </button>
              </div>
            )}

            {!openingGiftId && !openGiftResult && (
              <div className="mt-4 space-y-2.5">
                {giftError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{giftError}</p>}
                {receivedGifts.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">아직 받은 선물이 없어요.</p>
                )}
                {receivedGifts.map(gift => (
                  <div key={gift.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-neutral-800">{gift.senderName}님의 선물</p>
                        <p className="mt-1 text-xs text-neutral-500">{gift.message || "응원의 마음이 도착했어요."}</p>
                        <p className="mt-2 text-[10px] text-neutral-400">{formatKoreaDateTime(gift.createdAt)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${gift.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-neutral-200 text-neutral-500"}`}>
                        {gift.status === "pending" ? "미개봉" : "개봉"}
                      </span>
                    </div>
                    {gift.status === "pending" ? (
                      <button
                        onClick={() => handleOpenGift(gift.id)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white"
                      >
                        <Gift size={16} /> 열어보기
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-amber-400 to-orange-400 border-0 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl">🏆</span>
            <div className="flex-1">
              <p className="text-lg font-extrabold">칭찬하기</p>
              <p className="text-sm text-amber-50">{praises.length}개의 칭찬</p>
            </div>
            {loading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          </div>
        </Card>
      </section>

      <section className="mt-4 px-5">
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
          <button
            onClick={() => setActiveTab("praise")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${activeTab === "praise" ? "bg-white text-amber-600 shadow-sm" : "text-neutral-500"}`}
          >
            칭찬
          </button>
          <button
            onClick={() => setActiveTab("gift")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${activeTab === "gift" ? "bg-white text-amber-600 shadow-sm" : "text-neutral-500"}`}
          >
            선물하기
          </button>
        </div>
      </section>

      {activeTab === "praise" && <section className="mt-5 px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">칭찬 목록</h2>
          {!hasPraisedToday ? (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition"
            >
              <MessageCirclePlus size={14} /> 칭찬하기
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-neutral-400">오늘은 이미 칭찬했어요</span>
          )}
        </div>

        {showForm && (
          <Card className="mt-3 !p-4">
            <div className="mb-2">
              <label className="text-xs font-semibold text-neutral-600">칭찬할 친구</label>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPraisedId(""); }}
                placeholder={loading ? "로딩 중..." : "이름으로 검색..."} disabled={loading}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
              />
              {search && !praisedId && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-neutral-100 bg-white">
                  {filtered.slice(0, 10).map((c: any) => (
                    <button key={c.id} onClick={() => { setPraisedId(c.id); setSearch(c.name); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 transition">{c.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-neutral-600">칭찬하는 이유</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="어떤 점이 좋았나요..."
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-amber-400 resize-none" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="accent-amber-500" />
                익명으로 칭찬하기
              </label>
              <button onClick={handleSubmit}
                disabled={!praisedId || !reason.trim() || submitting}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white active:scale-95 transition disabled:opacity-40">
                {submitting ? (<span className="flex items-center gap-1.5"><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> 등록 중...</span>) : "등록 (+5D)"}
              </button>
            </div>
          </Card>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <p className="text-xs text-neutral-400">칭찬 불러오는 중...</p>
            </div>
          )}
          {!loading && praises.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(p => (
            <Card key={p.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                    {p.anonymous ? "?" : (p.praiser_name?.[0] || "?")}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">
                      {p.anonymous ? "익명" : p.praiser_name} → {p.praised_name}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(p.created_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">+10D</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.reason}</p>
            </Card>
          ))}
          {!loading && praises.length === 0 && (
            <Card className="text-center">
              <p className="py-4 text-sm text-neutral-400">아직 칭찬이 없어요. 첫 칭찬을 남겨보세요!</p>
            </Card>
          )}
          {praises.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40">← 이전</button>
              <span className="text-xs text-neutral-400">{page + 1}/{Math.ceil(praises.length / PAGE_SIZE)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= praises.length} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40">다음 →</button>
            </div>
          )}
        </div>
      </section>}

      {activeTab === "gift" && (
        <section className="mt-5 px-5 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">선물하기</h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              오늘 {giftStatus.remainingGiftsToday} / {TALENT_DONATION_CONFIG.dailyDonationLimit}
            </span>
          </div>

          <Card className="mt-3 !p-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              선물은 보낼 때 달란트가 차감되고, 받을 친구는 랜덤으로 정해져요. 친구가 편지함에서 처음 열 때 확률표에 따라 지급됩니다.
            </div>

            <div className="mt-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-600">기부할 달란트</label>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">{parsedGiftAmount || 0}D</span>
                </div>
                <div className="mt-3 rounded-2xl bg-neutral-50 px-3 py-4">
                  <input
                    type="range"
                    min={TALENT_DONATION_CONFIG.minDonation}
                    max={TALENT_DONATION_CONFIG.maxDonation}
                    step={10}
                    value={giftAmount}
                    onChange={e => setGiftAmount(e.target.value)}
                    className="h-3 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-amber-500"
                  />
                  <div className="mt-2 flex justify-between text-[10px] font-bold text-neutral-400">
                    <span>10D</span>
                    <span>50D</span>
                    <span>100D</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-bold text-neutral-600">메시지</label>
                <input
                  value={giftMessage}
                  maxLength={160}
                  onChange={e => setGiftMessage(e.target.value)}
                  placeholder="응원의 말을 적어주세요"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {giftError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{giftError}</p>}
            {giftResult && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                {giftResult.recipientName}에게 {giftResult.donationAmount.toLocaleString()}D 선물을 보냈어요. 친구가 편지함에서 열면 랜덤으로 지급됩니다.
              </p>
            )}

            {giftConfirming && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 text-center">
                <p className="text-sm font-bold leading-relaxed text-neutral-800">
                  {parsedGiftAmount.toLocaleString()} 달란트를 사용하여<br />
                  랜덤 친구에게 메시지와 선물을 보내시겠습니까?
                </p>
                <p className="mt-2 text-xs text-neutral-500">친구가 최초 열람할 때 실제 지급액이 결정됩니다.</p>
              </div>
            )}

            <button
              onClick={() => giftConfirming ? handleGiftSend() : setGiftConfirming(true)}
              disabled={!giftAmountValid || giftStatus.remainingGiftsToday <= 0 || giftSending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {giftSending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : giftConfirming ? (
                <><Send size={16} /> 확인하고 보내기</>
              ) : (
                <><Gift size={16} /> 선물 준비하기</>
              )}
            </button>
          </Card>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">선물 기록</h2>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {donationHistory.length === 0 ? (
              <Card className="text-center">
                <p className="py-4 text-sm text-neutral-400">아직 선물 기록이 없어요.</p>
              </Card>
            ) : donationHistoryPageItems.map(g => (
              <Card key={g.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-neutral-800">
                      {g.senderName} → {g.recipientName}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{g.message || "응원의 마음을 보냈어요."}</p>
                    <p className="mt-1 text-[10px] text-neutral-400">{formatKoreaDateTime(g.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      {g.donationAmount.toLocaleString()}D 기부
                    </span>
                    <p className="mt-1 text-[10px] font-semibold text-neutral-400">
                      {g.status === "opened" ? "개봉" : "미개봉"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {donationHistory.length > DONATION_HISTORY_PAGE_SIZE && (
              <div className="mt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDonationHistoryPage(p => Math.max(0, p - 1))}
                  disabled={donationHistoryPage === 0}
                  className="rounded-lg bg-amber-100/70 px-3 py-1.5 text-xs font-bold text-amber-600 disabled:opacity-40"
                >
                  ← 이전
                </button>
                <span className="text-xs text-neutral-400">{donationHistoryPage + 1}/{donationHistoryTotalPages}</span>
                <button
                  onClick={() => setDonationHistoryPage(p => Math.min(donationHistoryTotalPages - 1, p + 1))}
                  disabled={donationHistoryPage + 1 >= donationHistoryTotalPages}
                  className="rounded-lg bg-amber-100/70 px-3 py-1.5 text-xs font-bold text-amber-600 disabled:opacity-40"
                >
                  다음 →
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  return embedded ? content : <AppShell active="praise">{content}</AppShell>;
}

export default function PraiseContent() {
  return <PraiseContentView />;
}
