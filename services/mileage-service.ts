"use client";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockData } from "@/lib/data";
import type {
  Student, ClassRoom, Mission, Badge, PrayerRequest,
  MileageTransaction, QTRecord, Season, CommunityActivity, SharedQTPost, QTComment, Teacher,
} from "@/lib/types";

/**
 * 마일리지 서비스 계층
 * Supabase가 설정되면 실제 DB에서 데이터를 읽고,
 * 그렇지 않으면 로컬 mock 데이터(localStorage)로 동작합니다.
 */

export async function fetchStudents(): Promise<Student[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("students").select("*");
    if (!error && data && data.length) return data as unknown as Student[];
  }
  return mockData.students;
}

export async function fetchClasses(): Promise<ClassRoom[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("classes").select("*");
    if (!error && data && data.length) return data as unknown as ClassRoom[];
  }
  return mockData.classes as unknown as ClassRoom[];
}

export async function fetchMissions(): Promise<Mission[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("missions").select("*").eq("active", true);
    if (!error && data && data.length) return data as unknown as Mission[];
  }
  return mockData.missions;
}

export async function fetchBadges(): Promise<Badge[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("badges").select("*");
    if (!error && data && data.length) return data as unknown as Badge[];
  }
  return mockData.badges;
}

export async function fetchPrayers(studentId?: string): Promise<PrayerRequest[]> {
  const sb = getSupabase();
  if (sb) {
    const q = sb.from("prayer_requests").select("*").order("created_at", { ascending: false });
    const { data, error } = await q;
    if (!error && data && data.length) return data as unknown as PrayerRequest[];
  }
  return (mockData.prayers as PrayerRequest[]).map(p => ({
    ...p,
    prayedBy: (p.prayedBy || []) as string[],
  }));
}

export async function addPrayer(prayer: PrayerRequest) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from("prayer_requests").insert([prayer]);
    if (error) throw error;
  }
}

export async function prayForRemote(prayerId: string, studentId: string) {
  const sb = getSupabase();
  if (!sb) return false;
  // Check if already prayed
  const { data: existing } = await sb
    .from("prayer_participants")
    .select("id")
    .eq("prayer_id", prayerId)
    .eq("student_id", studentId);
  if (existing && existing.length) return false;
  // Increment count + insert participant
  await sb.from("prayer_requests").update({ prayer_count: { raw: "prayer_count + 1" } }).eq("id", prayerId);
  await sb.from("prayer_participants").insert([{ prayer_id: prayerId, student_id: studentId }]);
  return true;
}

export const isSupabaseAvailable = () => isSupabaseConfigured();

/* ── Shared QT Feed ── */
export async function fetchSharedPosts(): Promise<SharedQTPost[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("shared_qt_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data && data.length) return data as unknown as SharedQTPost[];
  }
  return [];
}

export async function createSharedPost(post: SharedQTPost) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("shared_qt_posts").insert([post]);
}

export async function fetchComments(postId: string): Promise<QTComment[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("qt_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) return data as unknown as QTComment[];
  }
  return [];
}

export async function addCommentToPost(comment: QTComment) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("qt_comments").insert([comment]);
  await sb.from("shared_qt_posts")
    .update({ comment_count: { raw: "comment_count + 1" } })
    .eq("id", comment.postId);
}

/* ── QT 본문 ── */
export async function fetchTodayQT(): Promise<{ date: string; passage: string; verse: string; content: string } | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("qt_today").select("*").limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return {
        date: row.date || new Date().toISOString().slice(0, 10),
        passage: row.passage || "",
        verse: row.verse || "",
        content: row.content || "",
      };
    }
  }
  return mockData.qt_today;
}

/* ── 시즌 ── */
export async function fetchSeason(): Promise<typeof mockData.season> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("seasons").select("*").eq("active", true).limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return { id: row.id, label: row.label, title: row.title };
    }
  }
  return mockData.season;
}

/* ── 공동 목표 ── */
export async function fetchSharedGoal(): Promise<typeof mockData.shared_goal> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("shared_goal").select("*").limit(1);
    if (!error && data && data.length) {
      const row = data[0] as any;
      return { label: row.label, current: row.current_xp, target: row.target_xp, reward: row.reward };
    }
  }
  return mockData.shared_goal;
}

/* ── 커뮤니티 활동 ── */
export async function fetchActivities(): Promise<typeof mockData.activities> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("community_activities").select("*").order("created_at", { ascending: false }).limit(20);
    if (!error && data && data.length) {
      return data.map((r: any) => ({
        id: r.id,
        type: r.type,
        message: r.message,
        timestamp: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
      }));
    }
  }
  return mockData.activities;
}

/* ── 선생님 ── */
export async function fetchTeachers(): Promise<Teacher[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("teachers").select("*");
    if (!error && data && data.length) {
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        birthDate: r.birth_date,
        classId: r.class_id,
      }));
    }
  }
  return [];
}

/* ── 배지 ── */
export async function fetchBadgesRemote(): Promise<typeof mockData.badges> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("badges").select("*");
    if (!error && data && data.length) {
      return data.map((r: any) => ({
        id: r.id,
        icon: r.icon,
        name: r.name,
        description: r.description,
        criteria: r.criteria,
        progress: r.progress,
        locked: !r.unlocked,
      }));
    }
  }
  return mockData.badges;
}
