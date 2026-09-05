"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageCirclePlus, HandHeart, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import PrayerCard from "@/components/PrayerCard";
import { useApp } from "@/lib/store-context";
import { fetchAllPrayerData, addPrayerComment } from "@/lib/db";
import { koreaDate } from "@/lib/korea-date";

export default function WeContent() {
  const { student, isLoggedIn, prayers, prayFor, addPrayerRequest, updatePrayerRequest, deletePrayerRequest, dailyQuestIds, completeDailyQuest } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [participantsMap, setParticipantsMap] = useState<Record<string, any[]>>({});
  const [prayedTodayMap, setPrayedTodayMap] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [myFilter, setMyFilter] = useState<"all" | "mine">("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  if (!student || !isLoggedIn) return null;

  // 필터링된 기도 목록
  const filteredPrayers = prayers.filter((p: any) => {
    // 내 글 필터
    if (myFilter === "mine" && p.studentId !== student.id) return false;
    // 제목(내용) 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (p.content || "").toLowerCase().includes(q);
    }
    return true;
  });

  const fetchAllData = useCallback(async () => {
    const today = koreaDate();
    const prayerIds = prayers.map((p: any) => p.id);
    const { commentsMap, participantsMap, prayedTodayMap } = await fetchAllPrayerData(prayerIds, student!.id, today);
    setCommentsMap(commentsMap);
    setParticipantsMap(participantsMap);
    setPrayedTodayMap(prayedTodayMap);
    setDataLoaded(true);
  }, [prayers, student?.id]);

  useEffect(() => {
    if (prayers.length) {
      setPage(0);
      setDataLoaded(false);
      fetchAllData();
    }
  }, [prayers.length, fetchAllData]);

  const handleAddComment = async (prayerId: string, text: string) => {
    await addPrayerComment({ prayerId, studentId: student!.id, studentName: student!.name, content: text });
    fetchAllData();
  };

  const handleAdd = async () => {
    if (!content.trim()) return;
    // 로컬에 즉시 추가 (전체 리패치 없음)
    const optimisticPrayer = {
      id: `optimistic_${Date.now()}`, studentId: student!.id,
      authorName: anonymous ? "" : student!.name,
      anonymous, content: content.trim(),
      classId: student!.classId, createdAt: new Date().toISOString(),
      prayerCount: 0, status: "active",
    } as any;
    setContent("");
    setAnonymous(false);
    setShowForm(false);
    await addPrayerRequest(content.trim(), anonymous);
    fetchAllData(); // re-fetch after add to get real data
  };

  const handlePray = async (prayerId: string, prayerStudentId?: string) => {
    if (prayedTodayMap[prayerId]) return;
    // 낙관적 반영: 버튼 즉시 비활성화 (버퍼링 없음)
    setPrayedTodayMap(prev => ({ ...prev, [prayerId]: true }));
    // 로컬 참가자 목록 즉시 갱신 (전체 리패치 없음)
    setParticipantsMap(prev => ({
      ...prev,
      [prayerId]: [...(prev[prayerId] || []), { studentId: student!.id, studentName: student!.name, prayedAt: new Date().toISOString(), totalPrayerCount: 1 }],
    }));
    const ok = await prayFor(prayerId, prayerStudentId);
    // 실제로 기도 기록이 생성됐을 때만 d5 퀘스트 완료
    if (ok && !dailyQuestIds.includes("d5")) {
      completeDailyQuest("d5");
    }
    // 전체 리패치 제거: 낙관적 UI 유지, 서버와 싱크는 다음 방문 시
  };

  const handleEdit = (id: string) => {
    if (!editContent.trim()) return;
    updatePrayerRequest(id, editContent.trim());
    setEditId(null);
    setEditContent("");
  };

  const handleDelete = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    deletePrayerRequest(id);
    setDeleteConfirmId(null);
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="기도" showBack subtitle="함께 기도해요" right={<HandHeart size={18} className="text-rose-400" />} />
      </div>

      <section className="mt-5 px-5">
        <Card className="bg-gradient-to-br from-rose-400 to-pink-500 border-0 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl">🙏</span>
            <div>
              <p className="text-lg font-extrabold">기도제목</p>
              <p className="text-sm text-rose-50">{prayers.length}개의 기도제목</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">기도제목</h2>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition">
            <MessageCirclePlus size={14} /> 기도제목 남기기
          </button>
        </div>

        {showForm && (
          <div className="grid transition-[grid-template-rows] duration-200 ease-in-out" style={{ gridTemplateRows: "1fr" }}>
            <div className="overflow-hidden">
              <Card className="mt-3 !p-4">
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={2}
                  placeholder="기도제목을 적어주세요…"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-rose-400 resize-none" />
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-neutral-600">
                    <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="accent-rose-500" />
                    익명으로 남기기
                  </label>
                  <button onClick={handleAdd} className="rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white active:scale-95 transition">
                    등록
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 내 글 필터 + 검색 */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => { setMyFilter("all"); setPage(0); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${myFilter === "all" ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-500 border border-rose-200"}`}
          >
            전체
          </button>
          <button
            onClick={() => { setMyFilter("mine"); setPage(0); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${myFilter === "mine" ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-500 border border-rose-200"}`}
          >
            내 글
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="제목 검색..."
            className="flex-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-rose-400 placeholder:text-rose-300"
          />
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {!dataLoaded && filteredPrayers.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            </div>
          )}
          {dataLoaded && filteredPrayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(p => (
            <PrayerCard
              key={p.id}
              prayer={p}
              studentId={student.id}
              onPray={() => handlePray(p.id, p.studentId)}
              isOwner={p.studentId === student.id}
              isEditing={editId === p.id}
              editContent={editContent}
              onStartEdit={() => { setEditId(p.id); setEditContent(p.content); }}
              onCancelEdit={() => { setEditId(null); setEditContent(""); }}
              onSaveEdit={() => handleEdit(p.id)}
              onDelete={() => handleDelete(p.id)}
              onEditContentChange={setEditContent}
              comments={commentsMap[p.id] || []}
              onAddComment={(text) => handleAddComment(p.id, text)}
              studentName={student.name}
              participants={participantsMap[p.id] || []}
              hasPrayedToday={!!prayedTodayMap[p.id]}
            />
          ))}
          {dataLoaded && filteredPrayers.length === 0 && prayers.length > 0 && (
            <Card className="text-center">
              <p className="py-4 text-sm text-neutral-400">{searchQuery ? "검색 결과가 없어요." : "내 글이 없어요."}</p>
            </Card>
          )}
          {dataLoaded && prayers.length === 0 && (
            <Card className="text-center">
              <p className="py-4 text-sm text-neutral-400">아직 기도제목이 없어요.</p>
            </Card>
          )}
          {filteredPrayers.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg bg-rose-100/60 px-3 py-1.5 text-xs font-bold text-rose-500 disabled:opacity-40">← 이전</button>
              <span className="text-xs text-neutral-400">{page + 1}/{Math.ceil(filteredPrayers.length / PAGE_SIZE)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= filteredPrayers.length} className="rounded-lg bg-rose-100/60 px-3 py-1.5 text-xs font-bold text-rose-500 disabled:opacity-40">다음 →</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
