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

  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    icon: "🎯",
    type: "weekly" as "weekly" | "special" | "event" | "class-only",
    mileageReward: 30,
    xpReward: 30,
    startDate: koreaDate(),
    endDate: "",
    target: "all" as "all" | "grade1" | "grade2" | "grade3" | "custom",
    approvalRequired: false,
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    target: "all" as "all" | "grade" | "class",
    important: false,
  });

  const tabs: { id: ContentTab; label: string; icon: typeof Target }[] = [
    { id: "mission", label: "미션", icon: Target },
    { id: "announcement", label: "공지", icon: Megaphone },
  ];

  function submitMission() {
    if (!missionForm.title) return;
    const newMission: MissionAdmin = {
      id: "m_" + Date.now(),
      ...missionForm,
      active: true,
    };
    addMission(newMission);
    setShowForm(false);
    setMissionForm({ title: "", description: "", icon: "🎯", type: "weekly", mileageReward: 30, xpReward: 30, startDate: koreaDate(), endDate: "", target: "all", approvalRequired: false });
  }

  function submitAnnouncement() {
    if (!announcementForm.title) return;
    const newAnn: Announcement = {
      id: "an_" + Date.now(),
      ...announcementForm,
      startDate: koreaDate(),
      endDate: addDays(koreaDate(), 30),
      status: "published",
      createdAt: new Date().toISOString(),
    };
    addAnnouncement(newAnn);
    setShowForm(false);
    setAnnouncementForm({ title: "", content: "", target: "all", important: false });
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
          <button onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 미션 등록
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">새 미션 등록</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-neutral-400" /></button>
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
                <input type="number" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="마일리지" value={missionForm.mileageReward} onChange={e => setMissionForm({ ...missionForm, mileageReward: Number(e.target.value) })} />
                <input type="number" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="XP" value={missionForm.xpReward} onChange={e => setMissionForm({ ...missionForm, xpReward: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-500">시작일</label>
                  <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.startDate} onChange={e => setMissionForm({ ...missionForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">종료일</label>
                  <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.endDate} onChange={e => setMissionForm({ ...missionForm, endDate: e.target.value })} />
                </div>
              </div>
              <button onClick={submitMission} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">등록하기</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {missions.length === 0 && <p className="py-8 text-center text-xs text-neutral-400">등록된 미션이 없습니다.</p>}
            {missions.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{m.title}</p>
                  <p className="text-[11px] text-neutral-400">{m.type} · {m.target} · 마일리지 {m.mileageReward}M</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.active ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                  {m.active ? "활성" : "비활성"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Announcement tab */}
      {tab === "announcement" && (
        <>
          <button onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 공지 작성
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">새 공지 작성</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-neutral-400" /></button>
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="제목" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="공지 내용" value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={4} />
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={announcementForm.target} onChange={e => setAnnouncementForm({ ...announcementForm, target: e.target.value as any })}>
                <option value="all">전체</option>
                <option value="grade">학년</option>
                <option value="class">반</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input type="checkbox" checked={announcementForm.important} onChange={e => setAnnouncementForm({ ...announcementForm, important: e.target.checked })} />
                중요 공지로 표시
              </label>
              <button onClick={submitAnnouncement} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">작성하기</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {announcements.length === 0 && <p className="py-8 text-center text-xs text-neutral-400">등록된 공지가 없습니다.</p>}
            {announcements.map(a => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.important && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">중요</span>}
                      <p className="truncate text-sm font-semibold text-neutral-800">{a.title}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{a.content}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                    {a.status === "published" ? "게시중" : a.status === "draft" ? "임시" : "종료"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
