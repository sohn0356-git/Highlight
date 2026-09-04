"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageCirclePlus, HandHeart, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import PrayerCard from "@/components/PrayerCard";
import { useApp } from "@/lib/store-context";
import { fetchPrayerComments, addPrayerComment, fetchPrayerParticipants } from "@/lib/db";

export default function WeContent() {
  const { student, isLoggedIn, prayers, prayFor, addPrayerRequest, updatePrayerRequest, deletePrayerRequest, todayPrayerCount, dailyQuestIds, completeDailyQuest } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [participantsMap, setParticipantsMap] = useState<Record<string, any[]>>({});
  const [prayedTodayMap, setPrayedTodayMap] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!student || !isLoggedIn) return null;

  const fetchAllData = useCallback(async () => {
    const cmap: Record<string, any[]> = {};
    const pmap: Record<string, any[]> = {};
    const tmap: Record<string, boolean> = {};
    for (const p of prayers) {
      try { cmap[p.id] = await fetchPrayerComments(p.id); } catch { cmap[p.id] = []; }
      try {
        const participants = await fetchPrayerParticipants(p.id);
        // Sort by prayer count descending (each participant prayed once, so sort by prayed_at)
        pmap[p.id] = participants;
        tmap[p.id] = participants.some((pp: any) => pp.studentId === student?.id);
      } catch { pmap[p.id] = []; tmap[p.id] = false; }
    }
    setCommentsMap(cmap);
    setParticipantsMap(pmap);
    setPrayedTodayMap(tmap);
  }, [prayers, student?.id]);

  useEffect(() => { if (prayers.length) fetchAllData(); }, [prayers.length, fetchAllData]);

  const handleAddComment = async (prayerId: string, text: string) => {
    await addPrayerComment({ prayerId, studentId: student!.id, studentName: student!.name, content: text });
    fetchAllData();
  };

  const canPost = todayPrayerCount < 1;

  const handleAdd = () => {
    if (!content.trim() || !canPost) return;
    addPrayerRequest(content.trim(), anonymous);
    setContent("");
    setAnonymous(false);
    setShowForm(false);
  };

  const handlePray = async (prayerId: string, prayerStudentId?: string) => {
    if (prayedTodayMap[prayerId]) return;
    await prayFor(prayerId, prayerStudentId);
    // Complete daily quest d5 (기도해주기) if not already done
    if (!dailyQuestIds.includes("d5")) {
      await completeDailyQuest("d5");
    }
    fetchAllData();
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
          {canPost ? (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition">
              <MessageCirclePlus size={14} /> 기도제목 남기기
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-neutral-400">오늘은 이미 남겼어요</span>
          )}
        </div>

        {showForm && (
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
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {prayers.map(p => (
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
          {prayers.length === 0 && (
            <Card className="text-center">
              <p className="py-4 text-sm text-neutral-400">아직 기도제목이 없어요.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
