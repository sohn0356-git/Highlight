"use client";
import { useState } from "react";
import { BookOpen, Target, Megaphone, HandHeart, Plus, X, ChevronDown, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import type { QTContent, MissionAdmin, Announcement, PrayerRequestAdmin } from "@/lib/admin-types";

type ContentTab = "qt" | "mission" | "announcement" | "prayer";

export default function AdminContent() {
  const { qtContents, addQTContent, updateQTContent, missions, addMission, updateMission, missionCompletions, approveMissionCompletion, rejectMissionCompletion, prayers, updatePrayerStatus, announcements, addAnnouncement, updateAnnouncement, currentUser } = useAdmin();
  const { students: adminStudents } = useAdmin();
  const [tab, setTab] = useState<ContentTab>("qt");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [qtForm, setQtForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    passage: "",
    verse: "",
    content: "",
    mileageReward: 20,
  });

  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    icon: "🎯",
    type: "weekly" as "weekly" | "special" | "event" | "class-only",
    mileageReward: 30,
    xpReward: 30,
    startDate: new Date().toISOString().slice(0, 10),
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

  const tabs: { id: ContentTab; label: string; icon: typeof BookOpen }[] = [
    { id: "qt", label: "QT", icon: BookOpen },
    { id: "mission", label: "미션", icon: Target },
    { id: "announcement", label: "공지", icon: Megaphone },
    { id: "prayer", label: "기도", icon: HandHeart },
  ];

  function submitQT() {
    if (!qtForm.title || !qtForm.passage) return;
    let newQT: QTContent;
    if (editMode && qtContents.length > 0) {
      newQT = { ...qtContents.find(q => q.id === editModeId)!, ...qtForm };
      updateQTContent(newQT.id, newQT);
    } else {
      newQT = {
        id: "qt_" + Date.now(),
        ...qtForm,
        question1: "가장 마음에 남은 말씀은?",
        question2: "오늘 어떻게 살아보고 싶나요?",
        active: true,
        status: "active",
      };
      addQTContent(newQT);
    }
    setShowForm(false);
    setEditMode(false);
    setQtForm({ date: "", title: "", passage: "", verse: "", content: "", mileageReward: 20 });
  }

  const [editModeId, setEditModeId] = useState<string | null>(null);

  function submitMission() {
    if (!missionForm.title) return;
    const newMission: MissionAdmin = {
      id: "m_" + Date.now(),
      ...missionForm,
      active: true,
    };
    addMission(newMission);
    setShowForm(false);
    setMissionForm({ title: "", description: "", icon: "🎯", type: "weekly", mileageReward: 30, xpReward: 30, startDate: new Date().toISOString().slice(0, 10), endDate: "", target: "all", approvalRequired: false });
  }

  function submitAnnouncement() {
    if (!announcementForm.title) return;
    const newAnn: Announcement = {
      id: "an_" + Date.now(),
      ...announcementForm,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${tab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* QT tab */}
      {tab === "qt" && (
        <>
          <button onClick={() => { setShowForm(true); setEditMode(false); }} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> QT 등록
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">{editMode ? "QT 수정" : "새 QT 등록"}</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-neutral-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={qtForm.date} onChange={e => setQtForm({ ...qtForm, date: e.target.value })} />
                <input className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="마일리지 보상" type="number" value={qtForm.mileageReward} onChange={e => setQtForm({ ...qtForm, mileageReward: +e.target.value })} />
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="제목" value={qtForm.title} onChange={e => setQtForm({ ...qtForm, title: e.target.value })} />
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="성경 본문 (예: 빌립보서 4:6-7)" value={qtForm.passage} onChange={e => setQtForm({ ...qtForm, passage: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="핵심 말씀" value={qtForm.verse} onChange={e => setQtForm({ ...qtForm, verse: e.target.value })} rows={2} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="묵상 글" value={qtForm.content} onChange={e => setQtForm({ ...qtForm, content: e.target.value })} rows={3} />
              <button onClick={submitQT} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">{editMode ? "수정 완료" : "등록하기"}</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {[...qtContents].sort((a, b) => b.date.localeCompare(a.date)).map(qt => (
              <div key={qt.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{qt.passage} · {qt.title}</p>
                    <p className="text-xs text-neutral-400">{qt.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${qt.status === "active" ? "bg-emerald-50 text-emerald-600" : qt.status === "scheduled" ? "bg-sky-50 text-sky-600" : "bg-neutral-100 text-neutral-500"}`}>
                      {qt.status === "active" ? "게시중" : qt.status === "scheduled" ? "예약" : "종료"}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setQtForm({ date: qt.date, title: qt.title, passage: qt.passage, verse: qt.verse, content: qt.content, mileageReward: qt.mileageReward }); setEditModeId(qt.id); setEditMode(true); setShowForm(true); }} className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500"><CheckCircle2 size={14} /></button>
                      <button onClick={() => updateQTContent(qt.id, { status: qt.status === "active" ? "ended" : "active" })} className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500">
                        {qt.status === "active" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mission tab */}
      {tab === "mission" && (
        <>
          <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
            <Plus size={16} /> 미션 생성
          </button>

          {showForm && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">새 미션 생성</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-neutral-400" /></button>
              </div>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="미션 제목" value={missionForm.title} onChange={e => setMissionForm({ ...missionForm, title: e.target.value })} />
              <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="미션 설명" value={missionForm.description} onChange={e => setMissionForm({ ...missionForm, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-3 gap-2">
                {["🎯", "🤝", "🙏", "📖", "💝", "🌱", "🚪", "🔥", "⭐"].map(icon => (
                  <button key={icon} onClick={() => setMissionForm({ ...missionForm, icon })}
                    className={`rounded-lg border py-2 text-lg ${missionForm.icon === icon ? "border-indigo-500 bg-indigo-50" : "border-neutral-200"}`}>{icon}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-500">유형</label>
                  <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.type} onChange={e => setMissionForm({ ...missionForm, type: e.target.value as any })}>
                    <option value="weekly">주간</option>
                    <option value="special">특별</option>
                    <option value="event">이벤트</option>
                    <option value="class-only">반 전용</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">대상</label>
                  <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.target} onChange={e => setMissionForm({ ...missionForm, target: e.target.value as any })}>
                    <option value="all">전체</option>
                    <option value="grade1">고1</option>
                    <option value="grade2">고2</option>
                    <option value="grade3">고3</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">마일리지</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.mileageReward} onChange={e => setMissionForm({ ...missionForm, mileageReward: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500">XP</label>
                  <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.xpReward} onChange={e => setMissionForm({ ...missionForm, xpReward: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.startDate} onChange={e => setMissionForm({ ...missionForm, startDate: e.target.value })} />
                <input type="date" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="종료일" value={missionForm.endDate} onChange={e => setMissionForm({ ...missionForm, endDate: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input type="checkbox" checked={missionForm.approvalRequired} onChange={e => setMissionForm({ ...missionForm, approvalRequired: e.target.checked })} />
                선생님 승인 필요
              </label>
              <button onClick={submitMission} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">생성하기</button>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {missions.map(m => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{m.title}</p>
                      <p className="text-[11px] text-neutral-400">{m.type === "weekly" ? "주간" : m.type === "special" ? "특별" : m.type === "event" ? "이벤트" : "반 전용"} · +{m.mileageReward}M</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.approvalRequired ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {m.approvalRequired ? "승인필요" : "자동"}
                    </span>
                    <button onClick={() => updateMission(m.id, { active: !m.active })} className={`rounded-lg px-2 py-1 text-[10px] font-bold ${m.active ? "bg-indigo-50 text-indigo-600" : "bg-neutral-100 text-neutral-400"}`}>
                      {m.active ? "게시중" : "비활성"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          {missionCompletions.filter(c => c.status === "pending").length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
              <div className="px-4 py-3 border-b border-amber-100">
                <h3 className="text-sm font-bold text-amber-800">승인 대기 미션</h3>
              </div>
              <div className="divide-y divide-amber-100">
                {missionCompletions.filter(c => c.status === "pending").map(c => {
                  const stu = adminStudents.find(s => s.id === c.studentId);
                  const mission = missions.find(m => m.id === c.missionId);
                  return (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-700">{stu?.name}</p>
                        <p className="text-[11px] text-neutral-400">{mission?.title}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => approveMissionCompletion(c.id)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">승인</button>
                        <button onClick={() => rejectMissionCompletion(c.id)} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600">반려</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Announcement tab */}
      {tab === "announcement" && (
        <>
          <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
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

      {/* Prayer tab */}
      {tab === "prayer" && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
          {prayers.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-neutral-400">
              <HandHeart size={24} />
              <p className="text-xs">아직 기도제목이 없습니다.</p>
            </div>
          )}
          {prayers.map(p => (
            <div key={p.id} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-800">{p.anonymous ? "익명" : p.authorName}</p>
                    {p.anonymous && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">익명</span>}
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-500">🙏 {p.prayerCount}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{p.content}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {p.status === "active" ? (
                    <button onClick={() => updatePrayerStatus(p.id, "hidden")} className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500"><EyeOff size={14} /></button>
                  ) : (
                    <button onClick={() => updatePrayerStatus(p.id, "active")} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600"><Eye size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
