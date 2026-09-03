"use client";
/**
 * Centralized database access layer.
 * ALL Supabase queries go through this module.
 * All dates use Asia/Seoul timezone via korea-date.ts.
 */
import { getSupabase } from "./supabase";
import { koreaDate } from "./korea-date";

/* ── Helpers ── */
function sb() { return getSupabase(); }

function mapStudent(r: any) {
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date || "",
    classId: r.class_id || "",
    grade: Number(r.grade) || (r.class_id?.includes("_g1_") ? 1 : r.class_id?.includes("_g2_") ? 2 : r.class_id?.includes("_g3_") ? 3 : 1),
    className: r.class_name || "",
    mileage: Number(r.mileage) || 0,
    xp: Number(r.xp) || 0,
    weeklyXp: Number(r.weekly_xp) || 0,
    isTeacher: !!r.is_teacher,
    role: r.role || "student",
    assignedClassIds: r.assigned_class_ids || [],
    phone: r.phone || "",
    guardianPhone: r.guardian_phone || "",
    memo: r.memo || "",
    active: r.active !== false,
    enrollmentStatus: r.enrollment_status || "active",
  };
}

function mapClass(r: any) {
  return {
    id: r.id,
    name: r.name,
    grade: Number(r.grade) || 1,
    level: Number(r.level) || 1,
    xp: Number(r.xp) || 0,
    weeklyXp: Number(r.weekly_xp) || 0,
    attendance: { attended: Number(r.attendance_attended || 0), total: Number(r.attendance_total || 0) },
    qtCount: Number(r.qt_count || 0),
    missionCount: Number(r.mission_count || 0),
    prayerCount: Number(r.prayer_count || 0),
    classMessage: r.class_message || "",
  };
}

/* ── QT ── */
export async function fetchTodayQT() {
  const today = koreaDate();
  const s = sb();
  if (s) {
    const { data } = await s.from("qt_today").select("*").eq("date", today).limit(1);
    if (data && data.length) {
      const r = data[0];
      return {
        date: today, passage: r.passage || "", verse: r.verse || "", content: r.content || "",
        prayer: r.prayer || "", song: r.song || "", helper: r.helper || "",
        question1: r.question1 || "", question2: r.question2 || "", title: r.title || "",
      };
    }
  }
  return { date: today, passage: "", verse: "", content: "", prayer: "", song: "", helper: "", question1: "", question2: "", title: "오늘의 QT가 없습니다" };
}

export async function fetchQTByDate(date: string) {
  const s = sb();
  if (!s) return null;
  const { data } = await s.from("qt_today").select("*").eq("date", date).limit(1);
  if (data && data.length) {
    const r = data[0];
    return { date, passage: r.passage || "", verse: r.verse || "", content: r.content || "", prayer: r.prayer || "", song: r.song || "", helper: r.helper || "", question1: r.question1 || "", question2: r.question2 || "", title: r.title || "" };
  }
  return null;
}

/* ── Students ── */
export async function fetchStudents() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("students").select("*").order("name");
  if (error || !data) return [];
  return data.map(mapStudent);
}

export async function fetchStudentById(id: string) {
  const s = sb();
  if (!s) return null;
  const { data } = await s.from("students").select("*").eq("id", id).limit(1);
  if (!data || !data.length) return null;
  return mapStudent(data[0]);
}

export async function fetchActiveStudents() {
  return (await fetchStudents()).filter((s: any) => s.active !== false && s.isTeacher !== true);
}

export async function upsertStudent(student: any) {
  const s = sb();
  if (!s) return;
  await s.from("students").upsert({
    id: student.id, name: student.name, birth_date: student.birthDate || "",
    class_id: student.classId || "", grade: student.grade || 1,
    class_name: student.className || "", mileage: student.mileage || 0,
    xp: student.xp || 0, weekly_xp: student.weeklyXp || 0,
    is_teacher: student.isTeacher || false, role: student.role || "student",
    assigned_class_ids: student.assignedClassIds || [],
    phone: student.phone || "", guardian_phone: student.guardianPhone || "",
    memo: student.memo || "", active: student.active !== false,
    enrollment_status: student.enrollmentStatus || "active",
  });
}

/* ── Classes ── */
export async function fetchClasses() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("classes").select("*").order("name");
  if (error || !data) return [];
  return data.map(mapClass);
}

/* ── Teachers ── */
export async function fetchTeachers() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("teachers").select("*").order("name");
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, name: r.name, birthDate: r.birth_date || "",
    role: r.role || "teacher", assignedClassIds: r.assigned_class_ids || [],
    active: r.active !== false,
  }));
}

export async function upsertTeacher(teacher: any) {
  const s = sb();
  if (!s) return;
  await s.from("teachers").upsert({
    id: teacher.id, name: teacher.name, birth_date: teacher.birthDate || "",
    role: teacher.role || "teacher", assigned_class_ids: teacher.assignedClassIds || [],
    active: teacher.active !== false,
  });
}

/* ── Missions ── */
export async function fetchMissions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("missions").select("*").eq("active", true).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, icon: r.icon || "🎯", title: r.title, description: r.description || "",
    reward: Number(r.mileage_reward) || 0, category: r.type || "weekly",
    xpReward: Number(r.xp_reward) || 0, approvalRequired: !!r.approval_required,
    target: r.target || "all",
  }));
}

export async function fetchAllMissions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("missions").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function insertMission(mission: any) {
  const s = sb();
  if (!s) return;
  await s.from("missions").insert([{
    id: mission.id, title: mission.title, description: mission.description || "",
    icon: mission.icon || "🎯", type: mission.type || "weekly",
    mileage_reward: mission.mileageReward || 30, xp_reward: mission.xpReward || 30,
    start_date: mission.startDate || "", end_date: mission.endDate || "",
    target: mission.target || "all", approval_required: !!mission.approvalRequired,
    active: true,
  }]);
}

export async function updateMission(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.mileageReward !== undefined) update.mileage_reward = patch.mileageReward;
  await s.from("missions").update(update).eq("id", id);
}

/* ── Completed Missions ── */
export async function fetchCompletedMissions(studentId?: string) {
  const s = sb();
  if (!s) return [];
  let q = s.from("completed_missions").select("*").order("completed_at", { ascending: false });
  if (studentId) q = q.eq("student_id", studentId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data;
}

export async function completeMission(studentId: string, missionId: string, status: string = "pending") {
  const s = sb();
  if (!s) return;
  await s.from("completed_missions").upsert({
    id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mission_id: missionId, student_id: studentId, status,
    completed_at: new Date().toISOString(),
  }, { onConflict: "mission_id,student_id" });
}

/* ── Announcements ── */
export async function fetchAnnouncements() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("announcements").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(20);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, title: r.title, content: r.content || "",
    important: !!r.important, createdAt: r.created_at || "",
    target: r.target || "all", targetClassIds: r.target_class_ids || [],
    targetGrades: r.target_grades || [],
    startDate: r.start_date || "", endDate: r.end_date || "",
    status: r.status || "draft",
  }));
}

export async function insertAnnouncement(a: any) {
  const s = sb();
  if (!s) return;
  await s.from("announcements").insert([{
    id: a.id, title: a.title, content: a.content || "",
    target: a.target || "all", important: !!a.important,
    status: a.status || "published",
    start_date: a.startDate || koreaDate(),
    end_date: a.endDate || "",
    created_at: new Date().toISOString(),
  }]);
}

/* ── Badges ── */
export async function fetchBadges() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("badges").select("*").eq("active", true).order("display_order");
  if (error || !data) return [];
  return data;
}

export async function fetchStudentBadges(studentId: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("student_badges").select("*").eq("student_id", studentId);
  if (error || !data) return [];
  return data;
}

export async function upsertStudentBadge(studentId: string, badgeId: string, level: number, progress: number) {
  const s = sb();
  if (!s) return;
  await s.from("student_badges").upsert({
    student_id: studentId, badge_id: badgeId,
    current_level: level, current_progress: progress,
    updated_at: new Date().toISOString(),
  }, { onConflict: "student_id,badge_id" });
}

/* ── Prayers ── */
export async function fetchPrayers(studentId?: string) {
  const s = sb();
  if (!s) return [];
  let q = s.from("prayer_requests").select("*").order("created_at", { ascending: false });
  if (studentId) q = q.eq("student_id", studentId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, authorName: r.author_name || "", anonymous: !!r.anonymous,
    content: r.content || "", prayerCount: Number(r.prayer_count) || 0,
    createdAt: r.created_at || "", prayedBy: [], studentId: r.student_id,
    classId: r.class_id || "", status: r.status || "active",
  }));
}

export async function insertPrayer(prayer: any) {
  const s = sb();
  if (!s) return null;
  const { data, error } = await s.from("prayer_requests").insert([{
    id: prayer.id, student_id: prayer.studentId, author_name: prayer.authorName || "",
    anonymous: !!prayer.anonymous, content: prayer.content, class_id: prayer.classId || "",
    status: "active",
  }]).select().single();
  if (error || !data) return null;
  return data;
}

export async function updatePrayer(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.status !== undefined) update.status = patch.status;
  await s.from("prayer_requests").update(update).eq("id", id);
}

export async function deletePrayer(id: string) {
  const s = sb();
  if (!s) return;
  await s.from("prayer_requests").delete().eq("id", id);
}

export async function recordPrayerParticipation(studentId: string, prayerId: string) {
  const s = sb();
  if (!s) return;
  await s.from("prayer_participants").upsert({
    student_id: studentId, prayer_id: prayerId,
  }, { onConflict: "prayer_id,student_id" });
  // Increment prayer_count
  try {
    await s.rpc("increment_prayer_count" as any, { pid: prayerId });
  } catch {
    // Fallback: manual increment
    const { data } = await s.from("prayer_requests").select("prayer_count").eq("id", prayerId).single();
    if (data) {
      await s.from("prayer_requests").update({ prayer_count: (data.prayer_count || 0) + 1 }).eq("id", prayerId);
    }
  }
}

export async function hasPrayedToday(studentId: string, prayerId: string): Promise<boolean> {
  const s = sb();
  if (!s) return false;
  const { data } = await s.from("prayer_participants").select("id").eq("prayer_id", prayerId).eq("student_id", studentId).limit(1);
  return !!(data && data.length);
}

export async function fetchPrayerParticipants(prayerId: string) {
  const s = sb();
  if (!s) return [];
  const { data } = await s.from("prayer_participants").select("student_id").eq("prayer_id", prayerId);
  if (!data) return [];
  return data.map((r: any) => r.student_id);
}

/* ── Daily Quests ── */
export async function fetchDailyQuests(studentId: string, date: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("daily_quests").select("quest_id").eq("student_id", studentId).eq("completion_date", date);
  if (error || !data) return [];
  return data.map((r: any) => r.quest_id);
}

export async function completeDailyQuest(studentId: string, questId: string, date: string, mileage: number = 5, xp: number = 5) {
  const s = sb();
  if (!s) return false;
  const { error } = await s.from("daily_quests").upsert({
    id: `dq_${studentId}_${questId}_${date}`,
    student_id: studentId, quest_id: questId, completion_date: date,
    mileage_awarded: mileage, xp_awarded: xp,
  }, { onConflict: "student_id,quest_id,completion_date" });
  return !error;
}

/* ── Mileage Transactions ── */
export async function fetchTransactions(studentId: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("mileage_transactions").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(100);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id, studentName: r.student_name || "",
    className: r.class_name || "", type: r.type || "",
    description: r.description || "", amount: Number(r.amount) || 0,
    date: r.date || "", actorName: r.actor_name || "",
  }));
}

export async function addTransaction(tx: any) {
  const s = sb();
  if (!s) return;
  await s.from("mileage_transactions").insert([{
    id: tx.id || `tx_${Date.now()}`, student_id: tx.studentId || tx.student_id,
    student_name: tx.studentName || tx.student_name || "",
    class_name: tx.className || tx.class_name || "",
    type: tx.type || "", description: tx.description || "",
    amount: tx.amount || 0, date: tx.date || koreaDate(),
    actor_name: tx.actorName || tx.actor_name || "",
    created_at: new Date().toISOString(),
  }]);
}

export async function fetchAllTransactions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("mileage_transactions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id, studentName: r.student_name || "",
    className: r.class_name || "", type: r.type || "",
    description: r.description || "", amount: Number(r.amount) || 0,
    date: r.date || "", actorName: r.actor_name || "",
  }));
}

/* ── QT Records ── */
export async function fetchQTRecords(studentId: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("qt_records").select("*").eq("student_id", studentId).order("date", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id, date: r.date,
    passage: r.passage || "", verse: r.verse || "",
    remembered: r.remembered || "", application: r.application || "",
    reward: Number(r.reward) || 0,
  }));
}

export async function completeQT(studentId: string, qtDate: string, answer1: string, answer2: string, reward: number) {
  const s = sb();
  if (!s) return null;
  // Duplicate check
  const { data: existing } = await s.from("qt_records").select("id").eq("student_id", studentId).eq("date", qtDate).limit(1);
  if (existing && existing.length) return null;

  const qt = await fetchQTByDate(qtDate);
  const id = `qtrec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await s.from("qt_records").insert([{
    id, student_id: studentId, date: qtDate,
    passage: qt?.passage || "", verse: qt?.verse || "",
    remembered: answer1, application: answer2, reward,
  }]).select().single();
  if (error || !data) return null;
  return { id: data.id, studentId: data.student_id, date: data.date, passage: data.passage, verse: data.verse, remembered: data.remembered, application: data.application, reward: data.reward };
}

export async function updateQTRecord(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.remembered !== undefined) update.remembered = patch.remembered;
  if (patch.application !== undefined) update.application = patch.application;
  await s.from("qt_records").update(update).eq("id", id);
}

export async function deleteQTRecord(id: string) {
  const s = sb();
  if (!s) return;
  await s.from("qt_records").delete().eq("id", id);
}

/* ── Attendance ── */
export async function fetchAttendanceSessions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("attendance_sessions").select("*").order("date", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, eventName: r.event_name || "주일예배", date: r.date,
    startTime: r.start_time || "10:00", endTime: r.end_time || "12:00",
    active: !!r.active, mileageReward: Number(r.mileage_reward) || 20,
    xpReward: Number(r.xp_reward) || 20, createdBy: r.created_by || "",
  }));
}

export async function insertAttendanceSession(session: any) {
  const s = sb();
  if (!s) return;
  await s.from("attendance_sessions").insert([{
    id: session.id, event_name: session.eventName || "주일예배",
    date: session.date, start_time: session.startTime || "10:00",
    end_time: session.endTime || "12:00", active: session.active || false,
    mileage_reward: session.mileageReward || 20, xp_reward: session.xpReward || 20,
    created_by: session.createdBy || "",
  }]);
}

export async function updateAttendanceSession(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.active !== undefined) update.active = patch.active;
  await s.from("attendance_sessions").update(update).eq("id", id);
}

export async function fetchAttendanceRecords(sessionId?: string) {
  const s = sb();
  if (!s) return [];
  let q = s.from("attendance_records").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id, sessionId: r.session_id,
    state: r.state || "absent", checkTime: r.check_time || "",
    method: r.method || "manual",
  }));
}

export async function upsertAttendanceRecord(record: any) {
  const s = sb();
  if (!s) return;
  await s.from("attendance_records").upsert({
    id: record.id, session_id: record.sessionId,
    student_id: record.studentId, state: record.state || "absent",
    check_time: record.checkTime || new Date().toISOString(),
    method: record.method || "manual",
  }, { onConflict: "session_id,student_id" });
}

export async function updateAttendanceRecord(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.state !== undefined) update.state = patch.state;
  if (patch.checkTime !== undefined) update.check_time = patch.checkTime;
  await s.from("attendance_records").update(update).eq("id", id);
}

export async function fetchAttendanceCount(studentId: string) {
  const s = sb();
  if (!s) return 0;
  const { data, error } = await s.from("attendance_records").select("id, state, session_id").eq("student_id", studentId);
  if (error || !data) return 0;
  return data.filter((r: any) => r.state === "present" || r.state === "late").length;
}

export async function fetchStudentAttendanceForDate(studentId: string, date: string) {
  const s = sb();
  if (!s) return null;
  // Find session for this date
  const { data: sessions } = await s.from("attendance_sessions").select("id").eq("date", date).limit(1);
  if (!sessions || !sessions.length) return null;
  const { data } = await s.from("attendance_records").select("*").eq("session_id", sessions[0].id).eq("student_id", studentId).limit(1);
  return data && data.length ? data[0] : null;
}

/* ── Rewards / Store ── */
export async function fetchRewards() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("rewards").select("*").eq("active", true).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function fetchAllRewards() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("rewards").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function insertReward(r: any) {
  const s = sb();
  if (!s) return;
  await s.from("rewards").insert([{
    id: r.id, name: r.name, description: r.description || "",
    mileage_cost: r.mileageCost || 0, inventory: r.inventory || 0,
    active: true, redemption_limit: r.redemptionLimit || 1,
    category: r.category || "",
  }]);
}

export async function fetchRedemptions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("redemptions").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function insertRedemption(r: any) {
  const s = sb();
  if (!s) return null;
  const { data, error } = await s.from("redemptions").insert([{
    id: r.id, student_id: r.studentId, student_name: r.studentName || "",
    reward_id: r.rewardId, reward_name: r.rewardName || "",
    mileage_cost: r.mileageCost || 0, status: "requested",
  }]).select().single();
  if (error || !data) return null;
  return data;
}

export async function updateRedemption(id: string, status: string) {
  const s = sb();
  if (!s) return;
  await s.from("redemptions").update({ status }).eq("id", id);
}

/* ── Seasons & Settings ── */
export async function fetchSeason() {
  const s = sb();
  if (!s) return null;
  const { data } = await s.from("seasons").select("*").eq("active", true).limit(1);
  if (data && data.length) {
    const r = data[0];
    return { id: r.id, name: r.name, subtitle: r.subtitle, startDate: r.start_date, endDate: r.end_date, active: true, sharedGoalXp: r.shared_goal_xp, sharedReward: r.shared_reward };
  }
  return null;
}

export async function updateSeason(patch: any) {
  const s = sb();
  if (!s) return;
  const { data } = await s.from("seasons").select("id").eq("active", true).limit(1);
  if (data && data.length) {
    const update: any = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.subtitle !== undefined) update.subtitle = patch.subtitle;
    if (patch.startDate !== undefined) update.start_date = patch.startDate;
    if (patch.endDate !== undefined) update.end_date = patch.endDate;
    await s.from("seasons").update(update).eq("id", data[0].id);
  }
}

export async function fetchSettings() {
  const s = sb();
  if (!s) return null;
  const { data } = await s.from("settings").select("*").eq("id", "default").limit(1);
  if (data && data.length) {
    const r = data[0];
    return {
      defaultAttendanceMileage: Number(r.default_attendance_mileage) || 20,
      defaultQTMileage: Number(r.default_qt_mileage) || 20,
      prayerMileage: Number(r.prayer_mileage) || 5,
      weeklyMissionReward: Number(r.weekly_mission_reward) || 30,
      nameDisplayPolicy: r.name_display_policy || "full",
      anonymousPrayerEnabled: !!r.anonymous_prayer_enabled,
      mileageShopEnabled: !!r.mileage_shop_enabled,
    };
  }
  return { defaultAttendanceMileage: 20, defaultQTMileage: 20, prayerMileage: 5, weeklyMissionReward: 30, nameDisplayPolicy: "full", anonymousPrayerEnabled: true, mileageShopEnabled: true };
}

export async function updateSettings(patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.defaultAttendanceMileage !== undefined) update.default_attendance_mileage = patch.defaultAttendanceMileage;
  if (patch.defaultQTMileage !== undefined) update.default_qt_mileage = patch.defaultQTMileage;
  if (patch.prayerMileage !== undefined) update.prayer_mileage = patch.prayerMileage;
  if (patch.weeklyMissionReward !== undefined) update.weekly_mission_reward = patch.weeklyMissionReward;
  if (patch.nameDisplayPolicy !== undefined) update.name_display_policy = patch.nameDisplayPolicy;
  if (patch.anonymousPrayerEnabled !== undefined) update.anonymous_prayer_enabled = patch.anonymousPrayerEnabled;
  if (patch.mileageShopEnabled !== undefined) update.mileage_shop_enabled = patch.mileageShopEnabled;
  update.updated_at = new Date().toISOString();
  await s.from("settings").update(update).eq("id", "default");
}

/* ── Shared Goal ── */
export async function fetchSharedGoal() {
  const s = sb();
  if (!s) return { label: "", current: 0, target: 50000, reward: "" };
  const { data } = await s.from("shared_goal").select("*").limit(1);
  if (data && data.length) {
    const r = data[0];
    return { label: r.label || "", current: Number(r.current_xp) || 0, target: Number(r.target_xp) || 50000, reward: r.reward || "" };
  }
  return { label: "", current: 0, target: 50000, reward: "" };
}

/* ── Activities ── */
export async function fetchActivities() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("community_activities").select("*").order("created_at", { ascending: false }).limit(30);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, type: r.type, message: r.message,
    timestamp: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
  }));
}

export async function addActivity(type: string, message: string) {
  const s = sb();
  if (!s) return;
  await s.from("community_activities").insert([{
    id: `act_${Date.now()}`, type, message,
    created_at: new Date().toISOString(),
  }]);
}

/* ── Shared QT Posts ── */
export async function fetchSharedPosts() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("shared_qt_posts").select("*").order("created_at", { ascending: false }).limit(50);
  if (error || !data) return [];
  return data;
}

export async function createSharedPost(post: any) {
  const s = sb();
  if (!s) return;
  await s.from("shared_qt_posts").insert([{
    id: post.id, student_id: post.studentId, student_name: post.studentName || "",
    class_id: post.classId || "", class_name: post.className || "",
    passage: post.passage || "", verse: post.verse || "",
    remembered: post.remembered || "", application: post.application || "",
    reward: post.reward || 0, date: post.date || koreaDate(),
    comment_count: 0, liked_by: [],
  }]);
}

/* ── QT Comments ── */
export async function fetchComments(postId: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("qt_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, postId: r.post_id, studentId: r.student_id,
    studentName: r.student_name || "", content: r.content || "",
    createdAt: r.created_at || "",
  }));
}

export async function addComment(comment: any) {
  const s = sb();
  if (!s) return;
  await s.from("qt_comments").insert([{
    id: comment.id, post_id: comment.postId, student_id: comment.studentId,
    student_name: comment.studentName || "", content: comment.content || "",
    created_at: comment.createdAt || new Date().toISOString(),
  }]);
  // Increment comment_count
  await s.from("shared_qt_posts").update({ comment_count: { raw: "comment_count + 1" } }).eq("id", comment.postId);
}

/* ── Audit Logs ── */
export async function fetchAuditLogs() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, timestamp: r.created_at || "", actorName: r.actor_id || "",
    actorRole: r.actor_role || "", actionType: r.action || "",
    target: r.target_type || "", description: r.description || "",
  }));
}

export async function addAuditLog(log: any) {
  const s = sb();
  if (!s) return;
  await s.from("audit_logs").insert([{
    id: `al_${Date.now()}`, actor_id: log.actorName || "",
    actor_role: log.actorRole || "", action: log.actionType || "",
    target_type: log.target || "", description: log.description || "",
    created_at: new Date().toISOString(),
  }]);
}

/* ── XP & Mileage Aggregate Helpers ── */
export async function getStudentTotalMileage(studentId: string): Promise<number> {
  const s = sb();
  if (!s) return 0;
  const student = await fetchStudentById(studentId);
  return student?.mileage || 0;
}

export async function getStudentTotalXP(studentId: string): Promise<number> {
  const s = sb();
  if (!s) return 0;
  const student = await fetchStudentById(studentId);
  return student?.xp || 0;
}

export async function updateStudentField(studentId: string, field: string, value: any) {
  const s = sb();
  if (!s) return;
  await s.from("students").update({ [field]: value }).eq("id", studentId);
}

/* ── Level Calculation ── */
const STUDENT_LEVELS = [
  { level: 1, minXp: 0 }, { level: 2, minXp: 100 }, { level: 3, minXp: 300 },
  { level: 4, minXp: 600 }, { level: 5, minXp: 1000 }, { level: 6, minXp: 1500 },
  { level: 7, minXp: 2100 }, { level: 8, minXp: 2800 }, { level: 9, minXp: 3600 },
  { level: 10, minXp: 4500 }, { level: 11, minXp: 5500 }, { level: 12, minXp: 6600 },
  { level: 13, minXp: 7800 }, { level: 14, minXp: 9100 }, { level: 15, minXp: 10500 },
  { level: 16, minXp: 12000 }, { level: 17, minXp: 13600 }, { level: 18, minXp: 15300 },
  { level: 19, minXp: 17100 }, { level: 20, minXp: 19000 },
];

const CLASS_LEVELS = [
  { level: 1, minXp: 0 }, { level: 2, minXp: 500 }, { level: 3, minXp: 1500 },
  { level: 4, minXp: 3000 }, { level: 5, minXp: 5000 }, { level: 6, minXp: 7500 },
  { level: 7, minXp: 10500 }, { level: 8, minXp: 14000 }, { level: 9, minXp: 18000 },
  { level: 10, minXp: 22500 }, { level: 11, minXp: 27500 }, { level: 12, minXp: 33000 },
];

export function getStudentLevel(xp: number) {
  let result = STUDENT_LEVELS[0];
  for (const l of STUDENT_LEVELS) { if (xp >= l.minXp) result = l; }
  return result;
}

export function getClassLevel(totalXp: number) {
  let result = CLASS_LEVELS[0];
  for (const l of CLASS_LEVELS) { if (totalXp >= l.minXp) result = l; }
  return result;
}

export function getNextLevelXp(currentLevel: number, isClass: boolean = false): number {
  const levels = isClass ? CLASS_LEVELS : STUDENT_LEVELS;
  const next = levels.find(l => l.level === currentLevel + 1);
  return next ? next.minXp : Infinity;
}

/* ── Badge Progress Calculation ── */
export async function calculateBadgeProgress(studentId: string, badgeType: string): Promise<number> {
  const s = sb();
  if (!s) return 0;
  switch (badgeType) {
    case "qt_count": {
      const { data } = await s.from("qt_records").select("id").eq("student_id", studentId);
      return data?.length || 0;
    }
    case "attendance_count": {
      const { data } = await s.from("attendance_records").select("id, state").eq("student_id", studentId);
      return data?.filter((r: any) => r.state === "present" || r.state === "late").length || 0;
    }
    case "prayer_count": {
      const { data } = await s.from("prayer_participants").select("id").eq("student_id", studentId);
      return data?.length || 0;
    }
    case "mission_count": {
      const { data } = await s.from("completed_missions").select("id").eq("student_id", studentId).eq("status", "approved");
      return data?.length || 0;
    }
    default: return 0;
  }
}

/* ── Class Stats ── */
export async function fetchClassStats(classIds: string[]): Promise<Record<string, any>> {
  const s = sb();
  if (!s || !classIds.length) return {};
  const stats: Record<string, any> = {};
  classIds.forEach(id => { stats[id] = { qtCount: 0, missionCount: 0, prayerCount: 0, attendanceAttended: 0, attendanceTotal: 0 }; });

  const { data: students } = await s.from("students").select("id, class_id").eq("active", true);
  if (!students) return stats;
  const studentClassMap: Record<string, string> = {};
  students.forEach((st: any) => { studentClassMap[st.id] = st.class_id; });

  const { data: qtRecords } = await s.from("qt_records").select("student_id");
  if (qtRecords) qtRecords.forEach((r: any) => { const cid = studentClassMap[r.student_id]; if (cid && stats[cid]) stats[cid].qtCount++; });

  const { data: missions } = await s.from("completed_missions").select("student_id").eq("status", "approved");
  if (missions) missions.forEach((r: any) => { const cid = studentClassMap[r.student_id]; if (cid && stats[cid]) stats[cid].missionCount++; });

  const { data: prayers } = await s.from("prayer_participants").select("student_id");
  if (prayers) prayers.forEach((r: any) => { const cid = studentClassMap[r.student_id]; if (cid && stats[cid]) stats[cid].prayerCount++; });

  try {
    const { data: attendance } = await s.from("attendance_records").select("student_id, state");
    if (attendance) attendance.forEach((r: any) => {
      const cid = studentClassMap[r.student_id];
      if (cid && stats[cid]) {
        stats[cid].attendanceTotal++;
        if (r.state === "present" || r.state === "late") stats[cid].attendanceAttended++;
      }
    });
  } catch {}

  return stats;
}

/* ── Rankings ── */
export async function fetchStudentRankings() {
  const students = await fetchActiveStudents();
  return students.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);
}

export async function fetchClassRankings() {
  const classes = await fetchClasses();
  return classes.sort((a, b) => (b.xp || 0) - (a.xp || 0));
}
