"use client";
import { useState } from "react";
import { Target, Megaphone, Plus, X } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { koreaDate, addDays } from "@/lib/korea-date";
import type { MissionAdmin, Announcement } from "@/lib/admin-types";

type ContentTab = "mission" | "announcement";

export default function AdminContent() {
  const { missions, addMission, updateMission, announcements, addAnnouncement, updateAnnouncement } = useAdmin();
  const [tab, setTab] = useState<ContentTab>("mission");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    icon: "🎯",
    type: "weekly" as "weekly" | "special" | "event" | "class-only",
    reward: 10,
    target: "all" as "all" | "grade1" | "grade2" | "grade3" | "custom",
    approvalRequired: false,
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    target: "all" as "all" | "grade" | "class",
    important: false,
  });
  const [editAnnId, setEditAnnId] = useState<string | null>(null);

  const tabs: { id: ContentTab; label: string; icon: typeof Target }[] = [
    { id: "mission", label: "미션", icon: Target },
    { id: "announcement", label: "공지", icon: Megaphone },
  ];

  function submitMission() {
    if (!missionForm.title) return;
    if (editId) {
      updateMission(editId, { ...missionForm });
      setEditId(null);
    } else {
      const newMission: MissionAdmin = {
        id: "m_" + Date.now(),
        ...missionForm,
        active: true,
      };
      addMission(newMission);
    }
    setShowForm(false);
    setMissionForm({ title: "", description: "", icon: "🎯", type: "weekly", reward: 10, target: "all", approvalRequired: false });
  }

  function startEditMission(m: any) {
    setEditId(m.id);
    setMissionForm({
      title: m.title || "",
      description: m.description || "",
      icon: m.icon || "🎯",
      type: m.type || "weekly",
      reward: m.reward || 10,
      target: m.target || "all",
      approvalRequired: m.approvalRequired || false,
    });
    setShowForm(true);
  }

  function deleteMission(id: string) {
    if (!confirm("이 미션을 삭제하시겠습니까?")) return;
    updateMission(id, { active: false });
  }

  function submitAnnouncement() {
    if (!announcementForm.title) return;
    if (editAnnId) {
      updateAnnouncement(editAnnId, { ...announcementForm });
      setEditAnnId(null);
    } else {
      const newAnn: Announcement = {
        id: "an_" + Date.now(),
        ...announcementForm,
        startDate: koreaDate(),
        endDate: addDays(koreaDate(), 30),
        status: "published",
        createdAt: new Date().toISOString(),
      };
      addAnnouncement(newAnn);
    }
    setShowForm(false);
    setAnnouncementForm({ title: "", content: "", target: "all", important: false });
  }

  function startEditAnnouncement(a: any) {
    setEditAnnId(a.id);
    setAnnouncementForm({ title: a.title || "", content: a.content || "", target: a.target || "all", important: a.important || false });
    setShowForm(true);
  }

  function deleteAnnouncement(id: string) {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    updateAnnouncement(id, { status: "ended" });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${tab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Mission tab */}
      {tab === "mission" && (
        <>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 미션 등록
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">{editId ? "미션 수정" : "새 미션 등록"}</h3>
                <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} className="text-neutral-400" /></button>
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="미션 제목" value={missionForm.title} onChange={e => setMissionForm({ ...missionForm, title: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="미션 설명" value={missionForm.description} onChange={e => setMissionForm({ ...missionForm, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.type} onChange={e => setMissionForm({ ...missionForm, type: e.target.value as any })}>
                  <option value="weekly">주간</option>
                  <option value="special">스페셜</option>
                  <option value="event">이벤트</option>
                  <option value="class-only">반별</option>
                </select>
                <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.target} onChange={e => setMissionForm({ ...missionForm, target: e.target.value as any })}>
                  <option value="all">전체</option>
                  <option value="grade1">고1</option>
                  <option value="grade2">고2</option>
                  <option value="grade3">고3</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-500">마일리지 보상</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.reward} onChange={e => setMissionForm({ ...missionForm, reward: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">XP 보상</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"  />
                </div>
              </div>

              <button onClick={submitMission} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">{editId ? "수정 완료" : "등록하기"}</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {missions.length === 0 && <p className="py-8 text-center text-xs text-neutral-400">등록된 미션이 없습니다.</p>}
            {missions.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{m.title}</p>
                  <p className="text-[11px] text-neutral-400">{m.type === "weekly" ? "주간" : m.type === "special" ? "스페셜" : m.type === "event" ? "이벤트" : "반별"} · {m.reward}M</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                  {m.active ? "활성" : "비활성"}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => startEditMission(m)} className="rounded-lg bg-neutral-100 px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:bg-neutral-200">수정</button>
                  <button onClick={() => deleteMission(m.id)} className="rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-100">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Announcement tab */}
      {tab === "announcement" && (
        <>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 공지 작성
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">{editAnnId ? "공지 수정" : "새 공지 작성"}</h3>
                <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} className="text-neutral-400" /></button>
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="제목" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="공지 내용" value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={4} />

              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input type="checkbox" checked={announcementForm.important} onChange={e => setAnnouncementForm({ ...announcementForm, important: e.target.checked })} />
                중요 공지로 표시
              </label>
              <button onClick={submitAnnouncement} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">{editAnnId ? "수정하기" : "작성하기"}</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {announcements.length === 0 && <p className="py-8 text-center text-xs text-neutral-400">등록된 공지가 없습니다.</p>}
            {announcements.map(a => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.important && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">중요</span>}
                      <p className="truncate text-sm font-semibold text-neutral-800">{a.title}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{a.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status === "published" ? "bg-emerald-50 text-emerald-600" : a.status === "draft" ? "bg-neutral-100 text-neutral-500" : "bg-neutral-100 text-neutral-400"}`}>
                      {a.status === "published" ? "게시중" : a.status === "draft" ? "임시" : ""}
                    </span>
                    <button onClick={() => startEditAnnouncement(a)} className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600 hover:bg-neutral-200">수정</button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-100">삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
