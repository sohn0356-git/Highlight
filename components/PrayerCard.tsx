import { useState } from "react";
import { HandHeart, ChevronDown, X, Pencil, Trash2, Check, XIcon } from "lucide-react";
import type { PrayerRequest } from "@/lib/types";

interface PrayerComment {
  id: string;
  prayerId: string;
  studentId: string;
  studentName: string;
  content: string;
  createdAt: string;
}

interface PrayerParticipant {
  studentId: string;
  studentName: string;
  prayedAt: string;
  totalPrayerCount?: number;
}

interface PrayerCardProps {
  prayer: PrayerRequest;
  studentId: string;
  onPray: () => void;
  nameMap?: Record<string, string>;
  isOwner?: boolean;
  isEditing?: boolean;
  editContent?: string;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onDelete?: () => void;
  onEditContentChange?: (v: string) => void;
  comments?: PrayerComment[];
  onAddComment?: (content: string) => void;
  studentName?: string;
  participants?: PrayerParticipant[];
  hasPrayedToday?: boolean;
}

export default function PrayerCard({
  prayer, studentId, onPray, nameMap,
  isOwner, isEditing, editContent,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, onEditContentChange,
  comments = [], onAddComment, studentName,
  participants = [], hasPrayedToday = false,
}: PrayerCardProps) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-neutral-800">
            {prayer.anonymous ? "익명" : (prayer.authorName || studentName || "익명")}
          </span>
          {prayer.createdAt && (
            <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(prayer.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isOwner && !isEditing && (
            <>
              <button onClick={onStartEdit} className="grid h-7 w-7 place-items-center rounded-full bg-neutral-50 text-neutral-400 active:bg-neutral-100 transition">
                <Pencil size={13} />
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-full bg-red-50 text-red-500 active:bg-red-100 transition">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="grid h-7 w-7 place-items-center rounded-full bg-neutral-50 text-neutral-400 active:bg-neutral-100 transition">
                    <XIcon size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="grid h-7 w-7 place-items-center rounded-full bg-neutral-50 text-neutral-400 active:bg-neutral-100 transition">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowParticipants(true)}
            className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500 transition active:scale-95"
            title="기도한 친구 보기"
          >
            🙏 {participants.length > 0 ? participants.length : (prayer.prayerCount || 0)}명
          </button>
        </div>
      </div>

      {showParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowParticipants(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">🙏 기도한 친구들</h3>
                <p className="text-[11px] text-neutral-400">총 {participants.length}명</p>
              </div>
              <button onClick={() => setShowParticipants(false)} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
              {participants.length === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-400">아직 기도한 친구가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {[...participants].sort((a, b) => (b.totalPrayerCount || 0) - (a.totalPrayerCount || 0)).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-rose-50/60 px-3 py-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                        {p.studentName?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800">{p.studentName}</p>
                        <p className="text-[10px] text-neutral-400">{new Date(p.prayedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {p.totalPrayerCount !== undefined && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">기도 {p.totalPrayerCount}회</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={e => onEditContentChange?.(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-3 text-sm outline-none focus:border-rose-400 resize-none"
          />
          <div className="mt-2 flex items-center gap-2 justify-end">
            <button onClick={onCancelEdit} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-500 active:scale-95 transition">
              취소
            </button>
            <button onClick={onSaveEdit} className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition">
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{prayer.content}</p>
      )}

      {/* Comments section */}
      <div className="mt-3">
        <button
          onClick={() => setShowComments(v => !v)}
          className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition"
        >
          💬 댓글 {comments.length > 0 ? comments.length : ""} {showComments ? "▾" : "▸"}
        </button>
        <div className="grid transition-[grid-template-rows] duration-200 ease-in-out" style={{ gridTemplateRows: showComments ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <div className="mt-2 rounded-xl bg-neutral-50 p-3 border border-neutral-100">
              {comments.length > 0 && (
                <div className="space-y-2 mb-2">
                  {comments.map(cm => (
                    <div key={cm.id} className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600">
                        {(cm.studentName || "?").slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-semibold text-neutral-700">{cm.studentName}</p>
                          {cm.createdAt && <p className="text-[9px] text-neutral-400">{new Date(cm.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>}
                        </div>
                        <p className="text-xs text-neutral-600">{cm.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && commentText.trim() && onAddComment) { onAddComment(commentText.trim()); setCommentText(""); } }}
                  placeholder="댓글을 입력하세요…"
                  className="flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => { if (commentText.trim() && onAddComment) { onAddComment(commentText.trim()); setCommentText(""); } }}
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40 active:scale-95 transition"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onPray}
        disabled={hasPrayedToday}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-[0.98] ${
          hasPrayedToday ? "bg-rose-100 text-rose-400" : "bg-rose-500 text-white active:bg-rose-600"
        }`}
      >
        <HandHeart size={14} />
        {hasPrayedToday ? "기도했어요 🙏" : isOwner ? "기도했어요 🙏" : "기도했어요 🙏 +5M"}
      </button>
    </div>
  );
}
