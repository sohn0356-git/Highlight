"use client";
import { useState } from "react";
import { MessageCirclePlus, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StatCard from "@/components/StatCard";
import PrayerCard from "@/components/PrayerCard";
import { useApp } from "@/lib/store-context";

export default function WeContent() {
  const { student, isLoggedIn, classes, prayers, prayFor, addPrayerRequest } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  if (!student || !isLoggedIn) return null;

  const myClass = classes.find(c => c.id === student.classId) as any;
  const nextLevelXp = 15000;

  const handleAdd = () => {
    if (!content.trim()) return;
    addPrayerRequest(content.trim(), anonymous);
    setContent("");
    setAnonymous(false);
    setShowForm(false);
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <PageHeader title="우리 반" subtitle="서로를 위해, 함께 걸어요" right={<Users size={18} className="text-indigo-400" />} />
      </div>

      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-amber-400 to-orange-400 border-0 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold">{myClass.name}</p>
              <p className="mt-1 text-sm text-amber-50">LV.{myClass.level}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold">{myClass.xp?.toLocaleString()} XP</p>
              <p className="text-xs text-amber-50">다음 레벨까지</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={myClass.xp} max={nextLevelXp} className="bg-white/30" barClassName="bg-white" />
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="출석" value={`${myClass.attendance?.attended} / ${myClass.attendance?.total}`} tone="emerald" icon={<span>⛪</span>} />
          <StatCard label="QT" value={`${myClass.qtCount}회`} tone="indigo" icon={<span>📖</span>} />
          <StatCard label="미션" value={`${myClass.missionCount}회`} tone="amber" icon={<span>🎯</span>} />
          <StatCard label="기도" value={`${myClass.prayerCount}회`} tone="rose" icon={<span>🙏</span>} />
        </div>
      </section>

      <section className="mt-5 px-5">
        <Card className="bg-indigo-50/60 border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-800">반 선생님 메시지</h3>
          <p className="mt-1.5 text-sm text-indigo-700">{myClass.classMessage}</p>
        </Card>
      </section>

      <section className="mt-5 px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">기도제목</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition"
          >
            <MessageCirclePlus size={14} /> 기도제목 남기기
          </button>
        </div>

        {showForm && (
          <Card className="mt-3 !p-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              placeholder="기도제목을 적어주세요…"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="accent-indigo-500" />
                익명으로 남기기
              </label>
              <button onClick={handleAdd} className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-bold text-white active:scale-95 transition">
                등록
              </button>
            </div>
          </Card>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {prayers.map(p => (
            <PrayerCard key={p.id} prayer={p} studentId={student.id} onPray={() => prayFor(p.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
