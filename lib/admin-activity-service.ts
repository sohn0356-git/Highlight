"use client";
import { getSupabase } from "./supabase";

export interface RecentActivity {
  icon: string;
  text: string;
  time: string;
  sortTime: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const activities: RecentActivity[] = [];

  try {
    // 학생 이름 맵 조회
    const { data: students } = await sb.from("students").select("id, name");
    const nameMap: Record<string, string> = {};
    if (students) students.forEach((s: any) => { nameMap[s.id] = s.name; });

    // QT 완료 기록
    const { data: qtRecords } = await sb
      .from("qt_records")
      .select("student_id, date, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (qtRecords) {
      qtRecords.forEach((r: any) => {
        const name = nameMap[r.student_id] || "학생";
        activities.push({
          icon: "📖",
          text: `${name}이(가) QT를 완료했어요.`,
          time: formatTime(r.created_at || r.date),
          sortTime: new Date(r.created_at || r.date).getTime(),
        });
      });
    }

    // 마일리지 변동
    const { data: txns } = await sb
      .from("mileage_transactions")
      .select("student_id, type, description, amount, date, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    if (txns) {
      txns.forEach((t: any) => {
        const name = nameMap[t.student_id] || "학생";
        if (t.type === "QT 공유") {
          activities.push({
            icon: "🔗",
            text: `${name}이(가) QT를 공유했어요.`,
            time: formatTime(t.created_at || t.date),
            sortTime: new Date(t.created_at || t.date).getTime(),
          });
        } else if (t.type === "기도 참여") {
          activities.push({
            icon: "🙏",
            text: `${name}이(가) 기도에 참여했어요.`,
            time: formatTime(t.created_at || t.date),
            sortTime: new Date(t.created_at || t.date).getTime(),
          });
        } else if (t.type === "미션 완료") {
          activities.push({
            icon: "✅",
            text: `${name}이(가) "${t.description}" 미션을 완료했어요.`,
            time: formatTime(t.created_at || t.date),
            sortTime: new Date(t.created_at || t.date).getTime(),
          });
        }
      });
    }

    // 기도제목 등록
    const { data: prayers } = await sb
      .from("prayer_requests")
      .select("student_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (prayers) {
      prayers.forEach((p: any) => {
        const name = nameMap[p.student_id] || "학생";
        activities.push({
          icon: "🙏",
          text: `${name}이(가) 기도제목을 올렸어요.`,
          time: formatTime(p.created_at),
          sortTime: new Date(p.created_at).getTime(),
        });
      });
    }

    // 완료 미션 (승인 대기 포함)
    const { data: missions } = await sb
      .from("completed_missions")
      .select("student_id, mission_id, completed_at")
      .order("completed_at", { ascending: false })
      .limit(10);
    if (missions) {
      missions.forEach((m: any) => {
        const name = nameMap[m.student_id] || "학생";
        activities.push({
          icon: "🎯",
          text: `${name}이(가) 미션을 완료했어요.`,
          time: formatTime(m.completed_at),
          sortTime: new Date(m.completed_at).getTime(),
        });
      });
    }

    // QT 공유 게시글
    const { data: posts } = await sb
      .from("shared_qt_posts")
      .select("student_name, date, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (posts) {
      posts.forEach((p: any) => {
        activities.push({
          icon: "🔗",
          text: `${p.student_name}이(가) QT를 공유했어요.`,
          time: formatTime(p.created_at || p.date),
          sortTime: new Date(p.created_at || p.date).getTime(),
        });
      });
    }
  } catch { /* ignore */ }

  // 시간순 정렬 + 중복 제거 + 상위 8개
  activities.sort((a, b) => b.sortTime - a.sortTime);
  return activities.slice(0, 8);
}
