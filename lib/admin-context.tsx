"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AdminStudent, AdminTeacher, AttendanceSession, AttendanceRecordAdmin, QTContent, MissionAdmin, MissionCompletionAdmin, Announcement, Reward, RewardRedemption, SeasonAdmin, BadgeAdmin, AuditLog, AdminSettings, MileageActionType } from "./admin-types";
import type { PrayerRequestAdmin } from "./admin-types";
import { seedUsers, seedAdminStudents, seedAdminTeachers, seedAttendanceSessions, seedAttendanceRecords, seedQTContent, seedMissionAdmins, seedAnnouncements, seedRewards, seedRedemptions, seedSeasonAdmin, seedBadgeAdmins, seedAuditLogs, seedAdminSettings } from "./admin-seed-data";
import { isSupabaseReady } from "./config";
import { getSupabase } from "./supabase";
import { createActivity } from "@/services/mileage-service";

function loadArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch { return fallback; }
}

function saveArray<T>(key: string, data: T[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function loadObject<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

interface AdminState {
  currentUser: { id: string; name: string; role: string; assignedClassIds?: string[] } | null;
  setCurrentUser: (user: { id: string; name: string; role: string; assignedClassIds?: string[] }) => void;

  students: AdminStudent[];
  addStudent: (s: AdminStudent) => void;
  updateStudent: (id: string, patch: Partial<AdminStudent>) => void;
  deactivateStudent: (id: string) => void;

  teachers: AdminTeacher[];
  addTeacher: (t: AdminTeacher) => void;
  updateTeacher: (id: string, patch: Partial<AdminTeacher>) => void;

  attendanceSessions: AttendanceSession[];
  addAttendanceSession: (s: AttendanceSession) => void;
  closeAttendanceSession: (id: string) => void;
  attendanceRecords: AttendanceRecordAdmin[];
  addAttendanceRecord: (r: AttendanceRecordAdmin) => void;
  updateAttendanceRecord: (id: string, patch: Partial<AttendanceRecordAdmin>) => void;
  bulkMarkAttendance: (studentIds: string[], sessionId: string, state: AttendanceStateType) => void;

  qtContents: QTContent[];
  addQTContent: (q: QTContent) => void;
  updateQTContent: (id: string, patch: Partial<QTContent>) => void;

  missions: MissionAdmin[];
  addMission: (m: MissionAdmin) => void;
  updateMission: (id: string, patch: Partial<MissionAdmin>) => void;
  missionCompletions: MissionCompletionAdmin[];
  approveMissionCompletion: (id: string) => void;
  rejectMissionCompletion: (id: string) => void;

  prayers: PrayerRequestAdmin[];
  updatePrayerStatus: (id: string, status: PrayerStatusType) => void;

  announcements: Announcement[];
  addAnnouncement: (a: Announcement) => void;
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void;

  awardsMileage: (target: "student" | "class" | "grade" | "all", targetId: string, amount: number, reason: string) => void;
  allTransactions: MileageTransactionRecord[];

  rewards: Reward[];
  addReward: (r: Reward) => void;
  updateReward: (id: string, patch: Partial<Reward>) => void;
  redemptions: RewardRedemption[];
  updateRedemption: (id: string, status: "approved" | "completed" | "cancelled") => void;

  season: SeasonAdmin;
  updateSeason: (patch: Partial<SeasonAdmin>) => void;

  badges: BadgeAdmin[];
  addBadge: (b: BadgeAdmin) => void;
  updateBadge: (id: string, patch: Partial<BadgeAdmin>) => void;
  studentBadges: Record<string, string[]>;
  earnBadge: (studentId: string, badgeId: string) => void;

  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;

  settings: AdminSettings;
  updateSettings: (patch: Partial<AdminSettings>) => void;
  resetToSeedData: () => void;
}

type AttendanceStateType = "present" | "late" | "absent" | "excused";
type PrayerStatusType = "active" | "hidden" | "reported" | "deleted";

interface MileageTransactionRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: MileageActionType;
  description: string;
  amount: number;
  date: string;
  actorName: string;
}

const AdminCtx = createContext<AdminState | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminState["currentUser"]>(null);
  const [students, setStudents] = useState<AdminStudent[]>(() => loadArray("admin_students", seedAdminStudents));
  const [teachers, setTeachers] = useState<AdminTeacher[]>(() => loadArray("admin_teachers", seedAdminTeachers));
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => loadArray("admin_attendance_sessions", seedAttendanceSessions));
  const [records, setRecords] = useState<AttendanceRecordAdmin[]>(() => loadArray("admin_attendance_records", seedAttendanceRecords));
  const [qtContents, setQTContents] = useState<QTContent[]>(() => loadArray("admin_qt_contents", seedQTContent));
  const [missionAdmins, setMissionAdmins] = useState<MissionAdmin[]>(() => loadArray("admin_missions", seedMissionAdmins));
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletionAdmin[]>(() => loadArray("admin_mission_completions", []));
  const [prayers, setPrayers] = useState<PrayerRequestAdmin[]>(() => loadArray("admin_prayers", []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadArray("admin_announcements", seedAnnouncements));
  const [allTx, setAllTx] = useState<MileageTransactionRecord[]>(() => loadArray("admin_mileage_tx", []));
  const [rewards, setRewards] = useState<Reward[]>(() => loadArray("admin_rewards", seedRewards));
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(() => loadArray("admin_redemptions", seedRedemptions));
  const [season, setSeason] = useState<SeasonAdmin>(() => loadArray("admin_season", [seedSeasonAdmin])[0]);
  const [badges, setBadges] = useState<BadgeAdmin[]>(() => loadArray("admin_badges", seedBadgeAdmins));
  const [studentBadges, setStudentBadges] = useState<Record<string, string[]>>(() => loadObject("admin_student_badges", {}));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadArray("admin_audit_logs", seedAuditLogs));
  const [settings, setSettings] = useState<AdminSettings>(() => loadArray("admin_settings", [seedAdminSettings])[0]);

  // Persist every change
  useEffect(() => { saveArray("admin_students", students); }, [students]);
  useEffect(() => { saveArray("admin_teachers", teachers); }, [teachers]);
  useEffect(() => { saveArray("admin_attendance_sessions", sessions); }, [sessions]);
  useEffect(() => { saveArray("admin_attendance_records", records); }, [records]);
  useEffect(() => { saveArray("admin_qt_contents", qtContents); }, [qtContents]);
  useEffect(() => { saveArray("admin_missions", missionAdmins); }, [missionAdmins]);
  useEffect(() => { saveArray("admin_mission_completions", missionCompletions); }, [missionCompletions]);
  useEffect(() => { saveArray("admin_prayers", prayers); }, [prayers]);
  useEffect(() => { saveArray("admin_announcements", announcements); }, [announcements]);
  useEffect(() => { saveArray("admin_mileage_tx", allTx); }, [allTx]);
  useEffect(() => { saveArray("admin_rewards", rewards); }, [rewards]);
  useEffect(() => { saveArray("admin_redemptions", redemptions); }, [redemptions]);
  useEffect(() => { saveArray("admin_season", [season]); }, [season]);
  useEffect(() => { saveArray("admin_badges", badges); }, [badges]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("admin_student_badges", JSON.stringify(studentBadges)); }, [studentBadges]);
  useEffect(() => { saveArray("admin_audit_logs", auditLogs); }, [auditLogs]);
  useEffect(() => { saveArray("admin_settings", [settings]); }, [settings]);

  // Supabase에서 학생/출석 데이터 로드 (마운트 시 1회)
  useEffect(() => {
    if (!isSupabaseReady) return;
    (async () => {
      try {
        const sb = getSupabase();
        if (!sb) return;

        // 학생 로드
        const { data: studentsData } = await sb.from("students").select("*").order("name");
        if (studentsData && studentsData.length) {
          const mapped = studentsData.map((r: any) => ({
            id: r.id,
            name: r.name,
            birthDate: r.birth_date || "",
            classId: r.class_id || "",
            mileage: Number(r.mileage) || 0,
            role: r.role || "student",
            active: r.active !== false,
          }));
          setStudents(mapped);
        }

        // 교사 로드
        const { data: teachersData } = await sb.from("teachers").select("*").order("name");
        if (teachersData && teachersData.length) {
          const mapped = teachersData.map((r: any) => ({
            id: r.id,
            name: r.name,
            birthDate: r.birth_date || "",
            role: "teacher" as "teacher" | "admin",
            assignedClassIds: r.assigned_class_ids || [],
            active: r.active !== false,
          }));
          setTeachers(mapped);
        }

        // 출석 세션 로드
        const { data: sessionsData } = await sb.from("attendance_sessions").select("*").order("date", { ascending: false });
        if (sessionsData && sessionsData.length) {
          const mapped = sessionsData.map((r: any) => ({
            id: r.id,
            eventName: r.event_name || r.eventName || "주일예배",
            date: r.date,
            startTime: r.start_time || r.startTime || "10:00",
            endTime: r.end_time || r.endTime || "12:00",
            active: r.active || false,
            mileageReward: Number(r.mileage_reward || 0),
            xpReward: Number(r.xp_reward || 0),
          }));
          setSessions(mapped);
        }

        // 출석 기록 로드
        const { data: recordsData } = await sb.from("attendance_records").select("*");
        if (recordsData && recordsData.length) {
          const mapped = recordsData.map((r: any) => ({
            id: r.id,
            sessionId: r.session_id,
            studentId: r.student_id,
            state: r.state,
            checkTime: r.check_time || r.checkTime || new Date().toISOString(),
            method: (r.method as "manual") || "manual",
          }));
          setRecords(mapped);
        }
      } catch { /* keep localStorage data */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addStudent = useCallback((s: AdminStudent) => setStudents(prev => [...prev, s]), []);
  const updateStudent = useCallback((id: string, patch: Partial<AdminStudent>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);
  const deactivateStudent = useCallback((id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
  }, []);

  const addTeacher = useCallback((t: AdminTeacher) => setTeachers(prev => [...prev, t]), []);
  const updateTeacher = useCallback((id: string, patch: Partial<AdminTeacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const addAttendanceSession = useCallback((s: AttendanceSession) => {
    setSessions(prev => [...prev, s]);
    // Supabase
    if (isSupabaseReady) {
      getSupabase()?.from("attendance_sessions").insert([{
        id: s.id, event_name: s.eventName, date: s.date,
        start_time: s.startTime, end_time: s.endTime,
        active: s.active, mileage_reward: s.mileageReward, xp_reward: s.xpReward,
      }]); /* sb write */ void 0;
    }
  }, []);
  const closeAttendanceSession = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
  }, []);
  const addAttendanceRecord = useCallback((r: AttendanceRecordAdmin) => {
    setRecords(prev => {
      const exists = prev.some(x => x.studentId === r.studentId && x.sessionId === r.sessionId);
      if (exists) return prev;
      return [...prev, r];
    });
    // Supabase
    if (isSupabaseReady) {
      getSupabase()?.from("attendance_records").upsert({
        id: r.id, session_id: r.sessionId, student_id: r.studentId,
        state: r.state, check_time: r.checkTime, method: r.method,
      }, { onConflict: "session_id,student_id" }); /* sb write */ void 0;
    }
  }, []);
  const updateAttendanceRecord = useCallback((id: string, patch: Partial<AttendanceRecordAdmin>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);
  const bulkMarkAttendance = useCallback((studentIds: string[], sessionId: string, state: AttendanceStateType) => {
    const now = new Date().toISOString();
    setRecords(prev => {
      const existing = new Set(prev.filter(r => r.sessionId === sessionId).map(r => r.studentId));
      const newRecords = studentIds.filter(id => !existing.has(id)).map(id => ({
        id: "ar_" + Date.now() + "_" + id,
        studentId: id,
        sessionId,
        state,
        checkTime: now,
        method: "manual" as const,
      }));
      // Supabase
      if (isSupabaseReady && newRecords.length) {
        const rows = newRecords.map(r => ({
          id: r.id, session_id: r.sessionId, student_id: r.studentId,
          state: r.state, check_time: r.checkTime, method: r.method,
        }));
        getSupabase()?.from("attendance_records").upsert(rows, { onConflict: "session_id,student_id" }); /* sb write */ void 0;
      }
      return [...prev, ...newRecords];
    });
  }, []);

  const addQTContent = useCallback((q: QTContent) => setQTContents(prev => [...prev, q]), []);
  const updateQTContent = useCallback((id: string, patch: Partial<QTContent>) => {
    setQTContents(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  }, []);

  const addMission = useCallback((m: MissionAdmin) => setMissionAdmins(prev => [...prev, m]), []);
  const updateMission = useCallback((id: string, patch: Partial<MissionAdmin>) => {
    setMissionAdmins(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);
  const approveMissionCompletion = useCallback((id: string) => {
    setMissionCompletions(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as const } : c));
  }, []);
  const rejectMissionCompletion = useCallback((id: string) => {
    setMissionCompletions(prev => prev.map(c => c.id === id ? { ...c, status: "rejected" as const } : c));
  }, []);

  const updatePrayerStatus = useCallback((id: string, status: PrayerStatusType) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }, []);

  const addAnnouncement = useCallback((a: Announcement) => setAnnouncements(prev => [...prev, a]), []);
  const updateAnnouncement = useCallback((id: string, patch: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const awardsMileage = useCallback((target: "student" | "class" | "grade" | "all", targetId: string, amount: number, reason: string) => {
    const actorName = currentUser?.name || "관리자";
    // 홈탭 공지 생성
    if (isSupabaseReady) {
      const targetLabel = target === "student"
        ? (students.find(s => s.id === targetId)?.name || "학생")
        : target === "class"
          ? "반"
          : target === "grade"
            ? `고${targetId.replace(/\D/g, "")}학년`
            : "전체";
      const action = amount >= 0 ? `+${amount}M 지급` : `${amount}M 차감`;
      createActivity("mileage", `${targetLabel} ${action} · ${reason}`);
    }
    if (target === "student") {
      setStudents(prev => prev.map(s => s.id === targetId ? { ...s, mileage: s.mileage + amount } : s));
      const stu = students.find(s => s.id === targetId);
      if (stu) {
        const tx: MileageTransactionRecord = {
          id: "atx_" + Date.now(), studentId: targetId, studentName: stu.name,
          className: stu.classId, type: amount > 0 ? "manual_bonus" : "manual_deduction",
          description: reason, amount, date: new Date().toISOString().slice(0, 10), actorName,
        };
        setAllTx(prev => [...prev, tx]);
      }
    } else {
      let targets: AdminStudent[] = [];
      if (target === "class") {
        targets = students.filter(s => s.classId === targetId && s.active);
      } else if (target === "grade") {
        targets = students.filter(s => s.classId.startsWith(targetId) && s.active);
      } else {
        targets = students.filter(s => s.active);
      }
      setStudents(prev => prev.map(s => {
        if (targets.some(t => t.id === s.id)) return { ...s, mileage: s.mileage + amount };
        return s;
      }));
      targets.forEach(stu => {
        const tx: MileageTransactionRecord = {
          id: "atx_" + Date.now() + "_" + stu.id, studentId: stu.id, studentName: stu.name,
          className: stu.classId, type: amount > 0 ? "manual_bonus" : "manual_deduction",
          description: reason, amount, date: new Date().toISOString().slice(0, 10), actorName,
        };
        setAllTx(prev => [...prev, tx]);
        // Supabase
        if (isSupabaseReady) {
          const sb = getSupabase();
          if (sb) {
            sb.from("students").update({ mileage: stu.mileage + amount }).eq("id", stu.id); /* sb write */ void 0;
            sb.from("mileage_transactions").insert([{ id: tx.id, student_id: tx.studentId, type: tx.type, description: tx.description, amount: tx.amount, date: tx.date }]); /* sb write */ void 0;
          }
        }
      });
    }
  }, [currentUser, students]);

  const addReward = useCallback((r: Reward) => setRewards(prev => [...prev, r]), []);
  const updateReward = useCallback((id: string, patch: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);
  const updateRedemption = useCallback((id: string, status: "approved" | "completed" | "cancelled") => {
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  const updateSeason = useCallback((patch: Partial<SeasonAdmin>) => {
    setSeason(prev => ({ ...prev, ...patch }));
  }, []);

  const addBadge = useCallback((b: BadgeAdmin) => setBadges(prev => [...prev, b]), []);
  const updateBadge = useCallback((id: string, patch: Partial<BadgeAdmin>) => {
    setBadges(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const earnBadge = useCallback((studentId: string, badgeId: string) => {
    // 이미 획득한 배지인지 확인
    const existing = studentBadges[studentId] || [];
    if (existing.includes(badgeId)) return;

    // 배지 정보 조회
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return;

    // 배지 획득 기록 추가
    setStudentBadges(prev => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), badgeId],
    }));

    // 마일리지 지급
    if (badge.mileageReward > 0) {
      setStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, mileage: s.mileage + badge.mileageReward } : s
      ));
      const stu = students.find(s => s.id === studentId);
      if (stu) {
        const tx: MileageTransactionRecord = {
          id: "atx_" + Date.now(),
          studentId,
          studentName: stu.name,
          className: stu.classId,
          type: "badge",
          description: "배지 획득: " + badge.name,
          amount: badge.mileageReward,
          date: new Date().toISOString().slice(0, 10),
          actorName: "시스템",
        };
        setAllTx(prev => [...prev, tx]);
      }
    }
  }, [studentBadges, badges, students]);

  const addAuditLog = useCallback((log: Omit<AuditLog, "id" | "timestamp">) => {
    const entry: AuditLog = {
      ...log,
      id: "al_" + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [entry, ...prev]);
  }, []);

  const updateSettings = useCallback((patch: Partial<AdminSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const resetToSeedData = useCallback(() => {
    setStudents(seedAdminStudents);
    setTeachers(seedAdminTeachers);
    setSessions(seedAttendanceSessions);
    setRecords([]);
    setQTContents(seedQTContent);
    setMissionAdmins(seedMissionAdmins);
    setMissionCompletions([]);
    setPrayers([]);
    setAnnouncements(seedAnnouncements);
    setAllTx([]);
    setRewards(seedRewards);
    setRedemptions(seedRedemptions);
    setSeason(seedSeasonAdmin);
    setBadges(seedBadgeAdmins);
    setStudentBadges({});
    setAuditLogs(seedAuditLogs);
    setSettings(seedAdminSettings);
    // Clear localStorage
    if (typeof window !== "undefined") {
      Object.keys(localStorage).filter(k => k.startsWith("admin_")).forEach(k => localStorage.removeItem(k));
    }
  }, []);

  return (
    <AdminCtx.Provider value={{
      currentUser, setCurrentUser,
      students, addStudent, updateStudent, deactivateStudent,
      teachers, addTeacher, updateTeacher,
      attendanceSessions: sessions, addAttendanceSession, closeAttendanceSession,
      attendanceRecords: records, addAttendanceRecord, updateAttendanceRecord, bulkMarkAttendance,
      qtContents, addQTContent, updateQTContent,
      missions: missionAdmins, addMission, updateMission,
      missionCompletions, approveMissionCompletion, rejectMissionCompletion,
      prayers, updatePrayerStatus,
      announcements, addAnnouncement, updateAnnouncement,
      awardsMileage, allTransactions: allTx,
      rewards, addReward, updateReward,
      redemptions, updateRedemption,
      season, updateSeason,
      badges, addBadge, updateBadge, studentBadges, earnBadge,
      auditLogs, addAuditLog,
      settings, updateSettings, resetToSeedData,
    }}>
      {children}
    </AdminCtx.Provider>
  );
}
