"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Student, MileageTransaction, QTRecord, PrayerRequest, CompletedMission } from "./types";
import { mockData } from "./data";
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
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 동기 복원: 첫 렌더링부터 세션 반영 → 점멸/리다이렉트 루프 방지
  const [student, setStudent] = useState<Student | null>(() => {
    const s = getSession();
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

  /* On mount: init prayers + try load from Supabase */
  useEffect(() => {
    initPrayers(mockData.prayers);
    setPrayers(getPrayers());
    setTxns(getTransactions());
    if (isSupabaseReady) {
      (async () => {
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
    // Try Supabase first
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
            const s = remoteStudents[0] as unknown as Student;
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
      passage: mockData.qt_today.passage,
      verse: mockData.qt_today.verse,
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
  }, [student, qtDoneToday]);

  /* ── MISSION ── */
  const completeMissionHandler = useCallback(async (missionId: string) => {
    if (!student || completedMissionIds.includes(missionId)) return;
    const mission = mockData.missions.find(m => m.id === missionId);
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
  }, [student, completedMissionIds]);

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
    };
    asyncWrite();
    return true;
  }, [student, sharedQTDates]);

  return (
    <Ctx.Provider value={{
      student,
      isLoggedIn: !!student,
      supabaseReady: isSupabaseReady,
      login,
      logout,
      qtToday: mockData.qt_today,
      isQTDoneToday: qtDoneToday,
      qtRecords,
      completeQT: completeQTHandler,
      sharedQTDates,
      sharedTodayQT: sharedQTDates.includes(new Date().toISOString().slice(0, 10)),
      shareQT,
      missions: mockData.missions,
      completedMissionIds,
      completeMission: completeMissionHandler,
      prayers,
      prayFor: prayForHandler,
      addPrayerRequest,
      transactions: txns,
      badges: mockData.badges,
      season: mockData.season,
      classes: mockData.classes,
      activities: mockData.activities,
      sharedGoal: mockData.shared_goal,
    }}>
      {children}
    </Ctx.Provider>
  );
}
