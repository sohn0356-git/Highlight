"use client";
import { getSupabase } from "./supabase";
import { koreaDate } from "./korea-date";
import { mockData } from "./data";
import type {
  Student, ClassRoom, Mission, Badge, PrayerRequest,
  MileageTransaction, QTRecord,
} from "./types";

/**
 * 중앙 집중 DB 액세스 계층.
 * 모든 Supabase 쿼리는 이 파일을 단일 소스로 사용합니다.
 * 날짜는 반드시 koreaDate()를 사용합니다.
 */

/* ── QT 본문 ── */
export async function fetchTodayQT() {
  const today = koreaDate();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("qt_today").select("*").eq("date", today).limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return {
        date: today,
        passage: row.passage || "",
        verse: row.verse || "",
        content: row.content || "",
        prayer: row.prayer || "",
        song: row.song || "",
        helper: row.helper || "",
        question1: row.question1 || "",
        question2: row.question2 || "",
      };
    }
  }
  return { ...mockData.qt_today, date: today };
}

export async function fetchQTByDate(date: string) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("qt_today").select("*").eq("date", date).limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return {
        date,
        passage: row.passage || "",
        verse: row.verse || "",
        content: row.content || "",
        prayer: row.prayer || "",
        song: row.song || "",
        helper: row.helper || "",
        question1: row.question1 || "",
        question2: row.question2 || "",
      };
    }
  }
  return null;
}

/* ── 학생 ── */
export async function fetchStudents(): Promise<Student[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("students").select("*");
    if (!error && data && data.length) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        birthDate: row.birth_date || row.birthDate || "",
        classId: row.class_id || row.classId || "",
        mileage: Number(row.mileage) || 0,
        isTeacher: row.is_teacher || row.isTeacher || false,
        role: row.role || "student",
        assignedClassIds: row.assigned_class_ids || row.assignedClassIds || [],
      })) as Student[];
    }
  }
  return mockData.students;
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("students").select("*").eq("id", id).limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return {
        id: row.id,
        name: row.name,
        birthDate: row.birth_date || row.birthDate || "",
        classId: row.class_id || row.classId || "",
        mileage: Number(row.mileage) || 0,
        isTeacher: row.is_teacher || row.isTeacher || false,
        role: row.role || "student",
        assignedClassIds: row.assigned_class_ids || row.assignedClassIds || [],
      } as Student;
    }
  }
  const found = mockData.students.find(s => s.id === id);
  return found || null;
}

/* ── 반 ── */
export async function fetchClasses(): Promise<ClassRoom[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("classes").select("*");
    if (!error && data && data.length) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        level: Number(row.level) || 0,
        xp: Number(row.xp) || 0,
        weeklyXp: Number(row.weekly_xp || row.weeklyXp) || 0,
        attendance: {
          attended: Number(row.attendance_attended || 0),
          total: Number(row.attendance_total || 0),
        },
        qtCount: Number(row.qt_count || 0),
        missionCount: Number(row.mission_count || 0),
        prayerCount: Number(row.prayer_count || 0),
        classMessage: row.class_message || "",
      })) as ClassRoom[];
    }
  }
  return mockData.classes as unknown as ClassRoom[];
}

/* ── 미션 ── */
export async function fetchMissions(): Promise<Mission[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("missions").select("*").eq("active", true);
    if (!error && data && data.length) return data as unknown as Mission[];
  }
  return mockData.missions;
}

/* ── 공지 ── */
export async function fetchAnnouncements(): Promise<{id: string; title: string; content: string; important: boolean; createdAt: string}[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("announcements").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(10);
    if (!error && data && data.length) {
      return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content || "",
        important: r.important || false,
        createdAt: r.created_at || "",
      }));
    }
  }
  return [];
}

/* ── 배지 ── */
export async function fetchBadges(): Promise<Badge[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("badges").select("*");
    if (!error && data && data.length) return data as unknown as Badge[];
  }
  return mockData.badges;
}

/* ── 기도 ── */
export async function fetchPrayers(studentId?: string): Promise<PrayerRequest[]> {
  const sb = getSupabase();
  if (sb) {
    let q = sb.from("prayer_requests").select("*").order("created_at", { ascending: false });
    if (studentId) q = q.eq("student_id", studentId);
    const { data, error } = await q;
    if (!error && data && data.length) return data as unknown as PrayerRequest[];
  }
  return (mockData.prayers as PrayerRequest[]).map(p => ({
    ...p,
    prayedBy: (p.prayedBy || []) as string[],
  }));
}

/* ── 마일리지 내역 ── */
export async function fetchTransactions(studentId: string): Promise<MileageTransaction[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("mileage_transactions").select("*").eq("student_id", studentId).order("date", { ascending: false }).limit(100);
  if (!error && data) return data as MileageTransaction[];
  return [];
}

/* ── QT 기록 ── */
export async function fetchQTRecords(studentId: string): Promise<QTRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("qt_records").select("*").eq("student_id", studentId);
  if (!error && data) return data as QTRecord[];
  return [];
}

/* ── 출석 횟수 ── */
export async function fetchAttendanceCount(studentId: string, year?: number, month?: number): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  let q = sb.from("attendance_records").select("*").eq("student_id", studentId);
  if (year && month) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = `${year}-${String(month).padStart(2, "0")}-31`;
    q = q.gte("date", start).lte("date", end);
  }
  const { data, error } = await q;
  if (!error && data) return data.length;
  return 0;
}

/* ── 트랜잭션 수 ── */
export async function fetchTransactionsCount(studentId: string, type?: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  let q = sb.from("mileage_transactions").select("*").eq("student_id", studentId);
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (!error && data) return data.length;
  return 0;
}

/* ── QT 완료 (중복 방지) ── */
export async function completeQT(studentId: string, qtDate: string, answer1: string, answer2: string, reward: number): Promise<QTRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;
  // 중복 체크
  const { data: existing } = await sb.from("qt_records").select("id").eq("student_id", studentId).eq("date", qtDate).limit(1);
  if (existing && existing.length) return null;

  // 오늘의 QT 본문에서 passage/verse 채우기
  let passage = "";
  let verse = "";
  const qt = await fetchQTByDate(qtDate);
  if (qt) {
    passage = qt.passage;
    verse = qt.verse;
  }

  const rec: QTRecord = {
    id: "qt_" + Date.now(),
    studentId,
    date: qtDate,
    passage,
    verse,
    remembered: answer1,
    application: answer2,
    reward,
  };
  const { data, error } = await sb.from("qt_records").insert([rec]).select().single();
  if (error || !data) return null;
  return data as QTRecord;
}

/* ── 기도 참여 기록 ── */
export async function recordPrayer(studentId: string, prayerId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prayer_participants").upsert({ prayer_id: prayerId, student_id: studentId });
  await sb.from("prayer_requests").update({ prayer_count: { raw: "prayer_count + 1" } }).eq("id", prayerId);
}

/* ── 마일리지 갱신 ── */
export async function updateStudentMileage(studentId: string, delta: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("students").update({ mileage: { raw: `mileage + ${delta}` } }).eq("id", studentId);
}

/* ── XP 갱신 ── */
export async function updateStudentXP(studentId: string, delta: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("students").update({ xp: { raw: `xp + ${delta}` } }).eq("id", studentId);
}

/* ── 레벨 계산 ── */
const STUDENT_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000];
const CLASS_LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 7500, 10500, 14000, 18000, 22500, 27500, 33000];

export function getStudentLevel(xp: number): number {
  let level = 1;
  for (const t of STUDENT_LEVEL_THRESHOLDS) {
    if (xp >= t) level = STUDENT_LEVEL_THRESHOLDS.indexOf(t) + 1;
  }
  return level;
}

export function getClassLevel(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < CLASS_LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= CLASS_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/* ── 현재 한국 날짜 문자열 ── */
export function getKoreaNow(): string {
  return koreaDate();
}
