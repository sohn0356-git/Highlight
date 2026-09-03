"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Student, MileageTransaction, QTRecord, PrayerRequest, SharedQTPost, QTComment, Teacher, ClassRoom } from "./types";
import { koreaDate } from "./korea-date";
import * as db from "./db";
import { isSupabaseReady } from "./config";
import { showPointToast } from "@/components/PointToast";

/* ── Types ── */
interface AppState {
  student: Student | null;
  isLoggedIn: boolean;
  supabaseReady: boolean;
  login: (name: string, birthDate: string) => Promise<boolean>;
  logout: () => void;
  qtToday: any;
  isQTDoneToday: boolean;
  qtRecords: QTRecord[];
  completeQT: (remembered: string, application: string) => void;
  updateQT: (id: string, patch: Partial<QTRecord>) => void;
  deleteQT: (id: string) => void;
  sharedQTDates: string[];
  sharedTodayQT: boolean;
  shareQT: () => Promise<boolean>;
  sharedPosts: SharedQTPost[];
  addComment: (postId: string, content: string) => void;
  fetchPostComments: (postId: string) => QTComment[];
  missions: any[];
  dailyQuests: any[];
  dailyQuestIds: string[];
  completeDailyQuest: (questId: string) => void;
  completedMissionIds: string[];
  completeMission: (missionId: string) => void;
  prayers: PrayerRequest[];
  prayFor: (prayerId: string) => void;
  addPrayerRequest: (content: string, anonymous: boolean) => void;
  updatePrayerRequest: (prayerId: string, content: string) => void;
  deletePrayerRequest: (prayerId: string) => void;
  todayPrayerCount: number;
  transactions: MileageTransaction[];
  badges: any[];
  season: any;
  classes: any[];
  allStudents: any[];
  activities: any[];
  refreshActivities: () => Promise<void>;
  sharedGoal: any;
  teachers: Teacher[];
  refreshAll: () => Promise<void>;
}

type AppViewMode = "student" | "admin";
const ViewModeCtx = createContext<{ mode: AppViewMode; setMode: (m: AppViewMode) => void }>({ mode: "student", setMode: () => {} });
export function useViewMode() { return useContext(ViewModeCtx); }

const Ctx = createContext<AppState | null>(null);
export function useApp() { const ctx = useContext(Ctx); if (!ctx) throw new Error("useApp must be used inside AppProvider"); return ctx; }

/* ── Daily Quest Definitions ── */
/* ── Admin check ── */
function isAdminUser(s: Student | null): boolean {
  return s?.role === "admin" || s?.role === "teacher" || !!s?.isTeacher;
}

/* ── Daily Quest Definitions ── */
const DAILY_QUEST_DEFS = [
  { id: "d1", icon: "📖", title: "QT 완료하기", description: "오늘의 QT를 완료하세요", reward: 10 },
  { id: "d2", icon: "📤", title: "QT 공유하기", description: "QT를 친구와 공유하세요", reward: 10 },
  { id: "d3", icon: "🙏", title: "기도하기", description: "기도에 참여하세요", reward: 5 },
  { id: "d4", icon: "✅", title: "출석 체크하기", description: "출석을 체크하세요", reward: 10 },
  { id: "d5", icon: "📝", title: "기도제목 남기기", description: "기도제목을 올려보세요", reward: 10 },
  { id: "d6", icon: "💬", title: "댓글 달기", description: "QT 게시글에 댓글을 남기세요", reward: 5 },
  { id: "d7", icon: "🏆", title: "스페셜 미션 완료", description: "미션을 완료하세요", reward: 20 },
  { id: "d8", icon: "🏠", title: "홈 탭 확인", description: "홈 탭을 확인하세요", reward: 3 },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppViewMode>(() => {
    if (typeof window === "undefined") return "student";
    return (localStorage.getItem("app_view_mode") as AppViewMode) || "student";
  });
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [student, setStudent] = useState<Student | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("mileage_session");
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.name) return null;
      return s;
    } catch { return null; }
  });
  const [qtDoneToday, setQtDoneToday] = useState(false);
  const [qtRecords, setQtRecords] = useState<QTRecord[]>([]);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [txns, setTxns] = useState<MileageTransaction[]>([]);
  const [dailyQuestIds, setDailyQuestIds] = useState<string[]>([]);
  const [sharedQTDates, setSharedQTDates] = useState<string[]>([]);
  const [sharedPosts, setSharedPosts] = useState<SharedQTPost[]>([]);
  const [qtToday, setQtToday] = useState<any>({ date: koreaDate(), passage: "", verse: "", content: "" });
  const [missions, setMissions] = useState<any[]>([]);
  const [dailyQuests] = useState(DAILY_QUEST_DEFS);
  const [season, setSeason] = useState<any>({ id: "", label: "", title: "" });
  const [sharedGoal, setSharedGoal] = useState<any>({ label: "", current: 0, target: 50000, reward: "" });
  const [activities, setActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [todayPrayerCount, setTodayPrayerCount] = useState(0);
  const [qtComments, setQtComments] = useState<Record<string, QTComment[]>>({});

  const today = koreaDate();

  /* ── Refresh all data from DB ── */
  const refreshAll = useCallback(async () => {
    if (!isSupabaseReady || !student) return;
    try {
      const [q, m, cls, tch, b, sg, a, an, pr, qr] = await Promise.all([
        db.fetchTodayQT(), db.fetchMissions(), db.fetchClasses(),
        db.fetchTeachers(), db.fetchBadges(), db.fetchSharedGoal(),
        db.fetchActivities(), db.fetchAnnouncements(),
        db.fetchPrayers(), db.fetchQTRecords(student.id),
      ]);
      setQtToday(q || { date: today, passage: "", verse: "", content: "" });
      setMissions(m as any[]);
      setClasses(cls);
      setTeachers(tch as any[]);
      setBadges(b);
      setSharedGoal(sg);
      const annActivities = (an || []).map((an: any) => ({
        id: an.id, type: "notice",
        message: (an.important ? "📌 " : "") + an.title + (an.content ? " — " + an.content : ""),
        timestamp: an.createdAt || "",
      }));
      setActivities([...annActivities, ...(a || [])].slice(0, 20));
      setPrayers(pr as PrayerRequest[]);
      setQtRecords(qr as QTRecord[]);

      // Daily quests for today
      const dq = await db.fetchDailyQuests(student.id, today);
      setDailyQuestIds(dq);

      // Check QT done today
      setQtDoneToday(qr.some((r: any) => r.date === today));

      // Shared QT dates
      const posts = await db.fetchSharedPosts();
      const myShared = posts.filter((p: any) => p.student_id === student.id).map((p: any) => p.date);
      setSharedQTDates([...new Set(myShared)]);

      // Shared posts for today
      setSharedPosts(posts.filter((p: any) => p.date === today) as SharedQTPost[]);

      // Completed missions
      const cm = await db.fetchCompletedMissions(student.id);
      setCompletedMissionIds(cm.filter((c: any) => c.status === "approved" || c.status === "pending").map((c: any) => c.mission_id));

      // Transactions
      const tx = await db.fetchTransactions(student.id);
      setTxns(tx as MileageTransaction[]);

      // Today prayer count
      const pc = pr.filter((p: any) => p.studentId === student.id).length;
      setTodayPrayerCount(pc);

      // Refresh student data from DB
      const updatedStudent = await db.fetchStudentById(student.id);
      if (updatedStudent) {
        setStudent(updatedStudent);
        localStorage.setItem("mileage_session", JSON.stringify(updatedStudent));
      }
    } catch (e) { console.error("refreshAll error", e); }
  }, [student, today]);

  /* ── Mount: load data ── */
  useEffect(() => {
    if (!isSupabaseReady || !student) return;
    refreshAll();
  }, [student?.id]);

  /* ── Realtime listeners ── */
  useEffect(() => {
    if (!isSupabaseReady || !student) return;
    let channel: any;
    (async () => {
      try {
        const { getSupabase } = await import("./supabase");
        const sb = getSupabase();
        if (!sb) return;
        channel = sb.channel("store-updates")
          .on("postgres_changes", { event: "*", schema: "public", table: "students" }, (payload: any) => {
            if (payload.eventType === "UPDATE" && payload.new?.id === student.id) {
              const updated = { ...student, mileage: payload.new.mileage, xp: payload.new.xp };
              setStudent(updated);
              localStorage.setItem("mileage_session", JSON.stringify(updated));
            }
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "qt_today" }, () => { refreshAll(); })
          .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => { refreshAll(); })
          .on("postgres_changes", { event: "*", schema: "public", table: "daily_quests" }, () => { refreshAll(); })
          .on("postgres_changes", { event: "*", schema: "public", table: "prayer_requests" }, () => { refreshAll(); })
          .on("postgres_changes", { event: "*", schema: "public", table: "shared_qt_posts" }, () => { refreshAll(); })
          .subscribe();
      } catch {}
    })();
    return () => { if (channel) channel.unsubscribe?.(); };
  }, [student?.id]);

  /* ── Date change detection ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = koreaDate();
      if (now !== today && student) {
        refreshAll();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [today, student]);

  /* ── Login ── */
  const login = useCallback(async (name: string, birthDate: string): Promise<boolean> => {
    if (!isSupabaseReady) return false;
    try {
      const students = await db.fetchStudents();
      const found = students.find((s: any) => s.name === name && s.birthDate === birthDate && s.active !== false);
      if (!found) return false;
      setStudent(found as Student);
      localStorage.setItem("mileage_session", JSON.stringify(found));
      return true;
    } catch { return false; }
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    setStudent(null);
    localStorage.removeItem("mileage_session");
    localStorage.removeItem("app_view_mode");
  }, []);

  /* ── QT Complete ── */
  const completeQTHandler = useCallback(async (remembered: string, application: string) => {
    if (!student || qtDoneToday || isAdminUser(student)) return;
    const reward = 20;
    const rec = await db.completeQT(student.id, today, remembered, application, reward);
    if (!rec) return;
    setQtRecords(prev => [rec as QTRecord, ...prev]);
    setQtDoneToday(true);
    showPointToast(`+${reward}M`);
    // Mileage + XP
    await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + reward);
    await db.updateStudentField(student.id, "xp", (student.xp || 0) + reward);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "qt", description: "QT 완료", amount: reward, date: today });
    await db.addActivity("qt", `${student.name}님이 QT를 완료했습니다`);
    // Class XP
    if (student.classId) {
      const cls = classes.find(c => c.id === student.classId);
      if (cls) {
        const { getSupabase } = await import("./supabase");
        const sb = getSupabase();
        if (sb) {
          await sb.from("classes").update({ xp: (cls.xp || 0) + reward, weekly_xp: (cls.weeklyXp || 0) + reward, qt_count: (cls.qtCount || 0) + 1 }).eq("id", student.classId);
        }
      }
    }
    // Daily quest d1
    await db.completeDailyQuest(student.id, "d1", today, 10, 10);
    setDailyQuestIds(prev => [...prev, "d1"]);
    // Badge progress
    await updateBadgeProgress(student.id);
    // Refresh
    refreshAll();
  }, [student, qtDoneToday, today, classes]);

  /* ── QT Update / Delete ── */
  const updateQT = useCallback(async (id: string, patch: Partial<QTRecord>) => {
    await db.updateQTRecord(id, patch);
    setQtRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const deleteQT = useCallback(async (id: string) => {
    await db.deleteQTRecord(id);
    setQtRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  /* ── Share QT ── */
  const shareQT = useCallback(async () => {
    if (!student || sharedQTDates.includes(today) || isAdminUser(student)) return false;
    const post: any = {
      id: `qp_${Date.now()}`, studentId: student.id, studentName: student.name,
      classId: student.classId, passage: qtToday.passage, verse: qtToday.verse,
      reward: 10, date: today, commentCount: 0, likedBy: [],
    };
    await db.createSharedPost(post);
    setSharedQTDates(prev => [...prev, today]);
    showPointToast("+10M");
    await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + 10);
    await db.updateStudentField(student.id, "xp", (student.xp || 0) + 10);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "QT 공유", description: "QT 공유", amount: 10, date: today });
    await db.completeDailyQuest(student.id, "d2", today, 10, 10);
    setDailyQuestIds(prev => [...prev, "d2"]);
    refreshAll();
    return true;
  }, [student, sharedQTDates, today, qtToday]);

  /* ── Comments ── */
  const addComment = useCallback(async (postId: string, content: string) => {
    if (!student || isAdminUser(student)) return;
    const comment: any = {
      id: `qc_${Date.now()}`, postId, studentId: student.id,
      studentName: student.name, content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    await db.addComment(comment);
    const postOwner = sharedPosts.find(p => p.id === postId)?.studentId;
    if (postOwner !== student.id) {
      await db.completeDailyQuest(student.id, "d6", today, 5, 5);
      setDailyQuestIds(prev => [...prev, "d6"]);
      showPointToast("+5M");
      await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + 5);
      await db.updateStudentField(student.id, "xp", (student.xp || 0) + 5);
    }
    refreshAll();
  }, [student, sharedPosts, today]);

  const fetchPostComments = useCallback((postId: string): QTComment[] => {
    // This will be loaded via realtime or lazy fetch
    return qtComments[postId] || [];
  }, [qtComments]);

  /* ── Daily Quest Complete ── */
  const completeDailyQuest = useCallback(async (questId: string) => {
    if (!student || dailyQuestIds.includes(questId) || isAdminUser(student)) return;
    const quest = DAILY_QUEST_DEFS.find(q => q.id === questId);
    if (!quest) return;
    await db.completeDailyQuest(student.id, questId, today, quest.reward, quest.reward);
    setDailyQuestIds(prev => [...prev, questId]);
    showPointToast(`+${quest.reward}M`);
    await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + quest.reward);
    await db.updateStudentField(student.id, "xp", (student.xp || 0) + quest.reward);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "일일퀘스트", description: quest.title, amount: quest.reward, date: today });
    refreshAll();
  }, [student, dailyQuestIds, today]);

  /* ── Mission Complete ── */
  const completeMissionHandler = useCallback(async (missionId: string) => {
    if (!student || completedMissionIds.includes(missionId) || isAdminUser(student)) return;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    await db.completeMission(student.id, missionId, "pending");
    setCompletedMissionIds(prev => [...prev, missionId]);
    const reward = mission.reward || 30;
    showPointToast(`+${reward}M`);
    await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + reward);
    await db.updateStudentField(student.id, "xp", (student.xp || 0) + reward);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "미션완료", description: mission.title, amount: reward, date: today });
    refreshAll();
  }, [student, completedMissionIds, missions, today]);

  /* ── Prayer ── */
  const prayForHandler = useCallback(async (prayerId: string) => {
    if (!student || isAdminUser(student)) return;
    await db.recordPrayerParticipation(student.id, prayerId);
    const reward = 5;
    showPointToast(`+${reward}M`);
    await db.updateStudentField(student.id, "mileage", (student.mileage || 0) + reward);
    await db.updateStudentField(student.id, "xp", (student.xp || 0) + reward);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "기도", description: "기도 참여", amount: reward, date: today });
    await db.completeDailyQuest(student.id, "d3", today, 5, 5);
    setDailyQuestIds(prev => [...prev, "d3"]);
    refreshAll();
  }, [student, today]);

  const addPrayerRequest = useCallback(async (content: string, anonymous: boolean) => {
    if (!student || isAdminUser(student)) return;
    const prayer: any = {
      id: `pr_${Date.now()}`, studentId: student.id,
      authorName: anonymous ? "" : student.name,
      anonymous, content, classId: student.classId,
    };
    await db.insertPrayer(prayer);
    await db.completeDailyQuest(student.id, "d5", today, 10, 10);
    setDailyQuestIds(prev => [...prev, "d5"]);
    await db.addActivity("prayer", `${anonymous ? "익명" : student.name}님이 기도제목을 올렸습니다`);
    refreshAll();
  }, [student, today]);

  const updatePrayerRequest = useCallback(async (prayerId: string, content: string) => {
    await db.updatePrayer(prayerId, { content });
    refreshAll();
  }, []);

  const deletePrayerRequest = useCallback(async (prayerId: string) => {
    await db.deletePrayer(prayerId);
    refreshAll();
  }, []);

  const refreshActivities = useCallback(async () => {
    const a = await db.fetchActivities();
    setActivities(a);
  }, []);

  return (
    <ViewModeCtx.Provider value={{ mode, setMode: (m) => { if (typeof window !== "undefined") localStorage.setItem("app_view_mode", m); setMode(m); } }}>
    <Ctx.Provider value={{
      student, isLoggedIn: !!student, supabaseReady: isSupabaseReady,
      login, logout,
      qtToday: { ...qtToday, date: today }, isQTDoneToday: qtDoneToday,
      qtRecords, completeQT: completeQTHandler, updateQT, deleteQT,
      sharedQTDates, sharedTodayQT: sharedQTDates.includes(today),
      shareQT, sharedPosts: sharedPosts.filter(p => p.date === today),
      addComment, fetchPostComments,
      missions, dailyQuests, dailyQuestIds, completeDailyQuest,
      completedMissionIds, completeMission: completeMissionHandler,
      prayers: [...prayers].sort((a, b) => b.prayerCount - a.prayerCount),
      prayFor: prayForHandler, addPrayerRequest, updatePrayerRequest, deletePrayerRequest,
      todayPrayerCount, transactions: txns,
      badges, season, classes, allStudents, activities,
      refreshActivities, sharedGoal, teachers, refreshAll,
    }}>
      {children}
    </Ctx.Provider>
    </ViewModeCtx.Provider>
  );
}

/* ── Badge Progress Helper ── */
async function updateBadgeProgress(studentId: string) {
  try {
    const badges = await db.fetchBadges();
    for (const badge of badges) {
      const progress = await db.calculateBadgeProgress(studentId, badge.requirement_type);
      const thresholds = badge.level_thresholds || [10, 30, 60, 100, 200];
      let level = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (progress >= thresholds[i]) level = i + 1;
      }
      await db.upsertStudentBadge(studentId, badge.id, level, progress);
    }
  } catch {}
}
