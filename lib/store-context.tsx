"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Student, MileageTransaction, QTRecord, PrayerRequest, CompletedMission, SharedQTPost, QTComment } from "./types";
import type { Teacher } from "./types";
import { mockData } from "./data";
import { showPointToast } from "@/components/PointToast";
import {
  fetchStudents, fetchClasses, fetchMissions, fetchBadges, fetchPrayers,
  fetchTodayQT, fetchSeason, fetchSharedGoal, fetchActivities, fetchTeachers,
  fetchDailyQuests, completeDailyQuestRemote,
  fetchTransactions, fetchQTRecords, fetchCompletedMissions,
  fetchPrayerParticipants, prayForRemote,
  fetchSharedQTDates, fetchSharedPosts, createSharedPost,
  fetchComments, addCommentToPost,
  addPrayer, updatePrayerRemote, deletePrayerRemote,
} from "@/services/mileage-service";
import {
  getSession, setSession, clearSession,
  getQTRecords, addQTRecord, isQTCompletedToday,
  getCompletedMissions, completeMission,
  getPrayers, initPrayers, hasPrayed, togglePrayer,
  getTransactions, addTransaction, updateStudentMileage,
} from "./storage";
import { isSupabaseReady } from "./config";
import { updateClassXP } from "./class-xp-sync";

/* ── Supabase lazy helpers ── */
async function loadFromSupabase(table: string) {
  if (!isSupabaseReady) return null;
  try {
    const mod = await import("./supabase");
    const sb = mod.getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from(table).select("*");
    if (error || !data || !data.length) return null;
    return data;
  } catch { return null; }
}

async function upsertSupabase(table: string, row: any) {
  if (!isSupabaseReady) return;
  try {
    const mod = await import("./supabase");
    const sb = mod.getSupabase();
    if (!sb) return;
    await sb.from(table).upsert(row);
  } catch { /* ignore */ }
}

async function updateSupabase(table: string, match: Record<string, unknown>, patch: Record<string, unknown>) {
  if (!isSupabaseReady) return;
  try {
    const mod = await import("./supabase");
    const sb = mod.getSupabase();
    if (!sb) return;
    await sb.from(table).update(patch).match(match);
  } catch { /* ignore */ }
}

async function insertSupabase(table: string, row: any) {
  if (!isSupabaseReady) return;
  try {
    const mod = await import("./supabase");
    const sb = mod.getSupabase();
    if (!sb) return;
    await sb.from(table).insert([row]);
  } catch { /* ignore */ }
}

async function deleteSupabase(table: string, match: Record<string, unknown>) {
  if (!isSupabaseReady) return;
  try {
    const mod = await import("./supabase");
    const sb = mod.getSupabase();
    if (!sb) return;
    await sb.from(table).delete().match(match);
  } catch { /* ignore */ }
}

/* ── 마일리지 추가 + 반 XP 갱신 헬퍼 ── */
function addMileage(
  student: Student,
  delta: number,
  setStudent: React.Dispatch<React.SetStateAction<Student | null>>,
  setClasses: React.Dispatch<React.SetStateAction<any[]>>,
  setTxns: React.Dispatch<React.SetStateAction<MileageTransaction[]>>,
  tx: MileageTransaction,
) {
  const updated = updateStudentMileage(student.id, delta, student);
  setStudent(updated);
  addTransaction(tx);
  setTxns(prev => [...prev, tx]);
  // 반 XP 갱신
  updateClassXP(setClasses, student.classId, delta);
  // Supabase: 학생 마일리지 + 반 XP
  updateSupabase("students", { id: student.id }, { mileage: updated.mileage });
  updateSupabase("classes", { id: student.classId }, {
    xp: { raw: `xp + ${delta}` },
    weekly_xp: { raw: `weekly_xp + ${delta}` },
  }).catch(() => {});
  upsertSupabase("mileage_transactions", tx);
}

/* ── Context ── */
interface AppState {
  student: Student | null;
  isLoggedIn: boolean;
  supabaseReady: boolean;
  login: (name: string, birthDate: string) => Promise<boolean>;
  logout: () => void;
  qtToday: typeof mockData.qt_today;
  isQTDoneToday: boolean;
  qtRecords: QTRecord[];
  completeQT: (remembered: string, application: string) => void;
  sharedQTDates: string[];
  sharedTodayQT: boolean;
  shareQT: () => boolean;
  sharedPosts: SharedQTPost[];
  addComment: (postId: string, content: string) => void;
  fetchPostComments: (postId: string) => QTComment[];
  missions: typeof mockData.missions;
  dailyQuests: typeof mockData.daily_quests;
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
  badges: typeof mockData.badges;
  season: typeof mockData.season;
  classes: typeof mockData.classes;
  allStudents: typeof mockData.students;
  activities: typeof mockData.activities;
  sharedGoal: typeof mockData.shared_goal;
  teachers: Teacher[];
}

export type AppViewMode = "student" | "admin";
const ViewModeCtx = createContext<{ mode: AppViewMode; setMode: (m: AppViewMode) => void }>({
  mode: "student",
  setMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeCtx);
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppViewMode>(() => {
    if (typeof window === "undefined") return "student";
    return (localStorage.getItem("app_view_mode") as AppViewMode) || "student";
  });
  const [allStudents, setAllStudents] = useState(mockData.students);
  const [student, setStudent] = useState<Student | null>(() => {
    const s = getSession();
    if (!s) return null;
    const adminMap: Record<string, { role: string; assignedClassIds?: string[] }> = {
      "홍길동": { role: "admin", assignedClassIds: ["c1"] },
      "김선생": { role: "teacher", assignedClassIds: ["c1", "c2"] },
      "이선생": { role: "teacher", assignedClassIds: ["c3", "c4"] },
      "박선생": { role: "teacher", assignedClassIds: ["c5", "c6"] },
      "최목사": { role: "admin" },
      "관리자": { role: "admin" },
    };
    const known = adminMap[s.name];
    if (known && s.role !== known.role) {
      const fixed = { ...s, role: known.role as any, isTeacher: true, assignedClassIds: known.assignedClassIds } as Student;
      setSession(fixed);
      return fixed;
    }
    return s;
  });
  const [qtDoneToday, setQtDoneToday] = useState(() => isQTCompletedToday());
  const [qtRecords, setQtRecords] = useState<QTRecord[]>(() => getQTRecords());
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>(() =>
    getCompletedMissions().map(m => m.missionId)
  );
  const [prayers, setPrayers] = useState<PrayerRequest[]>(mockData.prayers);
  const [txns, setTxns] = useState<MileageTransaction[]>([]);
  const [dailyQuestIds, setDailyQuestIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("mileage_daily_quests");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed.ids;
      }
    } catch {}
    return [];
  });
  const [sharedQTDates, setSharedQTDates] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("mileage_shared_qt") || "[]"); }
    catch { return []; }
  });
  const [sharedPosts, setSharedPosts] = useState<SharedQTPost[]>(() => {
    if (typeof window === "undefined") return mockData.shared_posts || [];
    try {
      const local = JSON.parse(localStorage.getItem("mileage_shared_posts") || "[]");
      return [...(mockData.shared_posts || []), ...local];
    } catch { return mockData.shared_posts || []; }
  });
  const [qtComments, setQtComments] = useState<Record<string, QTComment[]>>(() => {
    if (typeof window === "undefined") return mockData.qt_comments || {};
    try {
      const local = JSON.parse(localStorage.getItem("mileage_qt_comments") || "{}");
      return { ...(mockData.qt_comments || {}), ...local };
    } catch { return mockData.qt_comments || {}; }
  });
  const [qtToday, setQtToday] = useState(mockData.qt_today);
  const [missions, setMissions] = useState(mockData.missions);
  const [dailyQuests, setDailyQuests] = useState(mockData.daily_quests);
  const [season, setSeason] = useState(mockData.season);
  const [sharedGoal, setSharedGoal] = useState(mockData.shared_goal);
  const [activities, setActivities] = useState(mockData.activities);
  const [badges, setBadges] = useState(mockData.badges);
  const [classes, setClasses] = useState(mockData.classes as any[]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setQtToday(prev => prev.date === today ? prev : { ...prev, date: today });
  }, []);

  /* ── On mount: DB-first load with localStorage fallback ── */
  useEffect(() => {
    initPrayers(mockData.prayers);
    setPrayers(getPrayers());
    setTxns(getTransactions());
    if (isSupabaseReady) {
      (async () => {
        const today = new Date().toISOString().slice(0, 10);
        try {
          const [q, m, s, sg, a, b, cls, tch] = await Promise.all([
            fetchTodayQT(), fetchMissions(), fetchSeason(), fetchSharedGoal(),
            fetchActivities(), fetchBadges(), fetchClasses(), fetchTeachers(),
          ]);
          setQtToday(q || mockData.qt_today);
          setMissions(m as any);
          setSeason(s);
          setSharedGoal(sg);
          setActivities(a);
          setBadges(b);
          if (cls && cls.length) setClasses(cls as any[]);
          setTeachers(tch);
          setDataLoaded(true);
        } catch { /* keep mock fallback */ }

        // Load student-specific data from DB
        if (student) {
          try {
            const [dbQT, dbMissions, dbTxns, dbPrayers, dbDailyIds, dbSharedPosts, dbComments, dbSharedDates, dbPrayerParts] = await Promise.all([
              fetchQTRecords(student.id),
              fetchCompletedMissions(student.id),
              fetchTransactions(student.id),
              fetchPrayers(student.id),
              fetchDailyQuests(student.id, today),
              fetchSharedPosts(),
              Promise.all([]) as any,
              fetchSharedQTDates(student.id),
              fetchPrayerParticipants(student.id),
            ]);

            if (dbQT && dbQT.length) {
              setQtRecords(dbQT as QTRecord[]);
              setQtDoneToday(dbQT.some((r: any) => r.date === today));
            } else {
              // localStorage fallback
              const localQT = getQTRecords();
              if (localQT.length) setQtRecords(localQT);
            }

            if (dbMissions && dbMissions.length) {
              setCompletedMissionIds(dbMissions);
            } else {
              setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
            }

            if (dbTxns && dbTxns.length) {
              setTxns(dbTxns as MileageTransaction[]);
            } else {
              setTxns(getTransactions());
            }

            if (dbPrayers && dbPrayers.length) {
              setPrayers(dbPrayers as unknown as PrayerRequest[]);
            } else {
              setPrayers(getPrayers());
            }

            if (dbDailyIds && dbDailyIds.length) {
              setDailyQuestIds(dbDailyIds);
              localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: dbDailyIds }));
            }

            if (dbSharedDates && dbSharedDates.length) {
              setSharedQTDates(dbSharedDates);
              localStorage.setItem("mileage_shared_qt", JSON.stringify(dbSharedDates));
            }

            if (dbSharedPosts && dbSharedPosts.length) {
              setSharedPosts(dbSharedPosts as SharedQTPost[]);
              localStorage.setItem("mileage_shared_posts", JSON.stringify(dbSharedPosts));
            }

            // Load comments for shared posts
            if (dbSharedPosts && dbSharedPosts.length) {
              const allComments: Record<string, QTComment[]> = {};
              for (const post of dbSharedPosts) {
                const comments = await fetchComments(post.id);
                if (comments.length) allComments[post.id] = comments;
              }
              if (Object.keys(allComments).length) {
                setQtComments(allComments);
                localStorage.setItem("mileage_qt_comments", JSON.stringify(allComments));
              }
            }

            // Load all students for ranking
            const allStu = await fetchStudents();
            if (allStu.length) setAllStudents(allStu);
          } catch { /* keep local */ }
        } else {
          // No student logged in, still load prayers from DB
          try {
            const dbPrayers = await fetchPrayers();
            if (dbPrayers && dbPrayers.length) {
              setPrayers(dbPrayers as unknown as PrayerRequest[]);
            }
          } catch { /* ignore */ }
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── LOGIN ── */
  const login = useCallback(async (name: string, birthDate: string): Promise<boolean> => {
    const adminMap: Record<string, { id: string; role: string; assignedClassIds?: string[] }> = {
      "홍길동": { id: "s1", role: "admin", assignedClassIds: ["c1"] },
      "김선생": { id: "t001", role: "teacher", assignedClassIds: ["c1", "c2"] },
      "이선생": { id: "t002", role: "teacher", assignedClassIds: ["c3", "c4"] },
      "박선생": { id: "t003", role: "teacher", assignedClassIds: ["c5", "c6"] },
      "최목사": { id: "t004", role: "admin" },
      "관리자": { id: "a001", role: "admin" },
    };
    const knownUser = adminMap[name.trim()];
    if (knownUser) {
      const t: Student = {
        id: knownUser.id,
        name: name.trim(),
        birthDate: birthDate.trim(),
        classId: "c1",
        mileage: 0,
        isTeacher: true,
        role: knownUser.role as any,
        assignedClassIds: knownUser.assignedClassIds,
      };
      setSession(t);
      setStudent(t);
      setQtDoneToday(isQTCompletedToday());
      setQtRecords(getQTRecords());
      setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
      setPrayers(getPrayers());
      setTxns(getTransactions());
      // Load from DB for admin/teacher
      if (isSupabaseReady) {
        try {
          const dbPrayers = await fetchPrayers();
          if (dbPrayers && dbPrayers.length) setPrayers(dbPrayers as unknown as PrayerRequest[]);
          const allStu = await fetchStudents();
          if (allStu.length) setAllStudents(allStu);
        } catch { /* ignore */ }
      }
      return true;
    }

    if (isSupabaseReady) {
      try {
        const mod = await import("./supabase");
        const sb = mod.getSupabase();
        if (sb) {
          const { data: remoteStudents } = await sb
            .from("students")
            .select("*")
            .eq("name", name.trim())
            .eq("birth_date", birthDate.trim())
            .limit(1);
          if (remoteStudents && remoteStudents.length) {
            const row = remoteStudents[0] as any;
            const s: Student = {
              id: row.id,
              name: row.name,
              birthDate: row.birth_date,
              classId: row.class_id,
              mileage: Number(row.mileage) || 0,
            };
            setSession(s);
            setStudent(s);
            // Load all student-specific data from DB
            const today = new Date().toISOString().slice(0, 10);
            const [dbQT, dbMissions, dbTxns, dbPrayers, dbDailyIds, dbSharedPosts, dbSharedDates] = await Promise.all([
              fetchQTRecords(s.id),
              fetchCompletedMissions(s.id),
              fetchTransactions(s.id),
              fetchPrayers(s.id),
              fetchDailyQuests(s.id, today),
              fetchSharedPosts(),
              fetchSharedQTDates(s.id),
            ]);
            if (dbQT && dbQT.length) {
              setQtRecords(dbQT as QTRecord[]);
              setQtDoneToday(dbQT.some((r: any) => r.date === today));
            } else {
              setQtDoneToday(isQTCompletedToday());
              setQtRecords(getQTRecords());
            }
            if (dbMissions && dbMissions.length) setCompletedMissionIds(dbMissions);
            else setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
            if (dbTxns && dbTxns.length) setTxns(dbTxns as MileageTransaction[]);
            else setTxns(getTransactions());
            if (dbPrayers && dbPrayers.length) setPrayers(dbPrayers as unknown as PrayerRequest[]);
            else setPrayers(getPrayers());
            if (dbDailyIds && dbDailyIds.length) {
              setDailyQuestIds(dbDailyIds);
              localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: dbDailyIds }));
            }
            if (dbSharedDates && dbSharedDates.length) {
              setSharedQTDates(dbSharedDates);
              localStorage.setItem("mileage_shared_qt", JSON.stringify(dbSharedDates));
            }
            if (dbSharedPosts && dbSharedPosts.length) {
              setSharedPosts(dbSharedPosts as SharedQTPost[]);
            }
            // Load comments
            if (dbSharedPosts && dbSharedPosts.length) {
              const allComments: Record<string, QTComment[]> = {};
              for (const post of dbSharedPosts) {
                const comments = await fetchComments(post.id);
                if (comments.length) allComments[post.id] = comments;
              }
              if (Object.keys(allComments).length) setQtComments(allComments);
            }
            return true;
          }
          const { data: remoteTeachers } = await sb
            .from("teachers")
            .select("*")
            .eq("name", name.trim())
            .eq("birth_date", birthDate.trim())
            .limit(1);
          if (remoteTeachers && remoteTeachers.length) {
            const trow = remoteTeachers[0] as any;
            const s: Student = {
              id: trow.id,
              name: trow.name,
              birthDate: trow.birth_date,
              classId: trow.class_id || "c1",
              mileage: 0,
              isTeacher: true,
              role: "teacher",
            };
            setSession(s);
            setStudent(s);
            setQtDoneToday(isQTCompletedToday());
            setQtRecords(getQTRecords());
            setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
            const dbPrayers = await fetchPrayers();
            if (dbPrayers && dbPrayers.length) setPrayers(dbPrayers as unknown as PrayerRequest[]);
            else setPrayers(getPrayers());
            setTxns(getTransactions());
            return true;
          }
        }
      } catch { /* fall through to local mock */ }
    }

    const found = mockData.students.find(
      s => s.name === name.trim() && s.birthDate === birthDate.trim()
    );
    if (!found) return false;
    setSession(found);
    setStudent(found);
    setQtDoneToday(isQTCompletedToday());
    setQtRecords(getQTRecords());
    setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
    initPrayers(mockData.prayers);
    setPrayers(getPrayers());
    setTxns(getTransactions());
    return true;
  }, []);

  /* ── LOGOUT ── */
  const logout = useCallback(() => {
    clearSession();
    setStudent(null);
    setQtRecords([]);
    setCompletedMissionIds([]);
    setTxns([]);
    setPrayers(mockData.prayers);
    setDailyQuestIds([]);
    setSharedQTDates([]);
    setSharedPosts([]);
    setQtComments({});
  }, []);

  /* ── Daily Quest ── */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mileage_daily_quests");
      try {
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.date !== today) {
            setDailyQuestIds([]);
            localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: [] }));
          }
        } else {
          localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: [] }));
        }
      } catch {
        localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: [] }));
      }
    }
  }, []);

  const completeDailyQuest = useCallback((questId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const quest = dailyQuests.find(q => q.id === questId);
    if (!quest || !student) return;
    setDailyQuestIds(prev => {
      if (prev.includes(questId)) return prev;
      const next = [...prev, questId];
      // localStorage backup
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_daily_quests", JSON.stringify({ date: today, ids: next }));
      // DB write
      completeDailyQuestRemote(student.id, questId, today, quest.reward);
      return next;
    });
    const tx: MileageTransaction = {
      id: "tx_" + Date.now(),
      studentId: student.id,
      type: "미션 완료",
      description: quest.title,
      amount: quest.reward,
      date: today,
    };
    addMileage(student, quest.reward, setStudent, setClasses, setTxns, tx);
    showPointToast(`+${quest.reward}M 획득!`);
    updateBadges(student.id);
  }, [dailyQuests, student]);

  // 배지 progress 자동 업데이트
  const updateBadges = useCallback((sid: string) => {
    setBadges(prev => prev.map(b => {
      let progress = b.progress;
      if (b.id === "b1" || b.id === "b2" || b.id === "b8") {
        const qtCount = qtRecords.filter(r => r.studentId === sid).length + 1;
        progress = qtCount;
      } else if (b.id === "b3") {
        progress = (progress || 0) + 1;
      } else if (b.id === "b4" || b.id === "b7") {
        progress = (progress || 0) + 1;
      } else if (b.id === "b5") {
        progress = (progress || 0) + 1;
      } else if (b.id === "b6") {
        const s = student;
        if (s) progress = s.mileage;
      }
      return { ...b, progress };
    }));
  }, [student, qtRecords]);

  /* ── QT ── */
  const completeQTHandler = useCallback(async (remembered: string, application: string) => {
    if (!student || qtDoneToday) return;
    const rec: QTRecord = {
      id: "qt_" + Date.now(),
      studentId: student.id,
      date: new Date().toISOString().slice(0, 10),
      passage: qtToday.passage,
      verse: qtToday.verse,
      remembered,
      application,
      reward: 20,
    };
    addQTRecord(rec);
    setQtRecords(prev => [...prev, rec]);
    setQtDoneToday(true);
    const tx: MileageTransaction = {
      id: "tx_" + Date.now(),
      studentId: student.id,
      type: "QT 완료",
      description: "오늘의 QT 완료",
      amount: 20,
      date: new Date().toISOString().slice(0, 10),
    };
    addMileage(student, 20, setStudent, setClasses, setTxns, tx);
    showPointToast("+20M QT 완료!");
    updateBadges(student.id);
    completeDailyQuest("d1");
    // DB writes
    await upsertSupabase("qt_records", rec);
  }, [student, qtDoneToday, qtToday, completeDailyQuest]);

  /* ── MISSION ── */
  const completeMissionHandler = useCallback(async (missionId: string) => {
    if (!student || completedMissionIds.includes(missionId)) return;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    const completed: CompletedMission = {
      missionId,
      studentId: student.id,
      completedAt: new Date().toISOString(),
      reward: mission.reward,
    };
    completeMission(completed);
    setCompletedMissionIds(prev => [...prev, missionId]);
    const tx: MileageTransaction = {
      id: "tx_" + Date.now(),
      studentId: student.id,
      type: "미션 완료",
      description: mission.title,
      amount: mission.reward,
      date: new Date().toISOString().slice(0, 10),
    };
    addMileage(student, mission.reward, setStudent, setClasses, setTxns, tx);
    // DB writes
    await upsertSupabase("completed_missions", { mission_id: missionId, student_id: student.id, reward: mission.reward, completed_at: completed.completedAt });
  }, [student, completedMissionIds, missions]);

  /* ── PRAYER ── */
  const prayForHandler = useCallback(async (prayerId: string) => {
    if (!student) return;
    if (hasPrayed(prayerId, student.id)) return;
    setPrayers(prev => {
      const next = togglePrayer(prayerId, student.id);
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_prayers", JSON.stringify(next));
      return next;
    });
    const tx: MileageTransaction = {
      id: "tx_" + Date.now(),
      studentId: student.id,
      type: "기도 참여",
      description: "친구 기도제목에 함께 기도",
      amount: 5,
      date: new Date().toISOString().slice(0, 10),
    };
    addMileage(student, 5, setStudent, setClasses, setTxns, tx);
    showPointToast("+5M 기도 참여!");
    updateBadges(student.id);
    completeDailyQuest("d3");
    // DB writes
    await prayForRemote(student.id, prayerId);
  }, [student, completeDailyQuest]);

  const addPrayerRequest = useCallback(async (content: string, anonymous: boolean) => {
    if (!student) return;
    const newPrayer: PrayerRequest = {
      id: "pr_" + Date.now(),
      studentId: student.id,
      authorName: anonymous ? null : student.name,
      anonymous,
      content,
      prayerCount: 0,
      prayedBy: [],
      createdAt: new Date().toISOString(),
    };
    setPrayers(prev => {
      const next = [...prev, newPrayer];
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_prayers", JSON.stringify(next));
      return next;
    });
    // DB write
    await addPrayer(newPrayer);
  }, [student]);

  const todayPrayerCount = prayers.filter(p => p.createdAt?.startsWith(new Date().toISOString().slice(0, 10))).length;

  const updatePrayerRequest = useCallback(async (prayerId: string, newContent: string) => {
    if (!student) return;
    setPrayers(prev => {
      const next = prev.map(p => p.id === prayerId ? { ...p, content: newContent } : p);
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_prayers", JSON.stringify(next));
      return next;
    });
    // DB write
    await updatePrayerRemote(prayerId, newContent);
  }, [student]);

  const deletePrayerRequest = useCallback(async (prayerId: string) => {
    if (!student) return;
    setPrayers(prev => {
      const next = prev.filter(p => p.id !== prayerId);
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_prayers", JSON.stringify(next));
      return next;
    });
    // DB write
    await deletePrayerRemote(prayerId);
  }, [student]);

  /* ── SHARED QT ── */
  const shareQT = useCallback((): boolean => {
    if (!student) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (sharedQTDates.includes(today)) return false;
    const newShared = [...sharedQTDates, today];
    setSharedQTDates(newShared);
    if (typeof window !== "undefined")
      localStorage.setItem("mileage_shared_qt", JSON.stringify(newShared));

    const qtRec = qtRecords.find(r => r.date === today) || null;
    const myClass = classes.find(c => c.id === student.classId) as any;
    const post: SharedQTPost = {
      id: "qp_" + Date.now(),
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      passage: qtToday.passage,
      verse: qtToday.verse,
      remembered: qtRec?.remembered,
      application: qtRec?.application,
      reward: 10,
      date: today,
      commentCount: 0,
      likedBy: [],
      ...(myClass ? { className: myClass.name } : {}),
    };
    setSharedPosts(prev => [post, ...prev]);
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("mileage_shared_posts") || "[]");
      localStorage.setItem("mileage_shared_posts", JSON.stringify([post, ...existing]));
    }

    const tx: MileageTransaction = {
      id: "tx_" + Date.now(),
      studentId: student.id,
      type: "QT 공유",
      description: "오늘의 QT를 친구와 공유",
      amount: 10,
      date: today,
    };
    addMileage(student, 10, setStudent, setClasses, setTxns, tx);
    completeDailyQuest("d2");
    // DB writes
    (async () => {
      await createSharedPost(post);
    })();
    return true;
  }, [student, sharedQTDates, qtToday, classes, completeDailyQuest, qtRecords]);

  /* ── QT 공유 댓글 ── */
  const addComment = useCallback((postId: string, content: string) => {
    if (!student) return;
    const comment: QTComment = {
      id: "qc_" + Date.now(),
      postId,
      studentId: student.id,
      studentName: student.name,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setQtComments(prev => {
      const next = { ...prev, [postId]: [...(prev[postId] || []), comment] };
      if (typeof window !== "undefined")
        localStorage.setItem("mileage_qt_comments", JSON.stringify(next));
      return next;
    });
    setSharedPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    if (typeof window !== "undefined") {
      const posts = JSON.parse(localStorage.getItem("mileage_shared_posts") || "[]")
        .map((p: SharedQTPost) => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p);
      localStorage.setItem("mileage_shared_posts", JSON.stringify(posts));
    }
    completeDailyQuest("d7");
    // DB write
    addCommentToPost(comment);
  }, [student, completeDailyQuest]);

  const fetchPostComments = useCallback((postId: string): QTComment[] => {
    return qtComments[postId] || [];
  }, [qtComments]);

  return (
    <ViewModeCtx.Provider value={{ mode, setMode: (m) => { if (typeof window !== "undefined") localStorage.setItem("app_view_mode", m); setMode(m); } }}>
    <Ctx.Provider value={{
      student,
      isLoggedIn: !!student,
      supabaseReady: isSupabaseReady,
      login,
      logout,
      qtToday,
      isQTDoneToday: qtDoneToday,
      qtRecords,
      completeQT: completeQTHandler,
      sharedQTDates,
      sharedTodayQT: sharedQTDates.includes(new Date().toISOString().slice(0, 10)),
      shareQT,
      sharedPosts: sharedPosts.filter(p => p.date === new Date().toISOString().slice(0, 10)),
      addComment,
      fetchPostComments,
      missions,
      dailyQuests,
      dailyQuestIds,
      completeDailyQuest,
      completedMissionIds,
      completeMission: completeMissionHandler,
      prayers: [...prayers].sort((a, b) => b.prayerCount - a.prayerCount),
      prayFor: prayForHandler,
      addPrayerRequest,
      updatePrayerRequest,
      deletePrayerRequest,
      todayPrayerCount,
      transactions: txns,
      badges,
      season,
      classes,
      allStudents,
      activities,
      sharedGoal,
      teachers,
    }}>
      {children}
    </Ctx.Provider>
    </ViewModeCtx.Provider>
  );
}
