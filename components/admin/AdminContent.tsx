"use client";
import { useState } from "react";
import { Gift, Megaphone, Plus, Sparkles, Target, X } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { koreaDate, addDays } from "@/lib/korea-date";
import type { MissionAdmin, Announcement } from "@/lib/admin-types";
import { createTalentDonation } from "@/lib/db";
import { TALENT_DONATION_CONFIG } from "@/lib/talent-donation-config";

type ContentTab = "mission" | "announcement" | "gift";

const probabilityRows = [
  { range: "0~999", chances: [0, 5, 10, 20, 35, 30] },
  { range: "1,000~1,999", chances: [5, 10, 15, 25, 30, 15] },
  { range: "2,000~2,999", chances: [10, 15, 25, 25, 20, 5] },
  { range: "3,000~3,999", chances: [15, 25, 30, 20, 8, 2] },
  { range: "4,000~5,999", chances: [25, 35, 25, 10, 4, 1] },
  { range: "6,000~7,999", chances: [40, 40, 15, 4, 1, 0] },
  { range: "8,000~9,999", chances: [55, 35, 8, 2, 0, 0] },
  { range: "10,000 이상", chances: [70, 25, 4, 1, 0, 0] },
];

export default function AdminContent() {
  const { currentUser, students, missions, addMission, updateMission, announcements, addAnnouncement, updateAnnouncement, awardGiftDraw } = useAdmin();
  const [tab, setTab] = useState<ContentTab>("mission");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [giftOpening, setGiftOpening] = useState(false);
  const [giftResult, setGiftResult] = useState<{ amount: number; before: number; after: number } | null>(null);
  const [testSenderId, setTestSenderId] = useState("");
  const [testRecipientId, setTestRecipientId] = useState("");
  const [testGiftAmount, setTestGiftAmount] = useState("100");
  const [testGiftMessage, setTestGiftMessage] = useState("관리자 테스트 선물입니다.");
  const [testGiftSending, setTestGiftSending] = useState(false);
  const [testGiftResult, setTestGiftResult] = useState<string>("");
  const [testGiftError, setTestGiftError] = useState("");

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
    { id: "gift", label: "뽑기", icon: Gift },
  ];

  const currentMileage = students.find(s => s.id === currentUser?.id)?.mileage ?? 0;

  async function openGift() {
    if (giftOpening) return;
    setGiftResult(null);
    setGiftOpening(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    const result = await awardGiftDraw();
    setGiftResult(result);
    setGiftOpening(false);
  }

  async function sendTestGift() {
    const amount = Number(testGiftAmount);
    if (!testSenderId || !testRecipientId || !Number.isInteger(amount)) return;
    setTestGiftSending(true);
    setTestGiftResult("");
    setTestGiftError("");
    try {
      const result = await createTalentDonation(testSenderId, testRecipientId, amount, testGiftMessage);
      setTestGiftResult(`${result.senderName} → ${result.recipientName} ${result.donationAmount.toLocaleString()}D 선물을 생성했습니다.`);
    } catch (e: any) {
      setTestGiftError(e?.message || "테스트 선물 생성에 실패했습니다.");
    } finally {
      setTestGiftSending(false);
    }
  }

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
          <button onClick={() => { setShowForm(!showForm); setEditId(null); if (!showForm) setMissionForm({ title: "", description: "", icon: "🎯", type: "weekly", reward: 10, target: "all", approvalRequired: false }); }} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-bold text-indigo-600">
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
              <div>
                <label className="text-[11px] text-neutral-500">획득 포인트 (D)</label>
                <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={missionForm.reward} onChange={e => setMissionForm({ ...missionForm, reward: Number(e.target.value) })} />
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
                  <p className="text-[11px] text-neutral-400">{m.type === "weekly" ? "주간" : m.type === "special" ? "스페셜" : m.type === "event" ? "이벤트" : "반별"} · {m.reward}D</p>
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

      {/* Gift draw tab */}
      {tab === "gift" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">테스트 선물 보내기</h3>
                <p className="mt-0.5 text-[11px] text-neutral-400">받은 선물함 열람과 랜덤 지급을 테스트합니다.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">실제 차감</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="text-[11px] font-bold text-neutral-500">
                보낸 사람
                <select
                  value={testSenderId}
                  onChange={e => setTestSenderId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
                >
                  <option value="">선택</option>
                  {students.filter(s => s.active !== false).map(s => (
                    <option key={s.id} value={s.id}>{s.name} · {s.mileage.toLocaleString()}D</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-bold text-neutral-500">
                받는 사람
                <select
                  value={testRecipientId}
                  onChange={e => setTestRecipientId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
                >
                  <option value="">선택</option>
                  {students.filter(s => s.active !== false && s.id !== testSenderId).map(s => (
                    <option key={s.id} value={s.id}>{s.name} · {s.mileage.toLocaleString()}D</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500">기부할 달란트</label>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">{Number(testGiftAmount).toLocaleString()}D</span>
              </div>
              <div className="mt-2 rounded-2xl bg-neutral-50 px-3 py-4">
                <input
                  type="range"
                  min={TALENT_DONATION_CONFIG.minDonation}
                  max={TALENT_DONATION_CONFIG.maxDonation}
                  step={10}
                  value={testGiftAmount}
                  onChange={e => setTestGiftAmount(e.target.value)}
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-amber-500"
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>10D</span>
                  <span>50D</span>
                  <span>100D</span>
                </div>
              </div>
            </div>
            <textarea
              value={testGiftMessage}
              maxLength={160}
              onChange={e => setTestGiftMessage(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="선물 메시지"
            />
            {testGiftError && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{testGiftError}</p>}
            {testGiftResult && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{testGiftResult}</p>}
            <button
              onClick={sendTestGift}
              disabled={!testSenderId || !testRecipientId || testGiftSending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white disabled:bg-neutral-300"
            >
              <Gift size={16} />
              {testGiftSending ? "생성 중..." : "테스트 선물 보내기"}
            </button>
          </section>

          <section className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 shadow-sm">
            <div className="relative px-5 py-6 text-center">
              <div className={`mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-amber-400 text-white shadow-lg shadow-amber-200 transition ${giftOpening ? "gift-shake" : ""}`}>
                <Gift size={44} strokeWidth={2.3} />
              </div>
              {giftOpening && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="gift-sparkle grid h-32 w-32 place-items-center rounded-full bg-amber-300/20">
                    <Sparkles size={52} className="text-amber-500" />
                  </div>
                </div>
              )}
              <div className="mt-4">
                <p className="text-xs font-semibold text-neutral-500">현재 달란트</p>
                <p className="text-2xl font-black text-neutral-900">{(giftResult?.after ?? currentMileage).toLocaleString()}D</p>
              </div>
              <button
                onClick={openGift}
                disabled={giftOpening || !currentUser}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <Gift size={17} />
                {giftOpening ? "선물 여는 중..." : "친구 선물 열기"}
              </button>
              {giftResult && (
                <div className="gift-pop mt-4 rounded-xl border border-amber-200 bg-white/90 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-600">선물 획득</p>
                  <p className="mt-1 text-3xl font-black text-neutral-900">+{giftResult.amount.toLocaleString()}D</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {giftResult.before.toLocaleString()}D → {giftResult.after.toLocaleString()}D
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-4 py-3">
              <h3 className="text-sm font-bold text-neutral-800">달란트 확률표</h3>
              <p className="mt-0.5 text-[11px] text-neutral-400">선물을 열기 전 보유 달란트 기준으로 적용됩니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-neutral-50 text-[11px] text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-bold">현재 포인트</th>
                    {["50%", "100%", "200%", "300%", "500%", "1000%"].map(label => (
                      <th key={label} className="px-3 py-2 text-right font-bold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {probabilityRows.map(row => (
                    <tr key={row.range} className="text-neutral-700">
                      <td className="whitespace-nowrap px-3 py-2 font-semibold">{row.range}</td>
                      {row.chances.map((chance, index) => (
                        <td key={`${row.range}-${index}`} className="px-3 py-2 text-right">{chance}%</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
