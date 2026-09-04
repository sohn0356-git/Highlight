"use client";
import { useState } from "react";
import { MessageCircle, Share2, Pencil, Trash2 } from "lucide-react";
import Card from "./Card";
import { useApp } from "@/lib/store-context";

export default function SharedQTFeed({ limit = 20 }: { limit?: number }) {
  const { student, sharedPosts, addComment, updateComment, deleteComment, fetchPostComments } = useApp();
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  if (!sharedPosts.length) return null;

  return (
    <section className="px-5 pb-4">
      <div className="flex items-center gap-2">
        <Share2 size={16} className="text-indigo-500" />
        <h2 className="text-base font-bold text-neutral-900">친구들의 QT 공유</h2>
      </div>
      <p className="mt-1 text-xs text-neutral-500">앱 사용자들이 공유한 오늘의 말씀을 보고 응원해주세요.</p>

      <div className="mt-3 flex flex-col gap-3">
        {sharedPosts.slice(0, limit).map(post => {
          const comments = fetchPostComments(post.id);
          const isOpen = openPostId === post.id;
          return (
            <Card key={post.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                    {post.studentName?.[0]}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{post.studentName}</p>
                    <p className="text-[11px] text-neutral-400">{post.className || ""} · {post.date}{post.createdAt ? " " + new Date(post.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">공유 +{post.reward}M</span>
              </div>

              <div className="mt-3 rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-bold text-indigo-700">{post.passage}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-700">"{post.verse}"</p>
                {post.remembered && <p className="mt-2 text-xs text-neutral-500">💡 {post.remembered}</p>}
                {post.application && <p className="mt-1 text-xs text-neutral-500">🌱 {post.application}</p>}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => { setOpenPostId(isOpen ? null : post.id); setCommentText(""); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 active:scale-95 transition"
                >
                  <MessageCircle size={15} />
                  댓글 {post.commentCount}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3">
                  {comments.length > 0 && (
                    <div className="mb-3 flex flex-col gap-2">
                      {comments.map(c => (
                        <div key={c.id} className="rounded-xl bg-neutral-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] font-bold text-neutral-600">{c.studentName}</p>
                              {c.createdAt && <p className="text-[9px] text-neutral-400">{new Date(c.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>}
                            </div>
                            {c.studentId === student?.id && (
                              <div className="flex gap-1">
                                <button onClick={() => { setEditCommentId(c.id); setEditCommentText(c.content); }} className="text-neutral-400 hover:text-indigo-500"><Pencil size={11} /></button>
                                <button onClick={() => deleteComment(c.id, post.id)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={11} /></button>
                              </div>
                            )}
                          </div>
                          {editCommentId === c.id ? (
                            <div className="mt-1 flex gap-1.5">
                              <input value={editCommentText} onChange={e => setEditCommentText(e.target.value)} className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-indigo-400" />
                              <button onClick={() => { updateComment(c.id, post.id, editCommentText); setEditCommentId(null); }} className="rounded-lg bg-indigo-500 px-2 py-1 text-[10px] font-bold text-white">저장</button>
                              <button onClick={() => setEditCommentId(null)} className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-500">취소</button>
                            </div>
                          ) : (
                            <p className="mt-0.5 text-xs leading-relaxed text-neutral-700">{c.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="응원 댓글을 남겨보세요…"
                      className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => {
                        if (commentText.trim() && student) {
                          addComment(post.id, commentText);
                          setCommentText("");
                        }
                      }}
                      className="shrink-0 rounded-full bg-indigo-500 px-4 py-2 text-xs font-bold text-white active:scale-95 transition"
                    >
                      등록
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
