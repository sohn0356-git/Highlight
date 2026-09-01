"use client";
import { getSupabase } from "./supabase";

export interface ClassStats {
  classId: string;
  qtCount: number;
  missionCount: number;
  prayerCount: number;
  attendanceAttended: number;
  attendanceTotal: number;
}

export async function fetchClassStats(classIds: string[]): Promise<Record<string, ClassStats>> {
  const sb = getSupabase();
  if (!sb || classIds.length === 0) return {};

  const stats: Record<string, ClassStats> = {};
  classIds.forEach(id => {
    stats[id] = { classId: id, qtCount: 0, missionCount: 0, prayerCount: 0, attendanceAttended: 0, attendanceTotal: 0 };
  });

  try {
    const { data: students } = await sb.from("students").select("id, class_id");
    if (!students) return stats;

    const studentClassMap: Record<string, string> = {};
    students.forEach((s: any) => {
      studentClassMap[s.id] = s.class_id;
    });

    const { data: qtRecords } = await sb.from("qt_records").select("student_id");
    if (qtRecords) {
      qtRecords.forEach((r: any) => {
        const cid = studentClassMap[r.student_id];
        if (cid && stats[cid]) stats[cid].qtCount++;
      });
    }

    const { data: missions } = await sb.from("completed_missions").select("student_id");
    if (missions) {
      missions.forEach((r: any) => {
        const cid = studentClassMap[r.student_id];
        if (cid && stats[cid]) stats[cid].missionCount++;
      });
    }

    const { data: prayers } = await sb.from("prayer_requests").select("student_id");
    if (prayers) {
      prayers.forEach((r: any) => {
        const cid = studentClassMap[r.student_id];
        if (cid && stats[cid]) stats[cid].prayerCount++;
      });
    }

    // attendance_records 테이블이 있을 때만 조회
    try {
      const { data: attendance, error: attErr } = await sb.from("attendance_records").select("student_id, state");
      if (!attErr && attendance) {
        attendance.forEach((r: any) => {
          const cid = studentClassMap[r.student_id];
          if (cid && stats[cid]) {
            stats[cid].attendanceTotal++;
            if (r.state === "present" || r.state === "late") stats[cid].attendanceAttended++;
          }
        });
      }
    } catch { /* 테이블 없으면 무시 */ }

  } catch { /* keep zeros */ }

  return stats;
}
