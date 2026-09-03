"use client";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchStudents as dbFetchStudents, fetchTodayQT as dbFetchTodayQT } from "@/lib/db";
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

// fetchStudents는 db.ts에서 관리합니다.
export async function fetchStudents(): Promise<Student[]> {
  return dbFetchStudents();
}

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
// fetchTodayQT는 db.ts에서 관리합니다.
export async function fetchTodayQT() {
  return dbFetchTodayQT();
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

export async function createActivity(type: string, message: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("community_activities").insert([{
      id: "act_" + Date.now(),
      type,
      message,
      created_at: new Date().toISOString(),
    }]);
  } catch { /* ignore */ }
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

/* ── 일일 퀘스트 (DB) ── */
export async function fetchDailyQuests(studentId: string, today: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("daily_quests").select("quest_id").eq("student_id", studentId).eq("date", today);
  if (!error && data) return data.map((r: any) => r.quest_id);
  return [];
}

export async function completeDailyQuestRemote(studentId: string, questId: string, today: string, reward: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("daily_quests").upsert({
    student_id: studentId,
    quest_id: questId,
    date: today,
    reward,
  }, { onConflict: "student_id,quest_id,date" });
}

/* ── 마일리지 내역 (DB) ── */
export async function fetchTransactions(studentId: string): Promise<any[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("mileage_transactions").select("*").eq("student_id", studentId).order("date", { ascending: false }).limit(100);
  if (!error && data) return data;
  return [];
}

/* ── QT 기록 (DB) ── */
export async function fetchQTRecords(studentId: string): Promise<any[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("qt_records").select("*").eq("student_id", studentId);
  if (!error && data) return data;
  return [];
}

export async function updateQTRecordRemote(id: string, patch: any): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("qt_records").update(patch).eq("id", id);
  } catch { /* ignore */ }
}

export async function deleteQTRecordRemote(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("qt_records").delete().eq("id", id);
  } catch { /* ignore */ }
}

/* ── 완료 미션 (DB) ── */
export async function fetchCompletedMissions(studentId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("completed_missions").select("mission_id").eq("student_id", studentId);
  if (!error && data) return data.map((r: any) => r.mission_id);
  return [];
}

/* ── 기도 참여 기록 (DB) ── */
export async function fetchPrayerParticipants(studentId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("prayer_participants").select("prayer_id").eq("student_id", studentId);
  if (!error && data) return data.map((r: any) => r.prayer_id);
  return [];
}

export async function prayForRemote(studentId: string, prayerId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prayer_participants").upsert({ prayer_id: prayerId, student_id: studentId });
  await sb.from("prayer_requests").update({ prayer_count: { raw: "prayer_count + 1" } }).eq("id", prayerId);
}

/* ── QT 공유 날짜 (DB) ── */
export async function fetchSharedQTDates(studentId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("shared_qt_posts").select("date").eq("student_id", studentId);
  if (!error && data) return [...new Set(data.map((r: any) => r.date))];
  return [];
}

/* ── 기도제목 CRUD (DB) ── */
export async function fetchPrayerCounts(prayerId: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const { data, error } = await sb.from("prayer_participants").select("*").eq("prayer_id", prayerId);
  if (!error && data) return data.length;
  return 0;
}

export async function addPrayerRemote(prayer: any): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prayer_requests").insert([prayer]);
}

export async function updatePrayerRemote(prayerId: string, content: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prayer_requests").update({ content }).eq("id", prayerId);
}

export async function deletePrayerRemote(prayerId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prayer_requests").delete().eq("id", prayerId);
  await sb.from("prayer_participants").delete().eq("prayer_id", prayerId);
}
