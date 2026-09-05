"use client";
/**
 * Centralized database access layer.
 * ALL Supabase queries go through this module.
 * All dates use Asia/Seoul timezone via korea-date.ts.
 */
import { getSupabase } from "./supabase";
import type { Student } from "./types";
import { koreaDate } from "./korea-date";

/* ── Helpers ── */
function sb() { return getSupabase(); }

function mapStudent(r: any): Student {
  const classId = r.class_id || "";
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date || "",
    classId,
    grade: Number(r.grade) || (classId.includes("_g1_") ? 1 : classId.includes("_g2_") ? 2 : classId.includes("_g3_") ? 3 : 1),
    className: r.class_name || "",
    mileage: Number(r.mileage) || 0,
    xp: Number(r.mileage) || 0,
    weeklyXp: 0,
    isTeacher: false,
    role: "student" as "student",
    assignedClassIds: [],
    phone: "",
    guardianPhone: "",
    memo: "",
    active: true,
    enrollmentStatus: "active",
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
  const grade = student.grade || (String(student.classId || "").includes("_g1_") ? 1 : String(student.classId || "").includes("_g2_") ? 2 : String(student.classId || "").includes("_g3_") ? 3 : 1);
  await s.from("students").upsert({
    id: student.id, name: student.name, birth_date: student.birthDate || "",
    class_id: student.classId || "", mileage: student.mileage || 0,
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
    // Try adding optional columns
    try { row.mileage_reward = mission.reward || 30; } catch {}
    try { row.xp_reward = mission.reward || 30; } catch {}
    try { row.start_date = mission.startDate || ""; } catch {}
    try { row.end_date = mission.endDate || ""; } catch {}
    try { row.approval_required = !!mission.approvalRequired; } catch {}
    await s.from("missions").insert([row]);
  } catch {}
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
  await s.from("announcements").insert([{
    id: a.id, title: a.title, content: a.content || "",
    target: a.target || "all", important: !!a.important,
    status: a.status || "published",
    start_date: a.startDate || koreaDate(),
    end_date: a.endDate || "",
    created_at: new Date().toISOString(),
  }]);
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
    let { data, error } = await s.from("badges").select("*").order("display_order");
    if (error) {
      // Try without order if display_order column doesn't exist
      const r2 = await s.from("badges").select("*");
      data = r2.data;
    }
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
  // 학생별 전체 기도 횟수 + 이 기도제목에 기도한 날짜 목록
  const { data: allPrayers } = await s.from("prayer_participants").select("student_id, prayer_id, pray_date");
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

  // Build per-prayer totals (전체 기도 횟수는 prayer_count 컬럼에서 가져옴)
  // We don't need the full table scan - just count per this prayer
  const countMap: Record<string, number> = {};
  (allParticipants || []).forEach((r: any) => {
    countMap[r.student_id] = (countMap[r.student_id] || 0) + 1;
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
        totalPrayerCount: countMap[p.student_id] || 0,
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

export async function deletePrayerComment(id: string) {
  const s = sb();
  if (!s) return;
  try {
    await s.from("prayer_comments").delete().eq("id", id);
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
      category: r.category || "",
    }]);
  } catch {}
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
  const { data, error } = await s.from("mileage_transactions").select("*").order("created_at", { ascending: false }).limit(200);
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
  b4: "mission_count", b5: "mileage_total", b6: "qt_streak", b7: "praise_count",
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
    case "mission_count": {
      const { data } = await s.from("completed_missions").select("id").eq("student_id", studentId);
      return data?.length || 0;
    }
    case "mileage_total": {
      const { data } = await s.from("students").select("mileage").eq("id", studentId).single();
      return Number(data?.mileage) || 0;
    }
    case "qt_streak": {
      return await calculateQTStreak(studentId);
    }
    case "praise_count": {
      const { data } = await s.from("praises").select("id").eq("praised_id", studentId);
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
    let badgesData: any[] | null = null;
    const attempt = await s.from("badges").select("*").order("display_order");
    if (attempt.error) {
      const retry = await s.from("badges").select("*");
      badgesData = retry.data;
    } else {
      badgesData = attempt.data;
    }
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
      if (type === "b4") { // Mission count
        const { data } = await dbClient.from("completed_missions").select("id").eq("student_id", studentId);
        return data?.length || 0;
      }
      if (type === "b5") { // Mileage total
        const { data } = await dbClient.from("students").select("mileage").eq("id", studentId).single();
        return Number(data?.mileage) || 0;
      }
      if (type === "b6") { // QT Streak
        return await calculateQTStreak(studentId);
      }
      if (type === "b7") { // Praise count
        const { data } = await dbClient.from("praises").select("id").eq("praised_id", studentId);
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
      .select("id, name, class_id, mileage, xp")
      .order("mileage", { ascending: false })
      .limit(10);
    if (error || !data) return [];
    return data
      .filter((r: any) => {
        const name = (r.name || "").trim();
        if (!name) return false;
        // Filter out teachers/admins by naming patterns
        if (name.includes("선생님") || name.includes("목사")) return false;
        return true;
      })
      .slice(0, 5)
      .map((r: any, i: number) => ({
        rank: i + 1, id: r.id, name: r.name,
        classId: r.class_id || "", mileage: Number(r.mileage) || 0,
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

  // Create mileage transaction
  const { data: record } = await s.from("attendance_records").select("*").eq("id", attendanceRecordId).single();
  let date = koreaDate();
  if (record) {
    const { data: session } = await s.from("attendance_sessions").select("date").eq("id", record.session_id).single();
    if (session) date = session.date;
  }

  await s.from("mileage_transactions").insert({
    id: `atx_attrew_${attendanceRecordId}`,
    student_id: studentId, student_name: student.name || "",
    class_name: student.class_id || "", type: "attendance",
    description: "출석 마일리지", amount: 20, date,
    actor_name: "시스템",
  });

  // Update student mileage
  await s.from("students").update({ mileage: (student.mileage || 0) + 20 }).eq("id", studentId);

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
  const { data: student } = await s.from("students").select("name, class_id, mileage").eq("id", studentId).single();
  await s.from("mileage_transactions").insert({
    id: `atx_attrev_${attendanceRecordId}`,
    student_id: studentId, student_name: student?.name || "",
    class_name: student?.class_id || "", type: "attendance_reversal",
    description: "출석 마일리지 취소", amount: -20, date: koreaDate(),
    actor_name: "시스템",
  });

  // Update student mileage
  if (student) {
    await s.from("students").update({ mileage: Math.max(0, (student.mileage || 0) - 20) }).eq("id", studentId);
  }

  return true;
}
