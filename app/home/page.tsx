"use client";
import { useEffect, useState } from "react";
import { Bell, Flame, IceCream, X, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import ClassRankingCard from "@/components/ClassRankingCard";
import ActivityCard from "@/components/ActivityCard";
import { useApp } from "@/lib/store-context";
import { getStudentLevel, getNextLevelXp, fetchTopMileageRanking } from "@/lib/db";
import StoreModal from "@/components/StoreModal";

interface MileageRankingItem {
  rank: number;
  id: string;
  name: string;
  classId: string;
  mileage: number;
}

export default function HomeContent() {
  const { student, isLoggedIn, classes, activities, sharedGoal, season, dailyQuestIds, completeDailyQuest, allStudents, refreshActivities, announcements } = useApp();
  const [feedOpen, setFeedOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [mileageRanking, setMileageRanking] = useState<MileageRankingItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  useEffect(() => {
    if (isLoggedIn && !dailyQuestIds.includes("d8")) {
      completeDailyQuest("d8");
    }
  }, [isLoggedIn, dailyQuestIds, completeDailyQuest]);

  useEffect(() => {
    if (isLoggedIn) {
      setRankingLoading(true);
      fetchTopMileageRanking()
        .then(setMileageRanking)
        .catch(() => setMileageRanking([]))
        .finally(() => setRankingLoading(false));
    }
  }, [isLoggedIn]);

  if (!student || !isLoggedIn) return null;
  const myClass = classes.find(c => c.id === student.classId);
  const studentLevel = getStudentLevel(student.xp || 0);
  const nextXp = getNextLevelXp(studentLevel.level, false);

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div>
      <div className="px-5 pt-7">
        <p className="text-xs font-bold tracking-widest text-indigo-500">{season.label}</p>
        <PageHeader
          title={season.title}
          right={
            <button
              onClick={() => setFeedOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition active:scale-95 active:bg-neutral-50"
              aria-label="고등부 소식"
            >
              <Bell size={20} />
              {activities.length > 0 && (
                <span className="absolute right-2 top-2 grid h-2.5 w-2.5 place-items-center rounded-full bg-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
            </button>
          }
        />
      </div>

      {/* Class + Student Level Card */}
      <section className="mt-2 px-5">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold">{myClass?.name}</p>
              <p className="mt-0.5 text-sm text-indigo-100">
                XP {myClass?.xp.toLocaleString()}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-amber-200">
                이번 주 +{myClass?.weeklyXp.toLocaleString()} XP
              </p>
            </div>
            <div className="text-right">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
                <Flame className="text-amber-300" size={26} />
              </div>
              <p className="mt-1 text-[10px] text-indigo-200">내 LV.{studentLevel.level}</p>
            </div>
          </div>
          {nextXp < Infinity && (
            <div className="mt-3">
              <ProgressBar value={student.xp || 0} max={nextXp} className="bg-white/20" barClassName="bg-white" />
              <p className="mt-1 text-[10px] text-indigo-200 text-right">다음 레벨까지 {nextXp - (student.xp || 0)} XP</p>
            </div>
          )}
        </Card>
      </section>

      {/* Personal Mileage + Level */}
      <section className="mt-3 px-5">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-500">내 마일리지 & 레벨</p>
              <div className="mt-1 flex items-baseline gap-3">
                <p className="text-xl font-extrabold text-amber-700">{(student.mileage || 0).toLocaleString()}<span className="text-sm font-bold text-amber-400 ml-1">M</span></p>
                <p className="text-sm font-bold text-indigo-600">LV.{studentLevel.level}</p>
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-lg">
              💎
            </div>
          </div>
        </Card>
      </section>

      {/* Mileage Card - click to open store */}
      <section className="mt-3 px-5">
        <div onClick={() => setStoreOpen(true)} role="button" tabIndex={0} className="cursor-pointer rounded-2xl">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 text-white shadow-lg shadow-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-200">내 마일리지</p>
                <p className="mt-1 text-2xl font-extrabold">{(student.mileage || 0).toLocaleString()}<span className="text-base font-bold text-purple-200 ml-1">M</span></p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl">
                <span>💎</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Top 5 Mileage Ranking */}
      <section className="mt-5 px-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-800">마일리지 랭킹 TOP 5</h2>
          </div>
          {rankingLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : mileageRanking.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-400">아직 랭킹 데이터가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {mileageRanking.map((item) => {
                const medal = getMedal(item.rank);
                const isMe = item.id === student.id;
                const cls = classes.find((c: any) => c.id === item.classId);
                return (
                  <div key={item.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isMe ? "bg-indigo-50 ring-1 ring-indigo-200" : "bg-neutral-50"
                  }`}>
                    <span className="w-7 text-center text-sm font-bold">
                      {medal || <span className="text-xs text-neutral-400">{item.rank}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-indigo-700" : "text-neutral-800"}`}>
                        {item.name} {isMe && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">나</span>}
                      </p>
                      <p className="text-[10px] text-neutral-400">{cls?.name || item.classId}</p>
                    </div>
                    <span className={`text-sm font-bold ${isMe ? "text-indigo-700" : "text-neutral-700"}`}>
                      {item.mileage.toLocaleString()}M
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-5 px-5">
        <ClassRankingCard classes={classes as any} myClassId={student.classId} students={allStudents as any} myStudentId={student.id} />
      </section>

      <section className="mt-5 px-5">
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg">📢</span>
            <h2 className="text-sm font-bold text-neutral-800">공지사항</h2>
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">등록된 공지가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 3).map((an: any) => (
                <div key={an.id} className={`rounded-lg px-3 py-2.5 ${an.important ? "bg-amber-50 border border-amber-200" : "bg-neutral-50 border border-neutral-100"}`}>
                  <div className="flex items-center gap-1.5">
                    {an.important && <span className="text-xs">📌</span>}
                    <p className="text-sm font-semibold text-neutral-800 truncate">{an.title}</p>
                  </div>
                  {an.content && <p className="mt-1 text-[11px] text-neutral-500 line-clamp-2">{an.content}</p>}
                  <p className="mt-1 text-[10px] text-neutral-400">{an.createdAt?.slice(0, 10) || ""}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <div className="h-6" />

      {feedOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setFeedOpen(false)}>
          <div
            className="max-h-[75vh] w-full max-w-md mx-auto overflow-y-auto rounded-t-3xl bg-neutral-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <h2 className="text-lg font-bold text-neutral-900">고등부 소식</h2>
              </div>
              <button
                onClick={() => setFeedOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-neutral-600 active:bg-neutral-300"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
            </div>
          </div>
        </div>
      )}
      <StoreModal open={storeOpen} onClose={() => setStoreOpen(false)} />
    </div>
  );
}
