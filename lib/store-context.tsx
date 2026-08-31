"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Student, MileageTransaction, QTRecord, PrayerRequest, CompletedMission, SharedQTPost, QTComment } from "./types";
import type { Teacher } from "./types";
import { mockData } from "./data";
import {
  fetchStudents, fetchClasses, fetchMissions, fetchBadges, fetchPrayers,
  fetchTodayQT, fetchSeason, fetchSharedGoal, fetchActivities, fetchTeachers,
} from "@/services/mileage-service";
import {
  getSession, setSession, clearSession,
  getQTRecords, addQTRecord, isQTCompletedToday,
  getCompletedMissions, completeMission,
  getPrayers, initPrayers, hasPrayed, togglePrayer,
  getTransactions, addTransaction, updateStudentMileage,
} from "./storage";
import { isSupabaseReady } from "./config";

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
  } catch { /* ignore – localStorage is already updated */ }
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
  completedMissionIds: string[];
  completeMission: (missionId: string) => void;
  prayers: PrayerRequest[];
  prayFor: (prayerId: string) => void;
  addPrayerRequest: (content: string, anonymous: boolean) => void;
  transactions: MileageTransaction[];
  badges: typeof mockData.badges;
  season: typeof mockData.season;
  classes: typeof mockData.classes;
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
  // 동기 복원: 첫 렌더링부터 세션 반영 → 점멸/리다이렉트 루프 방지
  const [mode, setMode] = useState<AppViewMode>(() => {
    if (typeof window === "undefined") return "student";
    return (localStorage.getItem("app_view_mode") as AppViewMode) || "student";
  });
  const [student, setStudent] = useState<Student | null>(() => {
    const s = getSession();
    if (!s) return null;
    // Always ensure admin/teacher roles are correct
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

  // Supabase에서 관리되는 데이터 (mock 폴백)
  const [qtToday, setQtToday] = useState(mockData.qt_today);
  const [missions, setMissions] = useState(mockData.missions);
  const [season, setSeason] = useState(mockData.season);
  const [sharedGoal, setSharedGoal] = useState(mockData.shared_goal);
  const [activities, setActivities] = useState(mockData.activities);
  const [badges, setBadges] = useState(mockData.badges);
  const [classes, setClasses] = useState(mockData.classes as any[]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // qtToday 날짜를 오늘 날짜로 자동 갱신
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setQtToday(prev => prev.date === today ? prev : { ...prev, date: today });
  }, []);

  /* On mount: init prayers + try load from Supabase */
  useEffect(() => {
    initPrayers(mockData.prayers);
    setPrayers(getPrayers());
    setTxns(getTransactions());
    if (isSupabaseReady) {
      (async () => {
        // 정적 데이터를 Supabase에서 우선 로드
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
        try {
          const mod = await import("./supabase");
          const sb = mod.getSupabase();
          if (!sb) return;
          if (student) {
            const { data } = await sb.from("qt_records").select("*").eq("student_id", student.id);
            if (data && data.length) {
              setQtRecords(data as QTRecord[]);
              setQtDoneToday(data.some((r: any) => r.date === new Date().toISOString().slice(0, 10)));
            }
            const { data: missions } = await sb.from("completed_missions").select("mission_id").eq("student_id", student.id);
            if (missions && missions.length) {
              setCompletedMissionIds(missions.map((m: any) => m.mission_id));
            }
          }
          const { data: prayersData } = await sb.from("prayer_requests").select("*").order("created_at", { ascending: false });
          if (prayersData && prayersData.length) {
            setPrayers(prayersData as unknown as PrayerRequest[]);
          }
        } catch { /* keep local */ }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── LOGIN ── */
  const login = useCallback(async (name: string, birthDate: string): Promise<boolean> => {
    // Check admin/teacher accounts first (highest priority)
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
      return true;
    }

    // Try Supabase next
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
            setQtDoneToday(isQTCompletedToday());
            setQtRecords(getQTRecords());
            setCompletedMissionIds(getCompletedMissions().map(m => m.missionId));
            setPrayers(getPrayers());
            setTxns(getTransactions());
            return true;
          }
          // 선생님 계정 확인
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
            setPrayers(getPrayers());
            setTxns(getTransactions());
            return true;
          }
        }
      } catch { /* fall through to local mock */ }
    }

    // Fallback: local mock
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
  }, []);

  /* ── QT ── */
  const completeQTHandler = useCallback(async (remembered: string, application: string) => {
    if (!student || qtDoneToday) return;
    const updated = updateStudentMileage(student.id, 20, student);
    setStudent(updated);
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
    addTransaction(tx);
    setTxns(prev => [...prev, tx]);
    // Supabase writes
    await updateSupabase("students", { id: student.id }, { mileage: updated.mileage });
    await upsertSupabase("qt_records", rec);
    await upsertSupabase("mileage_transactions", tx);
  }, [student, qtDoneToday, qtToday]);

  /* ── MISSION ── */
  const completeMissionHandler = useCallback(async (missionId: string) => {
    if (!student || completedMissionIds.includes(missionId)) return;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    const updated = updateStudentMileage(student.id, mission.reward, student);
    setStudent(updated);
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
    addTransaction(tx);
    setTxns(prev => [...prev, tx]);
    // Supabase writes
    await updateSupabase("students", { id: student.id }, { mileage: updated.mileage });
    await upsertSupabase("completed_missions", { mission_id: missionId, student_id: student.id, reward: mission.reward, completed_at: completed.completedAt });
    await upsertSupabase("mileage_transactions", tx);
  }, [student, completedMissionIds, missions]);

  /* ── PRAYER ── */
  const prayForHandler = useCallback(async (prayerId: string) => {
    if (!student) return;
    if (hasPrayed(prayerId, student.id)) return;
    // 기도 참여 보상 +5M
    const updated = updateStudentMileage(student.id, 5, student);
    setStudent(updated);
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
    addTransaction(tx);
    setTxns(prev => [...prev, tx]);
    // Supabase writes
    const asyncWrite = async () => {
      await updateSupabase("students", { id: student.id }, { mileage: updated.mileage });
      await upsertSupabase("mileage_transactions", tx);
      if (isSupabaseReady) {
        try {
          const mod = await import("./supabase");
          const sb = mod.getSupabase();
          if (sb) {
            await sb.from("prayer_requests").update({ prayer_count: { raw: "prayer_count + 1" } }).eq("id", prayerId);
            await sb.from("prayer_participants").upsert([{ prayer_id: prayerId, student_id: student.id }]);
          }
        } catch { /* ignore */ }
      }
    };
    asyncWrite();
  }, [student]);

  const addPrayerRequest = useCallback(async (content: string, anonymous: boolean) => {
    if (!student) return;
    const newPrayer: PrayerRequest = {
      id: "pr_" + Date.now(),
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
    // Supabase writes
    if (isSupabaseReady) {
      try {
        const mod = await import("./supabase");
        const sb = mod.getSupabase();
        if (sb) await sb.from("prayer_requests").insert([newPrayer]);
      } catch { /* ignore */ }
    }
  }, [student]);

  const shareQT = useCallback((): boolean => {
    if (!student) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (sharedQTDates.includes(today)) return false;
    // 보너스 마일리지 (+10M)
    const updated = updateStudentMileage(student.id, 10, student);
    setStudent(updated);
    const newShared = [...sharedQTDates, today];
    setSharedQTDates(newShared);
    if (typeof window !== "undefined")
      localStorage.setItem("mileage_shared_qt", JSON.stringify(newShared));

    // 공유 피드에 게시글 등록 (앱 사용자 모두가 볼 수 있게)
    const qtRec = getQTRecords().find(r => r.date === today) || null;
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
    addTransaction(tx);
    setTxns(prev => [...prev, tx]);
    // Supabase
    const asyncWrite = async () => {
      await updateSupabase("students", { id: student.id }, { mileage: updated.mileage });
      await upsertSupabase("mileage_transactions", tx);
      await upsertSupabase("shared_qt_posts", post);
    };
    asyncWrite();
    return true;
  }, [student, sharedQTDates, qtToday, classes]);

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
    // Supabase
    const asyncWrite = async () => {
      await upsertSupabase("qt_comments", comment);
    };
    asyncWrite();
  }, [student]);

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
      sharedPosts,
      addComment,
      fetchPostComments,
      missions,
      completedMissionIds,
      completeMission: completeMissionHandler,
      prayers,
      prayFor: prayForHandler,
      addPrayerRequest,
      transactions: txns,
      badges,
      season,
      classes,
      activities,
      sharedGoal,
      teachers,
    }}>
      {children}
    </Ctx.Provider>
    </ViewModeCtx.Provider>
  );
}
