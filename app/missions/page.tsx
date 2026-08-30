"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import MissionCard from "@/components/MissionCard";
import BadgeCard from "@/components/BadgeCard";
import Card from "@/components/Card";
import { useApp } from "@/lib/store-context";

export default function MissionsPage() {
  const router = useRouter();
  const { student, isLoggedIn, missions, completedMissionIds, completeMission, badges } = useApp();

  useEffect(() => { if (!isLoggedIn) router.replace("/login"); }, [isLoggedIn, router]);
  if (!student || !isLoggedIn) return null;

  const weekly = missions.filter(m => m.category === "weekly");
  const special = missions.filter(m => m.category === "special");

  return (
    <AppShell active="missions">
      <div className="px-5 pt-7">
        <PageHeader title="이번 주 미션" subtitle="미션을 완료하고 마일리지를 받으세요!" right={<Target size={18} className="text-indigo-400" />} />
      </div>

      <section className="mt-3 px-5">
        <div className="flex flex-col gap-3">
          {weekly.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              completed={completedMissionIds.includes(m.id)}
              onComplete={() => completeMission(m.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
          <span className="text-amber-500">⭐</span>
          <span>SPECIAL QUEST</span>
        </h2>
        <p className="mt-1 text-xs text-neutral-500">특별한 이벤트 미션에 도전하세요.</p>
        <div className="mt-3 flex flex-col gap-3">
          {special.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              completed={completedMissionIds.includes(m.id)}
              onComplete={() => completeMission(m.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 px-5 pb-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
          <span>🏆</span>
          <span>배지 컬렉션</span>
        </h2>
        <p className="mt-1 text-xs text-neutral-500">배지를 모아 고등부 활동을 기록하세요.</p>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {badges.map(b => <BadgeCard key={b.id} badge={b} />)}
        </div>
      </section>
    </AppShell>
  );
}
