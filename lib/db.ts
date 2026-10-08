"use client";
/**
 * Centralized database access layer.
 * ALL Supabase queries go through this module.
 * All dates use Asia/Seoul timezone via korea-date.ts.
 */
import { getSupabase } from "./supabase";
import type { Student, TalentDonationHistory, TalentDonationRanking, TalentDonationResult, TalentDonationStatus } from "./types";
import { koreaDate, getWeekNumber, sundayFromWeek } from "./korea-date";

/* ── Helpers ── */
function sb() { return getSupabase(); }

export function gradeFromClassId(classId: string): number {
  if (classId.includes("_g1_")) return 1;
  if (classId.includes("_g2_")) return 2;
  if (classId.includes("_g3_")) return 3;
  return 0;
}

function mapStudent(r: any): Student {
  const classId = r.class_id || "";
  const role = (r.role || "student") as "student" | "teacher" | "admin";
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date || "",
    classId,
    grade: gradeFromClassId(classId),
    className: r.class_name || "",
    mileage: Number(r.talents ?? r.mileage) || 0,
    xp: Number(r.talents ?? r.xp) || 0,
    weeklyXp: Number(r.weekly_xp) || 0,
    isTeacher: !!r.is_teacher || role !== "student",
    role,
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
    grade: Number(r.grade) || 0,
    level: Number(r.level) || 1,
    xp: Number(r.xp) || 0,
    weeklyXp: Number(r.weekly_xp) || 0,
    qtCount: Number(r.qt_count || 0),
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
  // Ranking population: teachers/admins are excluded from rankings
  // but they still earn points via their own activity flows
  return (await fetchStudents()).filter((s: any) => s.active !== false && s.isTeacher !== true);
}

export async function upsertStudent(student: any) {
  const s = sb();
  if (!s) return;
  const grade = gradeFromClassId(String(student.classId || "")) || student.grade || 0;
  await s.from("students").upsert({
    id: student.id, name: student.name, birth_date: student.birthDate || "",
    class_id: student.classId || "", talents: student.mileage || 0,
    role: student.role || "student", is_teacher: !!student.isTeacher,
    active: student.active !== false, grade,
    class_name: student.className || "",
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
  }, { onConflict: "id" });
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
    approvalRequired: !!r.approval_required,
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
  try {
    const row: any = {
      id: mission.id, title: mission.title, description: mission.description || "",
      icon: mission.icon || "🎯", type: mission.type || "weekly",
      target: mission.target || "all", active: true,
    };
    row.mileage_reward = mission.reward ?? 0;
    row.xp_reward = mission.reward ?? 0;
    try { row.start_date = mission.startDate || ""; } catch {}
    try { row.end_date = mission.endDate || ""; } catch {}
    try { row.approval_required = !!mission.approvalRequired; } catch {}
    const { data, error } = await s.from("missions").insert([row]).select().single();
    if (error) return;
    await createMissionNotifications({
      id: data?.id || mission.id,
      title: data?.title || mission.title,
      reward: Number(data?.mileage_reward ?? mission.reward) || 0,
    });
  } catch {}
}

export async function updateMission(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.reward !== undefined) {
    update.mileage_reward = patch.reward;
    update.xp_reward = patch.reward;
  }
  if (patch.mileageReward !== undefined) {
    update.mileage_reward = patch.mileageReward;
    update.xp_reward = patch.mileageReward;
  }
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.target !== undefined) update.target = patch.target;
  if (patch.approvalRequired !== undefined) update.approval_required = !!patch.approvalRequired;
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
  try {
    const { data, error } = await s.from("announcements").select("*").order("created_at", { ascending: false }).limit(20);
    if (error || !data) return [];
    return data
      .filter((r: any) => r.status === "published")
      .map((r: any) => ({
        id: r.id, title: r.title, content: r.content || "",
        important: !!r.important, createdAt: r.created_at || "",
        target: r.target || "all", targetClassIds: r.target_class_ids || [],
        targetGrades: r.target_grades || [],
        startDate: r.start_date || "", endDate: r.end_date || "",
        status: r.status || "draft",
      }));
  } catch { return []; }
}

export async function insertAnnouncement(a: any) {
  const s = sb();
  if (!s) return;
  const { data } = await s.from("announcements").insert([{
    id: a.id, title: a.title, content: a.content || "",
    target: a.target || "all", important: !!a.important,
    status: a.status || "published",
    start_date: a.startDate || koreaDate(),
    end_date: a.endDate || "",
    created_at: new Date().toISOString(),
  }]).select().single();
  if (data?.status === "published") {
    await createAnnouncementNotifications({
      id: data.id,
      title: data.title,
      content: data.content || "",
      important: !!data.important,
    });
  }
}

export async function updateAnnouncement(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.important !== undefined) update.important = patch.important;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.target !== undefined) update.target = patch.target;
  await s.from("announcements").update(update).eq("id", id);
}

/* ── Badges ── */
export async function fetchBadges() {
  const s = sb();
  if (!s) return [];
  try {
    let { data, error } = await s.from("badges").select("*").order("id");
    if (error) data = null;
    if (!data) return [];
    return data.filter((b: any) => b.active !== false);
  } catch { return []; }
}

export async function fetchStudentBadges(studentId: string) {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("student_badge_progress").select("*").eq("student_id", studentId);
    if (error || !data) return [];
    return data;
  } catch { return [];
  }
}

export async function upsertStudentBadge(studentId: string, badgeId: string, level: number, progress: number) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("student_badge_progress").upsert({
      id: `sbp_${studentId}_${badgeId}`,
      student_id: studentId, badge_id: badgeId,
      current_level: level, current_progress: progress,
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,badge_id" });
  } catch {}
}

/* ── Prayers ── */
export async function fetchPrayers(studentId?: string) {
  const s = sb();
  if (!s) return [];
  let q = s.from("prayer_requests").select("*").order("created_at", { ascending: false });
  if (studentId) q = q.eq("author_id", studentId);
  const { data, error } = await q;
  if (error || !data) return [];
  // 작성자 이름 조회 (author_id → students)
  const ids = data.map((r: any) => r.author_id).filter(Boolean);
  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: studs } = await s.from("students").select("id, name").in("id", ids);
    if (studs) studs.forEach((st: any) => { nameMap[st.id] = st.name; });
  }
  return data.map((r: any) => ({
    id: r.id, authorName: !r.anonymous ? (nameMap[r.author_id] || "") : "",
    anonymous: !!r.anonymous,
    content: r.content || "", prayerCount: Number(r.prayer_count) || 0,
    createdAt: r.created_at || "", prayedBy: [], studentId: r.author_id,
    classId: "", status: r.status || "active",
  }));
}

export async function insertPrayer(prayer: any) {
  const s = sb();
  if (!s) return null;
  const { data, error } = await s.from("prayer_requests").insert([{
    id: prayer.id, author_id: prayer.studentId,
    anonymous: !!prayer.anonymous, content: prayer.content,
    prayer_count: 0,
  }]).select().single();
  if (error || !data) return null;
  return data;
}

export async function updatePrayer(id: string, patch: any) {
  const s = sb();
  if (!s) return;
  const update: any = {};
  if (patch.content !== undefined) update.content = patch.content;
  await s.from("prayer_requests").update(update).eq("id", id);
}

export async function deletePrayer(id: string) {
  const s = sb();
  if (!s) return;
  await s.from("prayer_requests").delete().eq("id", id);
}

export async function recordPrayerParticipation(studentId: string, prayerId: string): Promise<boolean> {
  const s = sb();
  if (!s) return false;
  // 단일 RPC 호출: 참여 기록 + prayer_count 증가를 한 번에 (1일 1회 제한, 버퍼링 최소화)
  try {
    const { data, error } = await s.rpc("pray_for_participation", { p_student_id: studentId, p_prayer_id: prayerId });
    if (!error) return data === true;
  } catch {
    // RPC 미존재 시 아래 폴백 사용
  }
  const today = koreaDate();
  const { data: existing } = await s.from("prayer_participants").select("id")
    .eq("prayer_id", prayerId).eq("student_id", studentId).eq("pray_date", today).limit(1);
  if (existing && existing.length) return false;

  const { error } = await s.from("prayer_participants").upsert({
    student_id: studentId, prayer_id: prayerId, pray_date: today,
  }, { onConflict: "prayer_id,student_id,pray_date", ignoreDuplicates: true });
  if (error) return false;

  try {
    await s.rpc("increment_prayer_count" as any, { pid: prayerId });
  } catch {
    const { data } = await s.from("prayer_requests").select("prayer_count").eq("id", prayerId).single();
    if (data) {
      await s.from("prayer_requests").update({ prayer_count: (data.prayer_count || 0) + 1 }).eq("id", prayerId);
    }
  }
  return true;
}

export async function hasPrayedToday(studentId: string, prayerId: string, date?: string): Promise<boolean> {
  const s = sb();
  if (!s) return false;
  let q = s.from("prayer_participants").select("id").eq("prayer_id", prayerId).eq("student_id", studentId);
  if (date) q = q.eq("pray_date", date);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

export async function fetchPrayerParticipants(prayerId: string) {
  const s = sb();
  if (!s) return [];
  const { data } = await s.from("prayer_participants").select("student_id, prayed_at, pray_date").eq("prayer_id", prayerId).order("prayed_at", { ascending: false });
  if (!data) return [];
  // 학생별 중복 제거 (같은 학생이 여러 날 기도해도 한 명으로 표시)
  const seen = new Set<string>();
  const rows: any[] = [];
  data.forEach((r: any) => {
    if (seen.has(r.student_id)) return;
    seen.add(r.student_id);
    rows.push({ student_id: r.student_id, prayed_at: r.prayed_at, pray_date: r.pray_date || "" });
  });
  const ids = rows.map((r: any) => r.student_id);
  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: studs } = await s.from("students").select("id, name").in("id", ids);
    if (studs) studs.forEach((st: any) => { nameMap[st.id] = st.name; });
  }
  // 학생별 이 기도제목에 기도한 횟수 (같은 기도제목에서 여러 날 기도한 횟수)
  const { data: allPrayers } = await s.from("prayer_participants")
    .select("student_id, prayer_id, pray_date").eq("prayer_id", prayerId);
  const countMap: Record<string, number> = {};
  if (allPrayers) allPrayers.forEach((r: any) => { countMap[r.student_id] = (countMap[r.student_id] || 0) + 1; });
  return rows.map((r) => ({
    studentId: r.student_id,
    studentName: nameMap[r.student_id] || "(알수없음)",
    prayedAt: r.prayed_at || "",
    prayDate: r.pray_date,
    totalPrayerCount: countMap[r.student_id] || 0,
  }));
}


/* ── Notifications (in-app prayer alerts, etc.) ── */
export async function fetchNotifications(userId: string) {
  const s = sb();
  if (!s) return [];
  const { data } = await s.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (!data) return [];
  const prefs = await fetchPushPreferences(userId);
  return data.map((r: any) => ({
    id: r.id, type: r.type || 'prayer', title: r.title || '',
    body: r.body || '', relatedId: r.related_id || '',
    isRead: r.is_read === true, createdAt: r.created_at || '',
  })).filter((n: any) => allowsNotificationType(prefs, n.type || ""));
}

export async function insertNotification(n: { userId: string; type?: string; title?: string; body?: string; relatedId?: string }) {
  const s = sb();
  if (!s) return null;
  const type = n.type || "prayer";
  const prefs = await fetchPushPreferences(n.userId);
  if (!allowsNotificationType(prefs, type)) return null;
  const { data } = await s.from('notifications').insert([{
    id: 'nt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    user_id: n.userId, type,
    title: n.title || '', body: n.body || '', related_id: n.relatedId || '',
    is_read: false,
  }]).select().single();
  return data || null;
}

export async function sendPushForNotification(notificationId: string) {
  const s = sb();
  if (!s) return;
  try {
    const { data: notification } = await s.from("notifications")
      .select("user_id, type")
      .eq("id", notificationId)
      .limit(1)
      .single();
    if (!notification) return;
    const prefs = await fetchPushPreferences(notification.user_id);
    if (!allowsNotificationType(prefs, notification.type || "")) return;
    await s.functions.invoke("send-prayer-push", { body: { notificationId } });
  } catch {}
}

export async function markNotificationRead(id: string) {
  const s = sb();
  if (!s) return;
  await s.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  const s = sb();
  if (!s) return;
  await s.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export type PushCategoryPreferences = {
  announcement: boolean;
  prayer: boolean;
  praise: boolean;
  qt: boolean;
};

export function notificationTypeToPushCategory(type: string): keyof PushCategoryPreferences | null {
  if (type === "announcement" || type === "notice") return "announcement";
  if (type === "prayer") return "prayer";
  if (type === "praise") return "praise";
  if (type === "qt" || type === "qt_comment" || type === "qt_share") return "qt";
  return null;
}

export function allowsNotificationType(prefs: PushCategoryPreferences, type: string) {
  const category = notificationTypeToPushCategory(type);
  return category ? prefs[category] !== false : true;
}

const DEFAULT_PUSH_PREFERENCES: PushCategoryPreferences = {
  announcement: true,
  prayer: true,
  praise: true,
  qt: true,
};

function mapPushPreferences(row: any): PushCategoryPreferences {
  return {
    announcement: row?.announcement_enabled !== false,
    prayer: row?.prayer_enabled !== false,
    praise: row?.praise_enabled !== false,
    qt: row?.qt_enabled !== false,
  };
}

export async function fetchPushPreferences(userId: string): Promise<PushCategoryPreferences> {
  const s = sb();
  if (!s) return DEFAULT_PUSH_PREFERENCES;
  try {
    const { data } = await s.from("push_subscriptions")
      .select("announcement_enabled, prayer_enabled, praise_enabled, qt_enabled, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);
    return data?.[0] ? mapPushPreferences(data[0]) : DEFAULT_PUSH_PREFERENCES;
  } catch {
    return DEFAULT_PUSH_PREFERENCES;
  }
}

export async function updatePushPreferences(userId: string, patch: Partial<PushCategoryPreferences>) {
  const s = sb();
  if (!s) return false;
  const update: any = { updated_at: new Date().toISOString() };
  if (patch.announcement !== undefined) update.announcement_enabled = patch.announcement;
  if (patch.prayer !== undefined) update.prayer_enabled = patch.prayer;
  if (patch.praise !== undefined) update.praise_enabled = patch.praise;
  if (patch.qt !== undefined) update.qt_enabled = patch.qt;
  try {
    const { error } = await s.from("push_subscriptions").update(update).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchPushSubscription(userId: string) {
  const s = sb();
  if (!s) return null;
  const { data } = await s.from("push_subscriptions")
    .select("endpoint, enabled")
    .eq("user_id", userId)
    .eq("enabled", true)
    .limit(1);
  return data?.[0] || null;
}

export async function fetchPushSubscriptionByEndpoint(endpoint: string) {
  const s = sb();
  if (!s || !endpoint) return null;
  const { data } = await s.from("push_subscriptions")
    .select("user_id, endpoint, enabled")
    .eq("endpoint", endpoint)
    .limit(1);
  const row = data?.[0];
  return row ? { userId: row.user_id as string, endpoint: row.endpoint as string, enabled: row.enabled === true } : null;
}

export async function upsertPushSubscription(userId: string, subscription: PushSubscriptionJSON) {
  const s = sb();
  const endpoint = subscription.endpoint || "";
  if (!s || !endpoint) return false;
  const prefs = await fetchPushPreferences(userId);
  const { error } = await s.from("push_subscriptions").upsert({
    id: "ps_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    user_id: userId,
    endpoint,
    subscription,
    enabled: true,
    announcement_enabled: prefs.announcement,
    prayer_enabled: prefs.prayer,
    praise_enabled: prefs.praise,
    qt_enabled: prefs.qt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) console.error("Failed to upsert push subscription:", error);
  return !error;
}

export async function disablePushSubscription(userId: string, endpoint?: string) {
  const s = sb();
  if (!s) return;
  let query = s.from("push_subscriptions").update({ enabled: false, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (endpoint) query = query.eq("endpoint", endpoint);
  await query;
}

export async function createAnnouncementNotifications(a: { id: string; title: string; content?: string; important?: boolean }) {
  const s = sb();
  if (!s) return;
  try {
    const students = await fetchActiveStudents();
    const rows = [];
    for (const student of students) {
      const prefs = await fetchPushPreferences(student.id);
      if (!allowsNotificationType(prefs, "announcement")) continue;
      rows.push({
        id: "nt_" + Date.now() + "_" + student.id + "_" + Math.random().toString(36).slice(2, 5),
        user_id: student.id,
        type: "announcement",
        title: a.important ? "중요 공지" : "공지 알림",
        body: a.title + (a.content ? ` · ${String(a.content).slice(0, 30)}` : ""),
        related_id: a.id,
        is_read: false,
      });
    }
    if (!rows.length) return;
    const { data } = await s.from("notifications").insert(rows).select("id");
    await Promise.all((data || []).map((n: any) => sendPushForNotification(n.id)));
  } catch {}
}

export async function createMissionNotifications(m: { id: string; title: string; reward?: number }) {
  const s = sb();
  if (!s) return;
  try {
    const students = await fetchActiveStudents();
    const rows = [];
    for (const student of students) {
      const prefs = await fetchPushPreferences(student.id);
      if (!allowsNotificationType(prefs, "announcement")) continue;
      rows.push({
        id: "nt_" + Date.now() + "_" + student.id + "_" + Math.random().toString(36).slice(2, 5),
        user_id: student.id,
        type: "announcement",
        title: "미션 알림",
        body: `${m.title}${m.reward ? ` · +${m.reward}D` : ""}`,
        related_id: m.id,
        is_read: false,
      });
    }
    if (!rows.length) return;
    const { data } = await s.from("notifications").insert(rows).select("id");
    await Promise.all((data || []).map((n: any) => sendPushForNotification(n.id)));
  } catch {}
}

/* ── Batch Prayer Data (3 queries total regardless of prayer count) ── */
export async function fetchAllPrayerData(prayerIds: string[], studentId: string, today: string): Promise<{
  commentsMap: Record<string, any[]>;
  participantsMap: Record<string, any[]>;
  prayedTodayMap: Record<string, boolean>;
}> {
  const s = sb();
  const commentsMap: Record<string, any[]> = {};
  const participantsMap: Record<string, any[]> = {};
  const prayedTodayMap: Record<string, boolean> = {};

  if (!s || !prayerIds.length) {
    prayerIds.forEach(id => { commentsMap[id] = []; participantsMap[id] = []; prayedTodayMap[id] = false; });
    return { commentsMap, participantsMap, prayedTodayMap };
  }

  // 1) All participants in ONE query
  const { data: allParticipants } = await s.from("prayer_participants")
    .select("prayer_id, student_id, prayed_at, pray_date")
    .in("prayer_id", prayerIds)
    .order("prayed_at", { ascending: false });

  // 2) All comments in ONE query
  const { data: allComments } = await s.from("prayer_comments")
    .select("prayer_id, id, student_id, student_name, content, created_at")
    .in("prayer_id", prayerIds)
    .order("created_at", { ascending: true });

  // 3) Student name mapping - use in-memory if possible, else query
  const studentIds = new Set<string>();
  (allParticipants || []).forEach((r: any) => studentIds.add(r.student_id));
  (allComments || []).forEach((r: any) => { if (r.student_id) studentIds.add(r.student_id); });
  const nameMap: Record<string, string> = {};
  if (studentIds.size) {
    const { data: studs } = await s.from("students").select("id, name").in("id", [...studentIds]);
    (studs || []).forEach((st: any) => { nameMap[st.id] = st.name; });
  }

  // 기도제목별 × 학생별 기도 횟수 집계 (중복 없이 per-prayer count)
  const countMap: Record<string, Record<string, number>> = {};
  (allParticipants || []).forEach((r: any) => {
    countMap[r.prayer_id] = countMap[r.prayer_id] || {};
    countMap[r.prayer_id][r.student_id] = (countMap[r.prayer_id][r.student_id] || 0) + 1;
  });

  // Populate maps
  prayerIds.forEach(id => {
    // Comments
    commentsMap[id] = (allComments || [])
      .filter((c: any) => c.prayer_id === id)
      .map((c: any) => ({
        id: c.id, prayerId: c.prayer_id, studentId: c.student_id,
        studentName: c.student_name || nameMap[c.student_id] || "",
        content: c.content, createdAt: c.created_at || "",
      }));

    // Participants (deduplicated per student)
    const seen = new Set<string>();
    participantsMap[id] = (allParticipants || [])
      .filter((p: any) => p.prayer_id === id)
      .filter((p: any) => {
        if (seen.has(p.student_id)) return false;
        seen.add(p.student_id);
        return true;
      })
      .map((p: any) => ({
        studentId: p.student_id,
        studentName: nameMap[p.student_id] || "(알수없음)",
        prayedAt: p.prayed_at || "",
        prayDate: p.pray_date || "",
        totalPrayerCount: countMap[id]?.[p.student_id] || 0,
      }));

    // Prayed today
    prayedTodayMap[id] = (allParticipants || []).some(
      (p: any) => p.prayer_id === id && p.student_id === studentId && p.pray_date === today
    );
  });

  return { commentsMap, participantsMap, prayedTodayMap };
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
  const { error } = await s.from("daily_quests").insert({
    id: `dq_${studentId}_${questId}_${date}`,
    student_id: studentId, quest_id: questId, completion_date: date,
    mileage_awarded: mileage, xp_awarded: xp,
  });
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
  // student_name/class_name/actor_name 컬럼은 일부 환경에 없어 제외
  // (관리자 기록 화면은 students 테이블에서 이름을 매핑하므로 불필요)
  await s.from("mileage_transactions").insert([{
    id: tx.id || `tx_${Date.now()}`, student_id: tx.studentId || tx.student_id,
    type: tx.type || "", description: tx.description || "",
    amount: tx.amount || 0, date: tx.date || koreaDate(),
    created_at: new Date().toISOString(),
  }]);
}

function mapTalentDonationResult(r: any): TalentDonationResult {
  return {
    donationId: r.donation_id || r.id || "",
    senderId: r.sender_id || "",
    senderName: r.sender_name || "관리자",
    recipientId: r.recipient_id || "",
    recipientName: r.recipient_name || "",
    message: r.message || "",
    donationAmount: Number(r.donation_amount) || 0,
    recipientBalanceBefore: r.recipient_balance_before == null ? undefined : Number(r.recipient_balance_before) || 0,
    probabilityTier: r.probability_tier || undefined,
    selectedMultiplier: r.selected_multiplier == null ? undefined : Number(r.selected_multiplier) || 0,
    giftAmount: r.gift_amount == null ? undefined : Number(r.gift_amount) || 0,
    senderBalanceBefore: Number(r.sender_balance_before) || 0,
    senderBalanceAfter: Number(r.sender_balance_after) || 0,
    recipientBalanceAfter: r.recipient_balance_after == null ? undefined : Number(r.recipient_balance_after) || 0,
    remainingGiftsToday: r.remaining_gifts_today == null ? undefined : Number(r.remaining_gifts_today) || 0,
    status: (r.status || "pending") as "pending" | "opened",
    openedAt: r.opened_at || undefined,
    createdAt: r.created_at || "",
  };
}

function donationErrorMessage(message?: string) {
  const raw = String(message || "");
  if (raw.includes("CANNOT_DONATE_TO_SELF")) return "자기 자신에게는 선물할 수 없어요.";
  if (raw.includes("DONATION_TOO_SMALL")) return "선물은 최소 10달란트부터 가능해요.";
  if (raw.includes("DONATION_TOO_LARGE")) return "한 번에 최대 100달란트까지 선물할 수 있어요.";
  if (raw.includes("DAILY_DONATION_LIMIT_REACHED")) return "오늘 가능한 선물 3회를 모두 사용했어요.";
  if (raw.includes("RECIPIENT_ALREADY_GIFTED_TODAY")) return "같은 친구에게는 하루에 한 번만 선물할 수 있어요.";
  if (raw.includes("INSUFFICIENT_TALENTS")) return "보유 달란트가 부족해요.";
  if (raw.includes("RECIPIENT_NOT_FOUND")) return "선물 받을 친구를 찾을 수 없어요.";
  if (raw.includes("SENDER_NOT_FOUND")) return "보내는 사용자를 찾을 수 없어요.";
  if (raw.includes("NO_RANDOM_RECIPIENT_AVAILABLE")) return "오늘 랜덤으로 선물할 수 있는 친구가 없어요.";
  if (raw.includes("GIFT_NOT_FOUND")) return "선물을 찾을 수 없어요.";
  if (raw.includes("GIFT_RECIPIENT_MISMATCH")) return "내게 온 선물이 아니에요.";
  if (raw.includes("GIFT_ALREADY_OPENED")) return "이미 열어본 선물이에요.";
  return raw || "선물 보내기에 실패했어요.";
}

export async function fetchTalentDonationStatus(senderId: string): Promise<TalentDonationStatus> {
  const s = sb();
  if (!s || !senderId) return { donationCountToday: 0, remainingGiftsToday: 3, giftedRecipientIds: [] };
  try {
    const { data, error } = await s.rpc("get_talent_donation_status", { p_sender_id: senderId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
      donationCountToday: Number(row?.donation_count_today) || 0,
      remainingGiftsToday: Number(row?.remaining_gifts_today ?? 3) || 0,
      giftedRecipientIds: row?.gifted_recipient_ids || [],
    };
  } catch {
    return { donationCountToday: 0, remainingGiftsToday: 3, giftedRecipientIds: [] };
  }
}

export async function createTalentDonation(senderId: string, recipientId: string, donationAmount: number, message: string): Promise<TalentDonationResult> {
  const s = sb();
  if (!s) throw new Error("Supabase가 설정되어 있지 않아요.");
  const { data, error } = await s.rpc("create_talent_donation", {
    p_sender_id: senderId,
    p_recipient_id: recipientId,
    p_donation_amount: donationAmount,
    p_message: message,
  });
  if (error) throw new Error(donationErrorMessage(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("선물 처리 결과를 확인할 수 없어요.");
  return mapTalentDonationResult(row);
}

export async function createRandomTalentDonation(senderId: string, donationAmount: number, message: string): Promise<TalentDonationResult> {
  const s = sb();
  if (!s) throw new Error("Supabase가 설정되어 있지 않아요.");
  const { data, error } = await s.rpc("create_random_talent_donation", {
    p_sender_id: senderId,
    p_donation_amount: donationAmount,
    p_message: message,
  });
  if (error) throw new Error(donationErrorMessage(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("선물 처리 결과를 확인할 수 없어요.");
  return mapTalentDonationResult(row);
}

export async function createAdminTalentGift(recipientId: string, donationAmount: number, message: string): Promise<TalentDonationResult> {
  const s = sb();
  if (!s) throw new Error("Supabase가 설정되어 있지 않아요.");
  const { data, error } = await s.rpc("create_admin_talent_gift", {
    p_recipient_id: recipientId,
    p_donation_amount: donationAmount,
    p_message: message,
  });
  if (error) throw new Error(donationErrorMessage(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("관리자 선물 처리 결과를 확인할 수 없어요.");
  return mapTalentDonationResult(row);
}

export async function openTalentDonation(recipientId: string, donationId: string): Promise<TalentDonationResult> {
  const s = sb();
  if (!s) throw new Error("Supabase가 설정되어 있지 않아요.");
  const { data, error } = await s.rpc("open_talent_donation", {
    p_recipient_id: recipientId,
    p_donation_id: donationId,
  });
  if (error) throw new Error(donationErrorMessage(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("선물 결과를 확인할 수 없어요.");
  return mapTalentDonationResult(row);
}

export async function fetchReceivedTalentDonations(recipientId: string, limit = 50): Promise<TalentDonationHistory[]> {
  const s = sb();
  if (!s || !recipientId) return [];
  try {
    const { data, error } = await s.from("talent_donations")
      .select("*")
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return mapTalentDonationRows(data);
  } catch {
    return [];
  }
}

export async function fetchTalentDonationHistory(limit = 200): Promise<TalentDonationHistory[]> {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("talent_donations")
      .select("*")
      .not("sender_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return mapTalentDonationRows(data);
  } catch {
    return [];
  }
}

async function mapTalentDonationRows(data: any[]): Promise<TalentDonationHistory[]> {
  const s = sb();
  if (!s) return [];
    const ids = [...new Set(data.flatMap((r: any) => [r.sender_id, r.recipient_id]).filter(Boolean))];
    const nameMap: Record<string, string> = {};
    if (ids.length) {
      const { data: studs } = await s.from("students").select("id, name").in("id", ids);
      (studs || []).forEach((st: any) => { nameMap[st.id] = st.name; });
    }
    return data.map((r: any) => ({
      id: r.id,
      senderId: r.sender_id,
      senderName: r.sender_id ? (nameMap[r.sender_id] || "(알수없음)") : "관리자",
      recipientId: r.recipient_id,
      recipientName: nameMap[r.recipient_id] || "(알수없음)",
      message: r.message || "",
      donationAmount: Number(r.donation_amount) || 0,
      status: (r.status || "pending") as "pending" | "opened",
      recipientBalanceBefore: r.recipient_balance_before == null ? undefined : Number(r.recipient_balance_before) || 0,
      probabilityTier: r.probability_tier || undefined,
      selectedMultiplier: r.selected_multiplier == null ? undefined : Number(r.selected_multiplier) || 0,
      giftAmount: Number(r.gift_amount) || 0,
      senderBalanceBefore: Number(r.sender_balance_before) || 0,
      senderBalanceAfter: Number(r.sender_balance_after) || 0,
      recipientBalanceAfter: r.recipient_balance_after == null ? undefined : Number(r.recipient_balance_after) || 0,
      donationDate: r.donation_date || "",
      openedAt: r.opened_at || undefined,
      createdAt: r.created_at || "",
    }));
}

export async function fetchTalentDonationRankings(limit = 10): Promise<TalentDonationRanking[]> {
  const s = sb();
  if (!s) return [];
  try {
    const { data: students, error: studentsError } = await s.from("students")
      .select("id, name, class_id, role, is_teacher, active")
      .eq("active", true);
    if (studentsError || !students) return [];

    const { data, error } = await s.from("talent_donations")
      .select("sender_id, donation_amount")
      .not("sender_id", "is", null);
    if (error) return [];

    const totals: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      if (!r.sender_id) return;
      totals[r.sender_id] = (totals[r.sender_id] || 0) + (Number(r.donation_amount) || 0);
    });

    const rows = students
      .filter((st: any) => st.is_teacher !== true && (st.role || "student") === "student")
      .map((st: any) => ({
      studentId: st.id,
      studentName: st.name || "이름없음",
      classId: st.class_id || "",
      grade: gradeFromClassId(st.class_id || ""),
      donatedAmount: totals[st.id] || 0,
    }));
    return rows.sort((a, b) => b.donatedAmount - a.donatedAmount || a.studentName.localeCompare(b.studentName, "ko")).slice(0, limit);
  } catch {
    return [];
  }
}

/* ── Prayer Comments ── */
export async function fetchPrayerComments(prayerId: string) {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("prayer_comments").select("*").eq("prayer_id", prayerId).order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id, prayerId: r.prayer_id, studentId: r.student_id,
      studentName: r.student_name || "", content: r.content,
      createdAt: r.created_at || "",
    }));
  } catch { return []; }
}

export async function addPrayerComment(comment: any) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("prayer_comments").insert([{
      id: "pc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      prayer_id: comment.prayerId, student_id: comment.studentId,
      student_name: comment.studentName || "", content: comment.content,
      created_at: new Date().toISOString(),
    }]);
  } catch {}
}

export async function updatePrayerComment(id: string, content: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("prayer_comments").update({ content }).eq("id", id);
  } catch {}
}

export async function deletePrayerComment(id: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("prayer_comments").delete().eq("id", id);
  } catch {}
}

/* ── Mission Comments ── */
export async function fetchMissionComments(missionIds: string[]) {
  const s = sb();
  const commentsMap: Record<string, any[]> = {};
  missionIds.forEach(id => { commentsMap[id] = []; });
  if (!s || !missionIds.length) return commentsMap;
  try {
    await ensureMissionCommentPrivateColumn();
    const { data, error } = await s.from("mission_comments")
      .select("mission_id, id, student_id, student_name, content, private, created_at")
      .in("mission_id", missionIds)
      .order("created_at", { ascending: true });
    if (error || !data) return commentsMap;
    data.forEach((r: any) => {
      const missionId = r.mission_id;
      if (!commentsMap[missionId]) commentsMap[missionId] = [];
      commentsMap[missionId].push({
        id: r.id, missionId, studentId: r.student_id,
        studentName: r.student_name || "", content: r.content || "",
        private: r.private === true,
        createdAt: r.created_at || "",
      });
    });
    return commentsMap;
  } catch {
    return commentsMap;
  }
}

export async function addMissionComment(comment: any) {
  const s = sb();
  if (!s) return null;
  try {
    await ensureMissionCommentPrivateColumn();
    const { data } = await s.from("mission_comments").insert([{
      id: "mc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      mission_id: comment.missionId, student_id: comment.studentId,
      student_name: comment.studentName || "", content: comment.content,
      private: comment.private === true,
      created_at: new Date().toISOString(),
    }]).select().single();
    return data || null;
  } catch {
    return null;
  }
}

let missionCommentPrivateColumnReady = false;
async function ensureMissionCommentPrivateColumn() {
  if (missionCommentPrivateColumnReady) return;
  const s = sb();
  if (!s) return;
  try {
    await s.rpc("exec_sql", { sql: "ALTER TABLE mission_comments ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT FALSE;" } as any);
  } catch {}
  missionCommentPrivateColumnReady = true;
}

export async function updateMissionComment(id: string, content: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("mission_comments").update({ content }).eq("id", id);
  } catch {}
}

export async function deleteMissionComment(id: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("mission_comments").delete().eq("id", id);
  } catch {}
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
  // Get the record first to find associated shared post
  const { data: record } = await s.from("qt_records").select("student_id, date").eq("id", id).single();
  if (record) {
    // Delete shared post for this date by this student
    const { data: sharedPost } = await s.from("shared_qt_posts").select("id").eq("student_id", record.student_id).eq("date", record.date).single();
    if (sharedPost) {
      // Delete comments first
      await s.from("qt_comments").delete().eq("post_id", sharedPost.id);
      // Delete shared post
      await s.from("shared_qt_posts").delete().eq("id", sharedPost.id);
    }
  }
  await s.from("qt_records").delete().eq("id", id);
}

/* ── Attendance ── */
/** Get Korean year + week number from a date string */
export function yearWeekFromDate(dateStr: string): { year: number; week: number } {
  const d = new Date(dateStr + "T00:00:00");
  return { year: d.getFullYear(), week: getWeekNumber(dateStr) };
}

export async function fetchAttendanceRecords(year?: number, week?: number) {
  const s = sb();
  if (!s) return [];
  let q = s.from("attendance_records").select("*");
  if (year) q = q.eq("year", year);
  if (week) q = q.eq("week", week);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id,
    year: r.year, week: r.week,
    state: r.state || "absent", checkTime: r.check_time || "",
    method: r.method || "manual",
  }));
}

export async function upsertAttendanceRecord(record: any) {
  const s = sb();
  if (!s) return;
  await s.from("attendance_records").upsert({
    id: record.id, student_id: record.studentId,
    year: record.year, week: record.week,
    state: record.state || "absent",
    check_time: record.checkTime || new Date().toISOString(),
    method: record.method || "manual",
  }, { onConflict: "student_id,year,week" });
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
  const { data, error } = await s.from("attendance_records").select("id, state").eq("student_id", studentId);
  if (error || !data) return 0;
  return data.filter((r: any) => r.state === "present" || r.state === "late").length;
}

export async function fetchStudentAttendanceForDate(studentId: string, date: string) {
  const s = sb();
  if (!s) return null;
  const { year, week } = yearWeekFromDate(date);
  const { data } = await s.from("attendance_records").select("*").eq("student_id", studentId).eq("year", year).eq("week", week).limit(1);
  return data && data.length ? data[0] : null;
}

/* ── Rewards / Store ── */
export async function fetchRewards() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("store_products").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.filter((r: any) => r.active !== false);
  } catch { return []; }
}

export async function fetchAllRewards() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("store_products").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function insertReward(r: any) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("store_products").insert([{
      id: r.id, name: r.name, description: r.description || "",
      mileage_cost: r.mileageCost || 0, inventory: r.inventory || 0,
      active: true, redemption_limit: r.redemptionLimit || 1,
      category: r.category || "", type: r.type || "buy",
    }]);
  } catch {}
}

export async function updateRewardField(rewardId: string, field: string, value: any) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("store_products").update({ [field]: value }).eq("id", rewardId);
  } catch (e) { console.error("Failed to update reward:", e); }
}

export async function fetchRedemptions() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("store_requests").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function insertRedemption(r: any) {
  const s = sb();
  if (!s) return null;
  try {
    const { data, error } = await s.from("store_requests").insert([{
      id: r.id, student_id: r.studentId, student_name: r.studentName || "",
      product_id: r.rewardId, product_name: r.rewardName || "",
      mileage_cost: r.mileageCost || 0, status: "requested",
    }]).select().single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function storeTransaction(studentId: string, amount: number, reason: string, sourceType: string = "store", sourceId: string = "") {
  const s = sb();
  if (!s) return false;
  try {
    // Record in mileage_transactions
    await s.from("mileage_transactions").insert([{
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      student_id: studentId, amount, type: amount >= 0 ? "store_sale" : "store_purchase",
      reason, source_type: sourceType, source_id: sourceId, status: "completed",
      date: new Date().toISOString(),
    }]);
    // Update student talents
    const { data: student } = await s.from("students").select("talents").eq("id", studentId).single();
    if (student) {
      const newTalents = Math.max(0, (student.talents || 0) + amount);
      await s.from("students").update({ talents: newTalents }).eq("id", studentId);
    }
    return true;
  } catch { return false; }
}

export async function updateRedemption(id: string, status: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("store_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
  } catch {}
}

/* ── Seasons & Settings ── */
export async function fetchSeason() {
  const s = sb();
  if (!s) return null;
  try {
    const { data, error } = await s.from("seasons").select("*").limit(5);
    if (error || !data || !data.length) return null;
    const active = data.find((r: any) => r.active !== false) || data[0];
    const r = active;
    return { id: r.id, name: r.label || r.name || "", subtitle: r.title || r.subtitle || "", startDate: r.start_date || "", endDate: r.end_date || "", active: true, sharedGoalXp: r.shared_goal_xp || r.target_xp || 50000, sharedReward: r.shared_reward || r.reward || "" };
  } catch { return null; }
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
      prayerMileage: Number(r.prayer_mileage) || 10,
      weeklyMissionReward: Number(r.weekly_mission_reward) || 30,
      nameDisplayPolicy: r.name_display_policy || "full",
      anonymousPrayerEnabled: !!r.anonymous_prayer_enabled,
      mileageShopEnabled: !!r.mileage_shop_enabled,
    };
  }
  return { defaultAttendanceMileage: 20, defaultQTMileage: 20, prayerMileage: 10, weeklyMissionReward: 30, nameDisplayPolicy: "full", anonymousPrayerEnabled: true, mileageShopEnabled: true };
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
    timestamp: r.created_at ? (r.created_at.slice(0, 10)) : "",
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
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id, studentName: r.student_name || "",
    classId: r.class_id || "", className: r.class_name || "",
    passage: r.passage || "", verse: r.verse || "",
    remembered: r.remembered || "", application: r.application || "",
    reward: r.reward || 0, date: r.date || "",
    commentCount: r.comment_count || 0, likedBy: r.liked_by || [],
    createdAt: r.created_at || "",
  }));
}

export async function createSharedPost(post: any) {
  const s = sb();
  if (!s) return false;
  // 하루 1회 제한: student_id + date 유니크 제약으로 중복 방지
  const { error } = await s.from("shared_qt_posts").upsert({
    id: post.id, student_id: post.studentId, student_name: post.studentName || "",
    class_id: post.classId || "", class_name: post.className || "",
    passage: post.passage || "", verse: post.verse || "",
    remembered: post.remembered || "", application: post.application || "",
    reward: post.reward || 0, date: post.date || koreaDate(),
    comment_count: 0, liked_by: [],
  }, { onConflict: "student_id,date", ignoreDuplicates: true });
  if (error) return false;
  return true;
}

export async function unshareQT(studentId: string, date: string) {
  const s = sb();
  if (!s) return false;
  const { data: post } = await s.from("shared_qt_posts").select("id").eq("student_id", studentId).eq("date", date).single();
  if (!post) return false;
  // Delete comments first
  await s.from("qt_comments").delete().eq("post_id", post.id);
  // Delete shared post
  await s.from("shared_qt_posts").delete().eq("id", post.id);
  return true;
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

export async function fetchCommentsForPosts(postIds: string[]) {
  const s = sb();
  const commentsMap: Record<string, any[]> = {};
  postIds.forEach(id => { commentsMap[id] = []; });
  if (!s || postIds.length === 0) return commentsMap;

  const { data, error } = await s.from("qt_comments")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  if (error || !data) return commentsMap;

  data.forEach((r: any) => {
    const postId = r.post_id;
    if (!commentsMap[postId]) commentsMap[postId] = [];
    commentsMap[postId].push({
      id: r.id, postId, studentId: r.student_id,
      studentName: r.student_name || "", content: r.content || "",
      createdAt: r.created_at || "",
    });
  });
  return commentsMap;
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
  try {
    const { data: post } = await s.from("shared_qt_posts").select("comment_count").eq("id", comment.postId).single();
    await s.from("shared_qt_posts").update({ comment_count: ((post?.comment_count || 0) + 1) }).eq("id", comment.postId);
  } catch {}
}

export async function updateComment(commentId: string, content: string) {
  const s = sb();
  if (!s) return;
  await s.from("qt_comments").update({ content }).eq("id", commentId);
}

export async function deleteComment(commentId: string, postId: string) {
  const s = sb();
  if (!s) return;
  await s.from("qt_comments").delete().eq("id", commentId);
  try {
    const { data: post } = await s.from("shared_qt_posts").select("comment_count").eq("id", postId).single();
    await s.from("shared_qt_posts").update({ comment_count: Math.max(0, (post?.comment_count || 0) - 1) }).eq("id", postId);
  } catch {}
}

/* ── All Mileage Transactions (for admin audit) ── */
export async function fetchAllTransactions() {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("mileage_transactions").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error || !data) return [];
  // Get student names
  const { data: studs } = await s.from("students").select("id, name, class_id");
  const nameMap: Record<string, { name: string; classId: string }> = {};
  if (studs) studs.forEach((st: any) => { nameMap[st.id] = { name: st.name, classId: st.class_id || "" }; });
  return data.map((r: any) => ({
    id: r.id, studentId: r.student_id,
    studentName: nameMap[r.student_id]?.name || "(알수없음)",
    className: nameMap[r.student_id]?.classId || "",
    type: r.type || "", description: r.description || "",
    amount: Number(r.amount) || 0, date: r.date || "",
    createdAt: r.created_at || "",
  }));
}

/* ── Audit Logs ── */
export async function fetchAuditLogs() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id, timestamp: r.created_at || "", actorName: r.actor_id || "",
      actorRole: r.actor_role || "", actionType: r.action || "",
      target: r.target_type || "", description: r.description || "",
    }));
  } catch { return []; }
}

export async function addAuditLog(log: any) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("audit_logs").insert([{
      id: `al_${Date.now()}`, actor_id: log.actorName || "",
      actor_role: log.actorRole || "", action: log.actionType || "",
      target_type: log.target || "", description: log.description || "",
      created_at: new Date().toISOString(),
    }]);
  } catch {}
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
  return student?.mileage || 0;
}

export async function resetAllTalents(): Promise<boolean> {
  const s = sb();
  if (!s) return false;
  const { error } = await s.rpc("admin_reset_all_talents");
  return !error;
}

export async function updateStudentField(studentId: string, field: string, value: any) {
  const s = sb();
  if (!s) return;
  await s.from("students").update({ [field]: value }).eq("id", studentId);
}

export async function updateTeacherField(teacherId: string, field: string, value: any) {
  const s = sb();
  if (!s) return;
  await s.from("teachers").update({ [field]: value }).eq("id", teacherId);
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

/* ── QT Streak Calculation (longest consecutive days) ── */
export async function calculateQTStreak(studentId: string): Promise<number> {
  const s = sb();
  if (!s) return 0;
  const { data } = await s.from("qt_records").select("date").eq("student_id", studentId).order("date", { ascending: false });
  if (!data || !data.length) return 0;
  
  // Get all unique dates
  const dates = [...new Set(data.map((r: any) => r.date))].sort().reverse();
  if (dates.length === 0) return 0;
  
  // Calculate longest streak
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

/* ── Badge ID to Metric Type Mapping ── */
const BADGE_METRIC_MAP: Record<string, string> = {
  b1: "qt_count", b2: "attendance_count", b3: "prayer_count",
  b4: "daily_quest_count", b5: "mileage_total", b6: "qt_streak", b7: "praise_count",
};

export function getBadgeMetricType(badgeId: string): string {
  return BADGE_METRIC_MAP[badgeId] || "";
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
      return data?.filter((r: any) => r.state === "present" || r.state === "late" || r.state === "online").length || 0;
    }
    case "prayer_count": {
      const { data } = await s.from("prayer_participants").select("id").eq("student_id", studentId);
      return data?.length || 0;
    }
    case "daily_quest_count": {
      const { data } = await s.from("daily_quests").select("id").eq("student_id", studentId);
      return data?.length || 0;
    }
    case "mileage_total": {
      const { data } = await s.from("students").select("talents").eq("id", studentId).single();
      return Number(data?.talents) || 0;
    }
    case "qt_streak": {
      return await calculateQTStreak(studentId);
    }
    case "praise_count": {
      const { data } = await s.from("praises").select("id").eq("praiser_id", studentId);
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

  const { data: students } = await s.from("students").select("id, class_id");
  if (!students) return stats;
  const studentClassMap: Record<string, string> = {};
  students.forEach((st: any) => { studentClassMap[st.id] = st.class_id; });

  const { data: qtRecords } = await s.from("qt_records").select("student_id");
  if (qtRecords) qtRecords.forEach((r: any) => { const cid = studentClassMap[r.student_id]; if (cid && stats[cid]) stats[cid].qtCount++; });

  const { data: missions } = await s.from("completed_missions").select("student_id");
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
  return students.sort((a: any, b: any) => (b.mileage || 0) - (a.mileage || 0)).slice(0, 10);
}

export async function fetchClassRankings() {
  const classes = await fetchClasses();
  return classes.sort((a, b) => (b.xp || 0) - (a.xp || 0));
}

/* ── Badge Levels (multi-level from DB) ── */
export async function fetchBadgeLevels(badgeId?: string) {
  const s = sb();
  if (!s) return [];
  try {
    let q = s.from("badge_levels").select("*").order("level");
    if (badgeId) q = q.eq("badge_id", badgeId);
    const { data, error } = await q;
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id, badgeId: r.badge_id, level: r.level, threshold: r.threshold,
      rewardMileage: r.reward_mileage || 0, rewardXp: r.reward_xp || 0,
      title: r.title || "", description: r.description || "",
    }));
  } catch { return []; }
}

export async function fetchAllBadgeLevels() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("badge_levels").select("*").order("badge_id").order("level");
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id, badgeId: r.badge_id, level: r.level, threshold: r.threshold,
      rewardMileage: r.reward_mileage || 0, rewardXp: r.reward_xp || 0,
      title: r.title || "", description: r.description || "",
    }));
  } catch { return []; }
}

export async function fetchStudentBadgeProgress(studentId: string) {
  const s = sb();
  if (!s) return [];
  const { data, error } = await s.from("student_badge_progress").select("*").eq("student_id", studentId);
  if (error || !data) return [];
  return data.map((r: any) => ({
    studentId: r.student_id, badgeId: r.badge_id,
    currentLevel: r.current_level || 0, currentProgress: r.current_progress || 0,
  }));
}

export async function updateStudentBadgeProgress(studentId: string, badgeId: string, level: number, progress: number) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("student_badge_progress").upsert({
      id: `sbp_${studentId}_${badgeId}`,
      student_id: studentId, badge_id: badgeId,
      current_level: level, current_progress: progress,
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,badge_id" });
  } catch {}
}

/* ── Get full badge data with progress for a student ── */
export async function fetchStudentBadgesWithProgress(studentId: string) {
  const s = sb();
  if (!s) return [];

  try {
    // Get all active badges (display_order가 없으면 폴백)
    const attempt = await s.from("badges").select("*").order("id");
    let badgesData: any[] | null = attempt.data;
    let badges = (badgesData || []).filter((b: any) => b.active !== false);
    if (!badges.length) return [];

    // Try to get badge levels from badge_levels table (may not exist)
    let allLevels: any[] = [];
    const { data: levelData } = await s.from("badge_levels").select("*");
    if (levelData && levelData.length) allLevels = levelData;

    const levelsByBadge: Record<string, any[]> = {};
    if (allLevels.length) {
      allLevels.forEach((l: any) => {
        if (!levelsByBadge[l.badge_id]) levelsByBadge[l.badge_id] = [];
        levelsByBadge[l.badge_id].push({
          level: l.level, threshold: l.threshold,
          title: l.title || "", description: l.description || "",
          rewardMileage: l.reward_mileage || 0, rewardXp: l.reward_xp || 0,
        });
      });
    }

    // Calculate actual progress from activity records for each badge
    const dbClient = s;
    if (!dbClient) return [];

    async function calcProgress(badge: any): Promise<number> {
      const type = (badge.id || "").toString();
      // Mapping by badge id
      if (type === "b1") { // QT count
        const { data } = await dbClient.from("qt_records").select("id").eq("student_id", studentId);
        return data?.length || 0;
      }
      if (type === "b2") { // Attendance count
        const { data } = await dbClient.from("attendance_records").select("id, state").eq("student_id", studentId);
        return data?.filter((r: any) => r.state === "present" || r.state === "late" || r.state === "online").length || 0;
      }
      if (type === "b3") { // Prayer count
        const { data } = await dbClient.from("prayer_participants").select("id").eq("student_id", studentId);
        return data?.length || 0;
      }
      if (type === "b4") { // Daily quest count
        const { data } = await dbClient.from("daily_quests").select("id").eq("student_id", studentId);
        return data?.length || 0;
      }
      if (type === "b5") { // Talents total
        const { data } = await dbClient.from("students").select("talents").eq("id", studentId).single();
        return Number(data?.talents) || 0;
      }
      if (type === "b6") { // QT Streak
        return await calculateQTStreak(studentId);
      }
      if (type === "b7") { // Praise count
        const { data } = await dbClient.from("praises").select("id").eq("praiser_id", studentId);
        return data?.length || 0;
      }
      return 0;
    }

    const result: any[] = [];
    for (const b of badges) {
      let levels = levelsByBadge[b.id] || [];
      
      // Fallback: build levels from badge.level_thresholds array
      if (levels.length === 0 && b.level_thresholds && Array.isArray(b.level_thresholds)) {
        const titles = ["입문", "수련", "전문", "달인", "마스터"];
        levels = b.level_thresholds.map((t: number, i: number) => ({
          level: i + 1, threshold: t,
          title: `${b.name} Lv.${i + 1}`, 
          description: `${b.name} ${t}회 달성`,
          rewardMileage: (i + 1) * 10, rewardXp: (i + 1) * 10,
        }));
      }

      const progress = await calcProgress(b);
      
      // Compute current level from progress vs thresholds
      let currentLevel = 0;
      for (const lvl of levels) {
        if (progress >= lvl.threshold) currentLevel = lvl.level;
      }
      currentLevel = Math.min(currentLevel, levels.length);

      result.push({
        id: b.id, icon: b.icon || "🏅", name: b.name || "", description: b.description || "",
        progress, currentLevel, levels,
      });
    }
    return result;
  } catch { return []; }
}

/* ── Recalculate all badge progress for a student ── */
export async function recalculateBadgeProgress(studentId: string) {
  const s = sb();
  if (!s) return;

  try {
    let { data: badges } = await s.from("badges").select("*");
    if (!badges) return;
    badges = badges.filter((b: any) => b.active !== false);

    let { data: allLevels } = await s.from("badge_levels").select("*").order("level");
    const levelsByBadge: Record<string, any[]> = {};
    if (allLevels) {
      allLevels.forEach((l: any) => {
        if (!levelsByBadge[l.badge_id]) levelsByBadge[l.badge_id] = [];
        levelsByBadge[l.badge_id].push(l);
      });
    }

    for (const badge of badges) {
      const metricType = getBadgeMetricType(badge.id) || badge.requirement_type || "";
      const progress = await calculateBadgeProgress(studentId, metricType);
      let levels = levelsByBadge[badge.id] || [];
      // Fallback from badge.level_thresholds
      if (levels.length === 0 && badge.level_thresholds) {
        const thresholds = Array.isArray(badge.level_thresholds) ? badge.level_thresholds : [];
        levels = thresholds.map((t: number, i: number) => ({ level: i + 1, threshold: t }));
      }
      let currentLevel = 0;
      for (const lvl of levels) {
        if (progress >= lvl.threshold) currentLevel = lvl.level;
      }
      await updateStudentBadgeProgress(studentId, badge.id, currentLevel, progress);
    }
  } catch {}
}

/* ── Top 5 Mileage Ranking ── */
export async function fetchTopMileageRanking() {
  const s = sb();
  if (!s) return [];
  try {
    const { data, error } = await s.from("students")
      .select("id, name, class_id, talents, is_teacher, role, active")
      .order("talents", { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data
      .filter((r: any) => {
        const name = (r.name || "").trim();
        if (!name) return false;
        // 교사/관리자/비활성 계정은 랭킹에서 제외
        if (r.is_teacher === true) return false;
        if (r.role === "admin" || r.role === "teacher") return false;
        if (r.active === false) return false;
        return true;
      })
      .slice(0, 5)
      .map((r: any, i: number) => ({
        rank: i + 1, id: r.id, name: r.name,
        classId: r.class_id || "", mileage: Number(r.talents ?? r.mileage) || 0,
      }));
  } catch { return []; }
}

/* ── Attendance Reward Processing ── */
export async function processAttendanceReward(attendanceRecordId: string, studentId: string) {
  const s = sb();
  if (!s) return false;

  // Check idempotency
  const { data: existing } = await s.from("attendance_rewards")
    .select("id").eq("attendance_record_id", attendanceRecordId).eq("student_id", studentId).limit(1);
  if (existing && existing.length) return false;

  // Get student info
  const { data: student } = await s.from("students").select("*").eq("id", studentId).single();
  if (!student) return false;
  // Skip if teacher/admin (check by name patterns as fallback)
  if (student.role === "admin") return false;

  // Create attendance reward record
  const { error: rewErr } = await s.from("attendance_rewards").insert({
    id: `attrew_${attendanceRecordId}_${studentId}`,
    attendance_record_id: attendanceRecordId, student_id: studentId,
    amount: 20, status: 'awarded',
  });
  if (rewErr) return false;

  // Create mileage transaction — compute date from year/week
  const { data: record } = await s.from("attendance_records").select("year, week").eq("id", attendanceRecordId).single();
  let date = koreaDate();
  if (record && record.year && record.week) {
    date = (() => { const sd = sundayFromWeek(record.year, record.week); const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(sd); return p; })();
  }

  await s.from("mileage_transactions").insert({
    id: `atx_attrew_${attendanceRecordId}`,
    student_id: studentId, type: "출석",
    description: "출석 마일리지", amount: 20, date,
    created_at: new Date().toISOString(),
  });

  // Update student talents balance
  await s.from("students").update({ talents: (Number(student.talents ?? student.mileage) || 0) + 20 }).eq("id", studentId);

  return true;
}

export async function reverseAttendanceReward(attendanceRecordId: string, studentId: string) {
  const s = sb();
  if (!s) return false;

  const { data: existing } = await s.from("attendance_rewards")
    .select("*").eq("attendance_record_id", attendanceRecordId).eq("student_id", studentId).eq("status", "awarded").limit(1);
  if (!existing || !existing.length) return false;

  // Mark as reversed
  await s.from("attendance_rewards").update({ status: "reversed", reversed_at: new Date().toISOString() })
    .eq("id", existing[0].id);

  // Create reversal transaction
  const { data: student } = await s.from("students").select("name, class_id, talents").eq("id", studentId).single();
  await s.from("mileage_transactions").insert({
    id: `atx_attrev_${attendanceRecordId}`,
    student_id: studentId, type: "출석 취소",
    description: "출석 마일리지 취소", amount: -20, date: koreaDate(),
    created_at: new Date().toISOString(),
  });

  // Update student mileage
  if (student) {
    await s.from("students").update({ talents: Math.max(0, (Number(student.talents) || 0) - 20) }).eq("id", studentId);
  }

  return true;
}

export async function processAttendanceRewardsForWeek(year: number, week: number): Promise<{ attended: number; awarded: number; skipped: number; awardedIds: string[] }> {
  const s = sb();
  if (!s) return { attended: 0, awarded: 0, skipped: 0, awardedIds: [] };
  try {
    const { data: records } = await s.from("attendance_records").select("id, student_id, state").eq("year", year).eq("week", week);
    if (!records || !records.length) return { attended: 0, awarded: 0, skipped: 0, awardedIds: [] };
    const attended = records.filter((r: any) => r.state === "present" || r.state === "late" || r.state === "online");
    const awardedIds: string[] = [];
    for (const r of attended) {
      const ok = await processAttendanceReward(r.id, r.student_id);
      if (ok) awardedIds.push(r.student_id);
    }
    return { attended: attended.length, awarded: awardedIds.length, skipped: attended.length - awardedIds.length, awardedIds };
  } catch {
    return { attended: 0, awarded: 0, skipped: 0, awardedIds: [] };
  }
}
