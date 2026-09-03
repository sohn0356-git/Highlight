"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AdminStudent, AdminTeacher, AttendanceSession, AttendanceRecordAdmin, QTContent, MissionAdmin, MissionCompletionAdmin, Announcement, Reward, RewardRedemption, SeasonAdmin, BadgeAdmin, AuditLog, AdminSettings, MileageActionType } from "./admin-types";
import type { PrayerRequestAdmin } from "./admin-types";
import { koreaDate } from "./korea-date";
import { isSupabaseReady } from "./config";
import * as db from "./db";

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
  bulkMarkAttendance: (studentIds: string[], sessionId: string, state: string) => void;
  getStudentAttendanceCount: (studentId: string, year?: number, month?: number) => number;
  markStudentAttendance: (studentId: string, sessionId: string, state: string) => void;

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
  updatePrayerStatus: (id: string, status: string) => void;

  announcements: Announcement[];
  addAnnouncement: (a: Announcement) => void;
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void;

  awardsMileage: (target: string, targetId: string, amount: number, reason: string) => void;
  allTransactions: any[];

  rewards: Reward[];
  addReward: (r: Reward) => void;
  updateReward: (id: string, patch: Partial<Reward>) => void;
  redemptions: RewardRedemption[];
  updateRedemption: (id: string, status: string) => void;

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

const AdminCtx = createContext<AdminState | null>(null);
export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminState["currentUser"]>(null);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecordAdmin[]>([]);
  const [qtContents, setQTContents] = useState<QTContent[]>([]);
  const [missionAdmins, setMissionAdmins] = useState<MissionAdmin[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletionAdmin[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequestAdmin[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allTx, setAllTx] = useState<any[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [season, setSeason] = useState<SeasonAdmin>({ id: "", name: "시즌", subtitle: "", startDate: koreaDate(), endDate: "", active: true, sharedGoalXp: 50000, sharedReward: "" });
  const [badges, setBadges] = useState<BadgeAdmin[]>([]);
  const [studentBadges, setStudentBadges] = useState<Record<string, string[]>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    defaultAttendanceMileage: 20, defaultQTMileage: 20, prayerMileage: 5,
    weeklyMissionReward: 30, nameDisplayPolicy: "full", anonymousPrayerEnabled: true, mileageShopEnabled: true,
  });

  /* ── Load all data from Supabase ── */
  useEffect(() => {
    if (!isSupabaseReady) return;
    (async () => {
      try {
        // Students
        const sData = await db.fetchStudents();
        setStudents(sData.map((s: any) => ({
          id: s.id, name: s.name, birthDate: s.birthDate || "", classId: s.classId || "",
          mileage: s.mileage || 0, xp: s.xp || 0, grade: s.grade || 1,
          role: (s.role || "student") as "student" | "teacher" | "admin",
          active: s.active !== false,
          phone: s.phone || "", guardianPhone: s.guardianPhone || "", memo: s.memo || "",
          enrollmentStatus: s.enrollmentStatus || "active",
        })));

        // Teachers
        const tData = await db.fetchTeachers();
        if (tData.length) setTeachers(tData.map((t: any) => ({
          id: t.id, name: t.name, birthDate: t.birthDate, role: (t.role || "teacher") as "teacher" | "admin",
          assignedClassIds: t.assignedClassIds || [], active: t.active !== false,
        })));

        // Attendance sessions
        const sessData = await db.fetchAttendanceSessions();
        if (sessData.length) setSessions(sessData.map((s: any) => ({
          id: s.id, eventName: s.eventName, date: s.date, startTime: s.startTime,
          endTime: s.endTime, active: s.active, mileageReward: s.mileageReward, xpReward: s.xpReward,
        })));

        // Attendance records
        const recData = await db.fetchAttendanceRecords();
        if (recData.length) setRecords(recData.map((r: any) => ({
          id: r.id, studentId: r.studentId, sessionId: r.sessionId,
          state: r.state as any, checkTime: r.checkTime, method: r.method as "manual",
        })));

        // QT contents
        let qtData: any[] = [];
        try {
          const { getSupabase } = await import("./supabase");
          const sb = getSupabase();
          if (sb) {
            const { data } = await sb.from("qt_today").select("*").order("date", { ascending: false });
            qtData = data || [];
          }
        } catch {}
        if (qtData.length) setQTContents(qtData.map((r: any) => ({
          id: r.id || `qt_${r.date}`, date: r.date, title: r.title || "",
          passage: r.passage || "", verse: r.verse || "", content: r.content || "",
          question1: r.question1 || "", question2: r.question2 || "",
          mileageReward: Number(r.mileage_reward) || 20, active: true,
          status: r.status || "active",
        })));

        // Missions from DB
        const mData = await db.fetchAllMissions();
        if (mData.length) setMissionAdmins(mData.map((m: any) => ({
          id: m.id, title: m.title, description: m.description || "",
          icon: m.icon || "🎯", type: m.type || "weekly",
          mileageReward: Number(m.mileage_reward) || 30, xpReward: Number(m.xp_reward) || 30,
          startDate: m.start_date || "", endDate: m.end_date || "",
          target: m.target || "all", approvalRequired: !!m.approval_required,
          active: m.active !== false,
        })));

        // Mission completions
        try {
          const cmData = await db.fetchCompletedMissions();
          setMissionCompletions(cmData.map((c: any) => ({
            id: c.id, missionId: c.mission_id, studentId: c.student_id,
            status: c.status || "approved", completedAt: c.completed_at || "",
          })));
        } catch {}

        // Prayers
        const prData = await db.fetchPrayers();
        if (prData.length) setPrayers(prData.map((p: any) => ({
          id: p.id, studentId: p.studentId, authorName: p.authorName || null,
          anonymous: p.anonymous, content: p.content,
          prayerCount: p.prayerCount, classId: p.classId || "",
          createdAt: p.createdAt, status: p.status || "active",
        })));

        // Announcements
        const annData = await db.fetchAnnouncements();
        if (annData.length) setAnnouncements(annData.map((a: any) => ({
          id: a.id, title: a.title, content: a.content,
          target: a.target || "all", targetClassIds: a.targetClassIds || [],
          targetGrades: a.targetGrades || [],
          startDate: a.startDate, endDate: a.endDate,
          important: a.important, status: a.status, createdAt: a.createdAt,
        })));

        // Rewards
        try {
          const rwData = await db.fetchAllRewards();
          setRewards(rwData.map((r: any) => ({
            id: r.id, name: r.name, description: r.description || "",
            mileageCost: r.mileage_cost || 0, inventory: r.inventory || 0,
            active: r.active !== false, redemptionLimit: r.redemption_limit || 1,
            category: r.category || "",
          })));
        } catch {}

        // Redemptions
        let rdData: any[] = [];
        try { rdData = await db.fetchRedemptions(); } catch {}
        if (rdData.length) setRedemptions(rdData.map((r: any) => ({
          id: r.id, studentId: r.student_id, studentName: r.student_name || "",
          rewardId: r.reward_id, rewardName: r.reward_name || "",
          mileageCost: r.mileage_cost || 0, status: r.status || "requested",
          createdAt: r.created_at || "",
        })));

        // Badges
        const bData = await db.fetchBadges();
        if (bData.length) setBadges(bData.map((b: any) => ({
          id: b.id, name: b.name, description: b.description || "",
          icon: b.icon || "🏅", requirementType: b.requirement_type || "qt_count",
          requirementValue: Number(b.requirement_value) || 10,
          active: b.active !== false, mileageReward: Number(b.mileage_reward) || 0,
          levelThresholds: b.level_thresholds || [10, 30, 60, 100, 200],
        })));

        // Season
        const seData = await db.fetchSeason();
        if (seData) setSeason({
          id: seData.id, name: seData.name, subtitle: seData.subtitle,
          startDate: seData.startDate, endDate: seData.endDate, active: true,
          sharedGoalXp: seData.sharedGoalXp, sharedReward: seData.sharedReward,
        });

        // Settings
        const stData = await db.fetchSettings();
        if (stData) setSettings(stData);

        // Transactions
        const txData = await db.fetchAllTransactions();
        if (txData.length) setAllTx(txData);

        // Audit logs
        let alData: any[] = [];
        try { alData = await db.fetchAuditLogs(); } catch {}
        if (alData.length) setAuditLogs(alData);
      } catch (e) { console.error("Admin data load error:", e); }
    })();
  }, []);

  /* ── Students CRUD (DB-backed) ── */
  const addStudent = useCallback(async (s: AdminStudent) => {
    await db.upsertStudent({ ...s, grade: Number(s.classId?.match(/_g(\d)_/)?.[1]) || 1 });
    setStudents(prev => [...prev, s]);
  }, []);

  const updateStudent = useCallback(async (id: string, patch: Partial<AdminStudent>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    await db.upsertStudent({ id, ...patch });
  }, []);

  const deactivateStudent = useCallback(async (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
    await db.updateStudentField(id, "active", false);
  }, []);

  /* ── Teachers CRUD (DB-backed) ── */
  const addTeacher = useCallback(async (t: AdminTeacher) => {
    await db.upsertTeacher(t);
    setTeachers(prev => [...prev, t]);
  }, []);

  const updateTeacher = useCallback(async (id: string, patch: Partial<AdminTeacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    await db.upsertTeacher({ id, ...patch });
  }, []);

  /* ── Attendance (DB-backed) ── */
  const addAttendanceSession = useCallback(async (s: AttendanceSession) => {
    setSessions(prev => [...prev, s]);
    await db.insertAttendanceSession(s);
  }, []);

  const closeAttendanceSession = useCallback(async (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
    await db.updateAttendanceSession(id, { active: false });
  }, []);

  const addAttendanceRecord = useCallback(async (r: AttendanceRecordAdmin) => {
    setRecords(prev => {
      const exists = prev.some(x => x.studentId === r.studentId && x.sessionId === r.sessionId);
      if (exists) return prev.map(x => x.studentId === r.studentId && x.sessionId === r.sessionId ? { ...x, state: r.state } : x);
      return [...prev, r];
    });
    await db.upsertAttendanceRecord(r);
  }, []);

  const updateAttendanceRecord = useCallback(async (id: string, patch: Partial<AttendanceRecordAdmin>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (patch.state) await db.updateAttendanceRecord(id, patch);
  }, []);

  const bulkMarkAttendance = useCallback(async (studentIds: string[], sessionId: string, state: string) => {
    const newRecords: AttendanceRecordAdmin[] = studentIds.map(studentId => ({
      id: `ar_${studentId}_${sessionId}`, studentId, sessionId,
      state: state as any, checkTime: new Date().toISOString(), method: "manual" as const,
    }));
    setRecords(prev => {
      const updated = prev.filter(r => r.sessionId !== sessionId);
      return [...updated, ...newRecords];
    });
    for (const r of newRecords) {
      await db.upsertAttendanceRecord(r);
    }
  }, []);

  const getStudentAttendanceCount = useCallback((studentId: string, year?: number, month?: number): number => {
    return records.filter(r => {
      if (r.studentId !== studentId) return false;
      if (r.state !== "present" && r.state !== "late") return false;
      const session = sessions.find(s => s.id === r.sessionId);
      if (!session) return false;
      if (year && month) {
        const d = new Date(session.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }
      return true;
    }).length;
  }, [records, sessions]);

  const markStudentAttendance = useCallback(async (studentId: string, sessionId: string, state: string) => {
    const existing = records.find(r => r.studentId === studentId && r.sessionId === sessionId);
    if (existing) {
      await updateAttendanceRecord(existing.id, { state: state as any });
    } else {
      await addAttendanceRecord({
        id: `ar_${studentId}_${sessionId}_${Date.now()}`, studentId, sessionId,
        state: state as any, checkTime: new Date().toISOString(), method: "manual",
      });
    }
  }, [records, updateAttendanceRecord, addAttendanceRecord]);

  /* ── QT Contents (DB-backed) ── */
  const addQTContent = useCallback(async (q: QTContent) => {
    setQTContents(prev => [q, ...prev]);
    const sb = (await import("./supabase")).getSupabase();
    if (sb) {
      await sb.from("qt_today").upsert({
        id: `qt_${q.date}`, date: q.date, title: q.title,
        passage: q.passage, verse: q.verse, content: q.content,
        question1: q.question1, question2: q.question2,
        mileage_reward: q.mileageReward, status: q.status || "active",
      });
    }
  }, []);

  const updateQTContent = useCallback(async (id: string, patch: Partial<QTContent>) => {
    setQTContents(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
    const sb = (await import("./supabase")).getSupabase();
    if (sb) {
      const update: any = {};
      if (patch.title !== undefined) update.title = patch.title;
      if (patch.passage !== undefined) update.passage = patch.passage;
      if (patch.verse !== undefined) update.verse = patch.verse;
      if (patch.content !== undefined) update.content = patch.content;
      if (patch.status !== undefined) update.status = patch.status;
      update.updated_at = new Date().toISOString();
      await sb.from("qt_today").update(update).eq("id", id);
    }
  }, []);

  /* ── Missions (DB-backed) ── */
  const addMission = useCallback(async (m: MissionAdmin) => {
    setMissionAdmins(prev => [m, ...prev]);
    await db.insertMission(m);
  }, []);

  const updateMission = useCallback(async (id: string, patch: Partial<MissionAdmin>) => {
    setMissionAdmins(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    await db.updateMission(id, patch);
  }, []);

  /* ── Mission Completions (DB-backed) ── */
  const approveMissionCompletion = useCallback(async (id: string) => {
    setMissionCompletions(prev => prev.map(c => c.id === id ? { ...c, status: "approved" } : c));
    const sb = (await import("./supabase")).getSupabase();
    if (sb) {
      const { data } = await sb.from("completed_missions").select("*").eq("id", id).single();
      if (data) {
        await sb.from("completed_missions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
        const mission = missionAdmins.find(m => m.id === data.mission_id);
        if (mission) {
          await db.updateStudentField(data.student_id, "mileage", (students.find(s => s.id === data.student_id)?.mileage || 0) + mission.mileageReward);
          await db.addTransaction({ studentId: data.student_id, studentName: students.find(s => s.id === data.student_id)?.name || "", type: "미션승인", description: mission.title, amount: mission.mileageReward });
        }
      }
    }
  }, [missionAdmins, students]);

  const rejectMissionCompletion = useCallback(async (id: string) => {
    setMissionCompletions(prev => prev.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    const sb = (await import("./supabase")).getSupabase();
    if (sb) await sb.from("completed_missions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
  }, []);

  /* ── Prayers (DB-backed) ── */
  const updatePrayerStatus = useCallback(async (id: string, status: string) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p));
    await db.updatePrayer(id, { status });
  }, []);

  /* ── Announcements (DB-backed) ── */
  const addAnnouncement = useCallback(async (a: Announcement) => {
    setAnnouncements(prev => [a, ...prev]);
    await db.insertAnnouncement(a);
  }, []);

  const updateAnnouncement = useCallback(async (id: string, patch: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  /* ── Mileage Award ── */
  const awardsMileage = useCallback(async (target: string, targetId: string, amount: number, reason: string) => {
    const date = koreaDate();
    if (target === "student") {
      const stu = students.find(s => s.id === targetId);
      if (!stu) return;
      await db.updateStudentField(targetId, "mileage", stu.mileage + amount);
      setStudents(prev => prev.map(s => s.id === targetId ? { ...s, mileage: s.mileage + amount } : s));
      const tx = { id: `atx_${Date.now()}`, studentId: targetId, studentName: stu.name, className: stu.classId, type: "manual_bonus" as MileageActionType, description: reason, amount, date, actorName: "관리자" };
      setAllTx(prev => [tx, ...prev]);
      await db.addTransaction(tx);
    } else if (target === "class") {
      const clsStudents = students.filter(s => s.classId === targetId);
      for (const stu of clsStudents) {
        await db.updateStudentField(stu.id, "mileage", stu.mileage + amount);
      }
      setStudents(prev => prev.map(s => s.classId === targetId ? { ...s, mileage: s.mileage + amount } : s));
    } else if (target === "all") {
      for (const stu of students) {
        await db.updateStudentField(stu.id, "mileage", stu.mileage + amount);
      }
      setStudents(prev => prev.map(s => ({ ...s, mileage: s.mileage + amount })));
    }
  }, [students]);

  /* ── Rewards (DB-backed) ── */
  const addReward = useCallback(async (r: Reward) => {
    setRewards(prev => [r, ...prev]);
    await db.insertReward(r);
  }, []);

  const updateReward = useCallback(async (id: string, patch: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const updateRedemption = useCallback(async (id: string, status: string) => {
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
    await db.updateRedemption(id, status);
  }, []);

  /* ── Season (DB-backed) ── */
  const updateSeason = useCallback(async (patch: Partial<SeasonAdmin>) => {
    setSeason(prev => ({ ...prev, ...patch }));
    await db.updateSeason(patch);
  }, []);

  /* ── Badges (DB-backed) ── */
  const addBadge = useCallback(async (b: BadgeAdmin) => {
    setBadges(prev => [b, ...prev]);
    const sb = (await import("./supabase")).getSupabase();
    if (sb) {
      await sb.from("badges").insert([{
        id: b.id, name: b.name, description: b.description, icon: b.icon,
        requirement_type: b.requirementType, requirement_value: b.requirementValue,
        active: true, mileage_reward: b.mileageReward, display_order: badges.length + 1,
      }]);
    }
  }, [badges.length]);

  const updateBadge = useCallback(async (id: string, patch: Partial<BadgeAdmin>) => {
    setBadges(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const earnBadge = useCallback((studentId: string, badgeId: string) => {
    const existing = studentBadges[studentId] || [];
    if (existing.includes(badgeId)) return;
    setStudentBadges(prev => ({ ...prev, [studentId]: [...(prev[studentId] || []), badgeId] }));
    const badge = badges.find(b => b.id === badgeId);
    if (badge && badge.mileageReward > 0) {
      const stu = students.find(s => s.id === studentId);
      if (stu) {
        db.updateStudentField(studentId, "mileage", stu.mileage + badge.mileageReward);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, mileage: s.mileage + badge.mileageReward } : s));
      }
    }
  }, [studentBadges, badges, students]);

  /* ── Audit Logs (DB-backed) ── */
  const addAuditLog = useCallback(async (log: Omit<AuditLog, "id" | "timestamp">) => {
    const entry: AuditLog = { ...log, id: `al_${Date.now()}`, timestamp: new Date().toISOString() };
    setAuditLogs(prev => [entry, ...prev]);
    await db.addAuditLog(log);
  }, []);

  /* ── Settings (DB-backed) ── */
  const updateSettings = useCallback(async (patch: Partial<AdminSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    await db.updateSettings(patch);
  }, []);

  /* ── Reset ── */
  const resetToSeedData = useCallback(() => {
    setStudents([]); setTeachers([]); setSessions([]); setRecords([]);
    setQTContents([]); setMissionAdmins([]); setMissionCompletions([]);
    setPrayers([]); setAnnouncements([]); setAllTx([]);
    setRewards([]); setRedemptions([]); setBadges([]);
    setStudentBadges({}); setAuditLogs([]);
    setSettings({ defaultAttendanceMileage: 20, defaultQTMileage: 20, prayerMileage: 5, weeklyMissionReward: 30, nameDisplayPolicy: "full", anonymousPrayerEnabled: true, mileageShopEnabled: true });
  }, []);

  return (
    <AdminCtx.Provider value={{
      currentUser, setCurrentUser,
      students, addStudent, updateStudent, deactivateStudent,
      teachers, addTeacher, updateTeacher,
      attendanceSessions: sessions, addAttendanceSession, closeAttendanceSession,
      attendanceRecords: records, addAttendanceRecord, updateAttendanceRecord, bulkMarkAttendance, getStudentAttendanceCount, markStudentAttendance,
      qtContents, addQTContent, updateQTContent,
      missions: missionAdmins, addMission, updateMission,
      missionCompletions, approveMissionCompletion, rejectMissionCompletion,
      prayers, updatePrayerStatus,
      announcements, addAnnouncement, updateAnnouncement,
      awardsMileage, allTransactions: allTx,
      rewards, addReward, updateReward, redemptions, updateRedemption,
      season, updateSeason,
      badges, addBadge, updateBadge, studentBadges, earnBadge,
      auditLogs, addAuditLog,
      settings, updateSettings, resetToSeedData,
    }}>
      {children}
    </AdminCtx.Provider>
  );
}
