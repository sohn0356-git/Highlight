"use client";
import { useState } from "react";
import { MessageCirclePlus, HandHeart } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import PrayerCard from "@/components/PrayerCard";
import { useApp } from "@/lib/store-context";
import { mockData } from "@/lib/data";

export default function WeContent() {
  const { student, isLoggedIn, prayers, prayFor, addPrayerRequest, updatePrayerRequest, deletePrayerRequest, todayPrayerCount } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!student || !isLoggedIn) return null;

  const nameMap: Record<string, string> = Object.fromEntries(
    mockData.students.map(s => [s.id, s.name])
  );

  const canPost = todayPrayerCount < 1;

  const handleAdd = () => {
    if (!content.trim() || !canPost) return;
    addPrayerRequest(content.trim(), anonymous);
    setContent("");
    setAnonymous(false);
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    if (!editContent.trim()) return;
    updatePrayerRequest(id, editContent.trim());
    setEditId(null);
    setEditContent("");
  };

  const handleDelete = (id: string) => {
    deletePrayerRequest(id);
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
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition"
            >
              <MessageCirclePlus size={14} /> 기도제목 남기기
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-neutral-400">오늘은 이미 남겼어요</span>
          )}
        </div>

        {showForm && (
          <Card className="mt-3 !p-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              placeholder="기도제목을 적어주세요…"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-rose-400 resize-none"
            />
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
              onPray={() => prayFor(p.id)}
              nameMap={nameMap}
              isOwner={p.studentId === student.id}
              isEditing={editId === p.id}
              editContent={editContent}
              onStartEdit={() => { setEditId(p.id); setEditContent(p.content); }}
              onCancelEdit={() => { setEditId(null); setEditContent(""); }}
              onSaveEdit={() => handleEdit(p.id)}
              onDelete={() => handleDelete(p.id)}
              onEditContentChange={setEditContent}
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
