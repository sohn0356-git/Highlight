"use client";
/**
 * Legacy mileage service layer.
 * Now delegates to the centralized db.ts module.
 * Kept for backward compatibility.
 */
export {
  fetchStudents, fetchClasses, fetchMissions, fetchBadges, fetchPrayers,
  fetchTodayQT, fetchTransactions, fetchQTRecords, completeQT, fetchAttendanceCount,
  fetchTeachers, fetchActivities, fetchAnnouncements, addActivity,
  fetchSharedPosts, createSharedPost, fetchComments, addComment,
  insertPrayer as addPrayer,
  fetchSharedGoal, fetchSeason,
  fetchDailyQuests, completeDailyQuest,
  updateQTRecord as updateQTRecordRemote, deleteQTRecord as deleteQTRecordRemote,
  fetchCompletedMissions, fetchStudentBadges,
  fetchAuditLogs, addAuditLog,
  fetchAllTransactions, fetchClassStats,
} from "@/lib/db";

export const isSupabaseAvailable = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key);
};

// Legacy prayer participation tracking
export async function recordPrayer(studentId: string, prayerId: string) {
  const { recordPrayerParticipation } = await import("@/lib/db");
  await recordPrayerParticipation(studentId, prayerId);
}

export async function hasPrayed(studentId: string, prayerId: string): Promise<boolean> {
  const { hasPrayedToday } = await import("@/lib/db");
  return hasPrayedToday(studentId, prayerId);
}
