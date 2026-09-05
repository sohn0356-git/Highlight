"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Student, MileageTransaction, QTRecord, PrayerRequest, SharedQTPost, QTComment, Teacher, ClassRoom } from "./types";
import { koreaDate } from "./korea-date";
import * as db from "./db";
import { isSupabaseReady } from "./config";
import { showPointToast } from "@/components/PointToast";
import { runMigrations } from "./migrate";

/* ── Types ── */
interface AppState {
  student: Student | null;
  isLoggedIn: boolean;
  isLoading: boolean;
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
  shareQT: (date?: string) => Promise<boolean>;
  unshareQT: (date?: string) => Promise<boolean>;
  sharedPosts: SharedQTPost[];
  addComment: (postId: string, content: string) => void;
  updateComment: (commentId: string, postId: string, content: string) => void;
  deleteComment: (commentId: string, postId: string) => void;
  fetchPostComments: (postId: string) => QTComment[];
  missions: any[];
  dailyQuests: any[];
  dailyQuestIds: string[];
  completeDailyQuest: (questId: string) => void;
  completedMissionIds: string[];
  completeMission: (missionId: string) => void;
  prayers: PrayerRequest[];
  announcements: any[];
  prayFor: (prayerId: string, prayerStudentId?: string) => Promise<boolean>;
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
  badgeRefreshKey: number;
}

type AppViewMode = "student" | "admin";
const ViewModeCtx = createContext<{ mode: AppViewMode; setMode: (m: AppViewMode) => void }>({ mode: "student", setMode: () => {} });
export function useViewMode() { return useContext(ViewModeCtx); }

const Ctx = createContext<AppState | null>(null);
export function useApp() { const ctx = useContext(Ctx); if (!ctx) throw new Error("useApp must be used inside AppProvider"); return ctx; }

/* ── Daily Quest Definitions ── */
/* ── Admin check ── */
function isAdminUser(s: Student | null): boolean {
  // Admin can now participate in student activities
  return false;
}

/* ── Daily Quest Definitions ── */
const DAILY_QUEST_DEFS = [
  { id: "d1", icon: "📖", title: "QT 완료하기", description: "오늘의 QT를 완료하세요", reward: 10 },
  { id: "d2", icon: "📤", title: "QT 공유하기", description: "QT를 친구와 공유하세요", reward: 10 },
  { id: "d5", icon: "🙏", title: "기도해주기", description: "친구를 위해 기도해보세요", reward: 10 },
  { id: "d6", icon: "💬", title: "댓글 달기", description: "QT 게시글에 댓글을 남기세요", reward: 5 },
  { id: "d8", icon: "🏠", title: "홈 탭 확인", description: "홈 탭을 확인하세요", reward: 3 },
  { id: "d9", icon: "🏆", title: "칭찬하기", description: "친구를 칭찬해보세요", reward: 5 },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppViewMode>(() => {
    if (typeof window === "undefined") return "student";
    return (localStorage.getItem("app_view_mode") as AppViewMode) || "student";
  });
  const [isLoading, setIsLoading] = useState(true);
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [todayPrayerCount, setTodayPrayerCount] = useState(0);
  const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);
  const [qtComments, setQtComments] = useState<Record<string, QTComment[]>>({});
  const sharingRef = useRef(false);

  const today = koreaDate();

  /* ── Refresh all data from DB ── */
  const refreshAll = useCallback(async () => {
    if (!isSupabaseReady || !student) return;
    try {
      const safe = async (fn: () => Promise<any>): Promise<any> => {
        try { return await fn(); } catch { return []; }
      };
      const results = await Promise.all([
        safe(() => db.fetchTodayQT()),
        safe(() => db.fetchMissions()),
        safe(() => db.fetchClasses()),
        safe(() => db.fetchTeachers()),
        safe(() => db.fetchBadges()),
        safe(() => db.fetchSharedGoal()),
        safe(() => db.fetchActivities()),
        safe(() => db.fetchAnnouncements()),
        safe(() => db.fetchPrayers()),
        safe(() => db.fetchQTRecords(student.id)),
      ]);
      const [q, m, cls, tch, b, sg, a, an, pr, qr] = results as any[];
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
      setAnnouncements(an || []);
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

      // Shared posts
      setSharedPosts(posts as SharedQTPost[]);
      // Load comments for all shared posts
      for (const p of posts) {
        const comments = await db.fetchComments(p.id);
        setQtComments(prev => ({ ...prev, [p.id]: comments }));
      }

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

      // Load all active students for ranking
      const allStuds = await db.fetchActiveStudents();
      setAllStudents(allStuds);
    } catch (e) { console.error("refreshAll error", e); }
  }, [student, today]);

  /* ── Mount: load data ── */
  // Run migrations on first load
  useEffect(() => { runMigrations(); }, []);

  // If no student in localStorage, stop loading immediately
  useEffect(() => {
    if (!student) setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseReady || !student) {
      setIsLoading(false);
      return;
    }
    refreshAll().finally(() => setIsLoading(false));
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
          .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, () => { refreshAll(); })
          .subscribe();
      } catch {}
    })();
    return () => { if (channel) channel.unsubscribe?.(); };
  }, [student?.id]);

  /* ── Refresh on tab focus ── */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && student) {
        refreshAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [student?.id, refreshAll]);

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
      // Check teachers table first (for admin/teacher accounts)
      const teachers = await db.fetchTeachers();
      const foundTeacher = teachers.find((t: any) => t.name === name);
      if (foundTeacher) {
        const isAdmin = foundTeacher.role === "admin";
        // Try to get or create student record for teacher participation
        const allStudents = await db.fetchStudents();
        let teacherAsStudent = allStudents.find((s: any) => s.name === foundTeacher.name && s.isTeacher);
        
        // If teacher doesn't have a student record, create one
        if (!teacherAsStudent) {
          const newStudent = {
            id: foundTeacher.id,
            name: foundTeacher.name,
            birthDate: foundTeacher.birthDate || birthDate,
            classId: foundTeacher.assignedClassIds?.[0] || "",
            grade: 0,
            className: "",
            mileage: 0,
            xp: 0,
            weeklyXp: 0,
            isTeacher: true,
            role: foundTeacher.role || "teacher",
            assignedClassIds: foundTeacher.assignedClassIds || [],
            phone: "",
            guardianPhone: "",
            memo: "",
            active: true,
            enrollmentStatus: "active",
          };
          try {
            await db.upsertStudent(newStudent);
          } catch (e) {
            console.error("Failed to create teacher student record:", e);
          }
          teacherAsStudent = newStudent;
        }
        
        const sess: Student = {
          id: foundTeacher.id, name: foundTeacher.name,
          birthDate: foundTeacher.birthDate || birthDate,
          classId: teacherAsStudent.classId || "",
          grade: teacherAsStudent.grade || 0,
          className: teacherAsStudent.className || "",
          mileage: teacherAsStudent.mileage || 0,
          xp: teacherAsStudent.mileage || 0,
          weeklyXp: teacherAsStudent.weeklyXp || 0,
          isTeacher: true, role: foundTeacher.role || "teacher",
          assignedClassIds: foundTeacher.assignedClassIds || [],
          phone: "", guardianPhone: "", memo: "",
          active: foundTeacher.active !== false,
          enrollmentStatus: "active",
        };
        setStudent(sess);
        localStorage.setItem("mileage_session", JSON.stringify(sess));
        if (isAdmin) {
          setMode("admin");
          localStorage.setItem("app_view_mode", "admin");
        }
        return true;
      }

      // Check students table
      const students = await db.fetchStudents();
      const found = students.find((s: any) => {
        if (s.name !== name) return false;
        if (s.birthDate && birthDate && s.birthDate === birthDate) return true;
        if (!s.birthDate || s.birthDate === "2010-01-01") return s.name === name;
        return false;
      });
      if (!found) return false;
      setStudent(found as Student);
      localStorage.setItem("mileage_session", JSON.stringify(found));
      return true;
    } catch { return false; }
  }, [setMode]);

  /* ── Logout ── */
  const logout = useCallback(() => {
    setStudent(null);
    localStorage.removeItem("mileage_session");
    localStorage.removeItem("app_view_mode");
  }, []);

  /* ── QT Complete ── */
  const completeQTHandler = useCallback(async (remembered: string, application: string) => {
    if (!student || qtDoneToday || isAdminUser(student)) return;
    // Prevent re-completing if daily quest already done today
    if (dailyQuestIds.includes("d1")) {
      // Still save the QT record but don't award rewards
      const rec = await db.completeQT(student.id, today, remembered, application, 0);
      if (rec) {
        setQtRecords(prev => [rec as QTRecord, ...prev]);
        setQtDoneToday(true);
      }
      return;
    }
    const reward = 20;
    const rec = await db.completeQT(student.id, today, remembered, application, reward);
    if (!rec) return;
    setQtRecords(prev => [rec as QTRecord, ...prev]);
    setQtDoneToday(true);
    showPointToast(`+${reward}M`);
    // Mileage + XP
    const newTotal = (student.mileage || 0) + reward;
    await db.updateStudentField(student.id, "mileage", newTotal);
    await db.updateStudentField(student.id, "xp", newTotal);
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
    setBadgeRefreshKey(k => k + 1);
    // Refresh
    refreshAll();
  }, [student, qtDoneToday, today, classes, dailyQuestIds]);

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
  const shareQT = useCallback(async (shareDate?: string) => {
    const targetDate = shareDate || today;
    if (!student || sharedQTDates.includes(targetDate) || isAdminUser(student)) return false;
    if (sharingRef.current) return false;
    sharingRef.current = true;
    try {
      const targetRecord = qtRecords.find(r => r.date === targetDate);
      if (!targetRecord) return false;
      const post: any = {
        id: `qp_${Date.now()}`, studentId: student.id, studentName: student.name,
        classId: student.classId, passage: targetRecord.passage || qtToday.passage,
        verse: targetRecord.verse || qtToday.verse,
        remembered: targetRecord.remembered || "", application: targetRecord.application || "",
        reward: 10, date: targetDate, commentCount: 0, likedBy: [],
      };
      const ok = await db.createSharedPost(post);
      if (!ok) return false;
      setSharedQTDates(prev => [...prev, targetDate]);

      // 공유 포인트(+10M)는 하루 1회만: 오늘 날짜일 때만
      if (targetDate === today && !dailyQuestIds.includes("d2")) {
        showPointToast("+10M");
        const newTotal = (student.mileage || 0) + 10;
        await db.updateStudentField(student.id, "mileage", newTotal);
        await db.updateStudentField(student.id, "xp", newTotal);
        await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "QT 공유", description: "QT 공유", amount: 10, date: today });
        await db.completeDailyQuest(student.id, "d2", today, 10, 10);
        setDailyQuestIds(prev => [...prev, "d2"]);
      }

      setBadgeRefreshKey(k => k + 1);
      refreshAll();
      return true;
    } finally {
      sharingRef.current = false;
    }
  }, [student, sharedQTDates, dailyQuestIds, today, qtToday, qtRecords]);

  /* ── Unshare QT ── */
  const unshareQT = useCallback(async () => {
    if (!student || sharingRef.current) return false;
    sharingRef.current = true;
    try {
      const ok = await db.unshareQT(student.id, today);
      if (!ok) return false; // 공유한 내용이 없음
      // 공유 취소는 게시물 삭제만: +10M 보상은 하루 1회 지급이므로 차감하지 않음
      // 삭제 대상 공유글 id 수집 후 로컬 상태 정리
      const removedIds = sharedPosts.filter(p => p.studentId === student.id && p.date === today).map(p => p.id);
      setSharedPosts(prev => prev.filter(p => !removedIds.includes(p.id)));
      setSharedQTDates(prev => prev.filter(d => d !== today));
      if (removedIds.length) {
        setQtComments(prev => {
          const next = { ...prev };
          removedIds.forEach(id => delete next[id]);
          return next;
        });
      }
      setBadgeRefreshKey(k => k + 1);
      refreshAll();
      return true;
    } finally {
      sharingRef.current = false;
    }
  }, [student, today, sharedPosts]);

  /* ── Comments ── */
  const loadComments = useCallback(async (postId: string) => {
    const comments = await db.fetchComments(postId);
    setQtComments(prev => ({ ...prev, [postId]: comments }));
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!student) return;
    const comment: any = {
      id: `qc_${Date.now()}`, postId, studentId: student.id,
      studentName: student.name, content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    await db.addComment(comment);
    // Load comments from DB to get accurate count
    await loadComments(postId);
    // Update post comment count locally
    setSharedPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    // Award quest if commenting on others' post
    const postOwner = sharedPosts.find(p => p.id === postId)?.studentId;
    if (postOwner !== student.id) {
      await db.completeDailyQuest(student.id, "d6", today, 5, 5);
      setDailyQuestIds(prev => [...prev, "d6"]);
      showPointToast("+5M");
      const newTotal = (student.mileage || 0) + 5;
      await db.updateStudentField(student.id, "mileage", newTotal);
      await db.updateStudentField(student.id, "xp", newTotal);
      setBadgeRefreshKey(k => k + 1);
    }
  }, [student, sharedPosts, today, loadComments]);

  const updateComment = useCallback(async (commentId: string, postId: string, content: string) => {
    await db.updateComment(commentId, content);
    await loadComments(postId);
  }, [loadComments]);

  const deleteComment = useCallback(async (commentId: string, postId: string) => {
    await db.deleteComment(commentId, postId);
    await loadComments(postId);
    setSharedPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p));
  }, [loadComments]);

  const fetchPostComments = useCallback((postId: string): QTComment[] => {
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
    const newTotal = (student.mileage || 0) + quest.reward;
    await db.updateStudentField(student.id, "mileage", newTotal);
    await db.updateStudentField(student.id, "xp", newTotal);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "일일퀘스트", description: quest.title, amount: quest.reward, date: today });
    setBadgeRefreshKey(k => k + 1);
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
    const newTotal = (student.mileage || 0) + reward;
    await db.updateStudentField(student.id, "mileage", newTotal);
    await db.updateStudentField(student.id, "xp", newTotal);
    await db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "미션완료", description: mission.title, amount: reward, date: today });
    setBadgeRefreshKey(k => k + 1);
    refreshAll();
  }, [student, completedMissionIds, missions, today]);

  /* ── Prayer ── */
  const prayForHandler = useCallback(async (prayerId: string, prayerStudentId?: string): Promise<boolean> => {
    if (!student || isAdminUser(student)) return false;
    const ok = await db.recordPrayerParticipation(student.id, prayerId);
    if (!ok) return false; // 이미 오늘 이 기도제목에 기도함
    // 자기 기도제목에는 마일리지不予给
    if (prayerStudentId && prayerStudentId === student.id) {
      refreshAll();
      return true;
    }
    const reward = 5;
    showPointToast(`+${reward}M`);
    const newTotal = (student.mileage || 0) + reward;
    await Promise.all([
      db.updateStudentField(student.id, "mileage", newTotal),
      db.updateStudentField(student.id, "xp", newTotal),
      db.addTransaction({ studentId: student.id, studentName: student.name, className: student.classId, type: "기도", description: "기도 참여", amount: reward, date: today }),
    ]);
    setBadgeRefreshKey(k => k + 1);
    refreshAll();
    return true;
  }, [student, today]);

  const addPrayerRequest = useCallback(async (content: string, anonymous: boolean) => {
    if (!student || isAdminUser(student)) return;
    const prayer: any = {
      id: `pr_${Date.now()}`, studentId: student.id,
      authorName: anonymous ? "" : student.name,
      anonymous, content, classId: student.classId,
    };
    await db.insertPrayer(prayer);
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
      student, isLoggedIn: !!student, isLoading, supabaseReady: isSupabaseReady,
      login, logout,
      qtToday: { ...qtToday, date: today }, isQTDoneToday: qtDoneToday,
      qtRecords, completeQT: completeQTHandler, updateQT, deleteQT,
      sharedQTDates, sharedTodayQT: sharedQTDates.includes(today),
      shareQT, unshareQT, sharedPosts: sharedPosts,
      addComment, updateComment, deleteComment, fetchPostComments,
      missions, dailyQuests, dailyQuestIds, completeDailyQuest,
      completedMissionIds, completeMission: completeMissionHandler,
      prayers: [...prayers].sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")),
      announcements,
      prayFor: prayForHandler, addPrayerRequest, updatePrayerRequest, deletePrayerRequest,
      todayPrayerCount, transactions: txns,
      badges, season, classes, allStudents, activities,
      refreshActivities, sharedGoal, teachers, refreshAll, badgeRefreshKey,
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
      const metricType = db.getBadgeMetricType(badge.id);
      if (!metricType) continue;
      const progress = await db.calculateBadgeProgress(studentId, metricType);
      const thresholds = badge.level_thresholds || [10, 30, 60, 100, 200];
      let level = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (progress >= thresholds[i]) level = i + 1;
      }
      await db.upsertStudentBadge(studentId, badge.id, level, progress);
    }
  } catch {}
}
