import { useState } from "react";
import { HandHeart, ChevronDown, X, Pencil, Trash2, Check, XIcon } from "lucide-react";
import type { PrayerRequest } from "@/lib/types";

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
}

export default function PrayerCard({
  prayer, studentId, onPray, nameMap,
  isOwner, isEditing, editContent,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, onEditContentChange,
}: PrayerCardProps) {
  const already = prayer.prayedBy.includes(studentId);
  const [showPrayed, setShowPrayed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const prayedNames = prayer.prayedBy
    .map(id => nameMap?.[id] || id)
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-neutral-800">
          {prayer.anonymous ? "익명" : prayer.authorName}
        </span>
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
            onClick={() => setShowPrayed(v => !v)}
            className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500 transition active:scale-95"
            title="기도한 친구 보기"
          >
            🙏 {prayer.prayerCount}
            <ChevronDown size={12} className={`transition-transform ${showPrayed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {showPrayed && (
        <div className="mt-3 rounded-xl bg-rose-50/60 border border-rose-100 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-600">🙏 함께 기도한 친구들</p>
            <button onClick={() => setShowPrayed(false)} className="text-rose-300 hover:text-rose-500"><X size={14} /></button>
          </div>
          {prayedNames.length === 0 ? (
            <p className="mt-1.5 text-xs text-rose-400">아직 기도한 친구가 없어요.</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {prayedNames.map((name, i) => (
                <span key={i} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 shadow-sm">
                  {name}
                </span>
              ))}
            </div>
          )}
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

      <button
        onClick={onPray}
        disabled={already}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-[0.98] ${
          already ? "bg-rose-100 text-rose-400" : "bg-rose-500 text-white active:bg-rose-600"
        }`}
      >
        <HandHeart size={14} />
        {already ? "기도했어요 🙏 (+5M)" : "기도했어요 🙏 +5M"}
      </button>
    </div>
  );
}
