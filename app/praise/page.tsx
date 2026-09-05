"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Award, MessageCirclePlus, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { useApp } from "@/lib/store-context";
import { koreaDate } from "@/lib/korea-date";

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

export default function PraiseContent() {
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
  const PAGE_SIZE = 5;

  const [allTargets, setAllTargets] = useState<any[]>([]);

  const loadPraises = useCallback(async () => {
    setLoading(true);
    const { getSupabase } = await import("@/lib/supabase");
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("praises").select("*").order("created_at", { ascending: false }).limit(50);
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
    }
    setLoading(false);
  }, [student?.id]);

  useEffect(() => { if (isLoggedIn) loadPraises(); }, [isLoggedIn, loadPraises]);

  if (!student || !isLoggedIn) return null;

  const classmates = allTargets;
  const filtered = useMemo(() => {
    if (!search) return classmates;
    return classmates.filter((c: any) => c.name.includes(search));
  }, [classmates, search]);

  const handleSubmit = async () => {
    if (!praisedId || !reason.trim() || hasPraisedToday || submitting) return;
    const praised = allTargets.find((c: any) => c.id === praisedId);
    if (!praised) return;
    const { getSupabase } = await import("@/lib/supabase");
    const sb = getSupabase();
    if (!sb) return;

    setSubmitting(true);
    const today = koreaDate();
    try {
      // Insert praise record (date 컬럼으로 하루 1회 DB 제한)
      const { error: insertError } = await sb.from("praises").insert([{
        id: `praise_${Date.now()}`,
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
      const praisedMileage = (praised.mileage || 0) + 10;
      await sb.from("students").update({ mileage: praisedMileage }).eq("id", praisedId);
      const myMileage = (student.mileage || 0) + 5;
      await sb.from("students").update({ mileage: myMileage }).eq("id", student.id);

      // Add transactions (실제 mileage_transactions 스키마 컬럼만 사용)
      await sb.from("mileage_transactions").insert([
        { id: `tx_${Date.now()}_p`, student_id: praisedId, type: "칭찬", description: `${student.name}에게 칭찬받음`, amount: 10, date: today },
        { id: `tx_${Date.now()}_s`, student_id: student.id, type: "칭찬", description: `${praised.name}을 칭찬함`, amount: 5, date: today },
      ]);

      // 칭찬 일일퀘스트 (d9) 완료
      if (!dailyQuestIds.includes("d9")) {
        await completeDailyQuest("d9");
      }

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

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="칭찬" showBack subtitle="서로를 칭찬해요" right={<Award size={18} className="text-amber-400" />} />
      </div>

      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-amber-400 to-orange-400 border-0 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl">🏆</span>
            <div>
              <p className="text-lg font-extrabold">칭찬하기</p>
              <p className="text-sm text-amber-50">{praises.length}개의 칭찬</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5 pb-6">
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
                {submitting ? "등록 중..." : "등록 (+5M)"}
              </button>
            </div>
          </Card>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {praises.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(p => (
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
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">+10M</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.reason}</p>
            </Card>
          ))}
          {praises.length === 0 && (
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
      </section>
    </div>
  );
}
