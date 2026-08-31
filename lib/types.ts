export interface Student {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  classId: string;
  mileage: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: number;
  xp: number;
  weeklyXp: number;
  attendance: { attended: number; total: number };
  qtCount: number;
  missionCount: number;
  prayerCount: number;
  classMessage: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  xp: number;
  weeklyXp: number;
  level: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  service: string;
  reward: number;
}

export interface QTRecord {
  id: string;
  studentId: string;
  date: string;
  passage: string;
  verse: string;
  remembered: string;
  application: string;
  reward: number;
}

export interface Mission {
  id: string;
  icon: string;
  title: string;
  description: string;
  reward: number;
  category: "weekly" | "special";
}

export interface CompletedMission {
  missionId: string;
  studentId: string;
  completedAt: string;
  reward: number;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  criteria: number;
  progress: number;
  locked?: boolean;
}

export interface PrayerRequest {
  id: string;
  authorName: string | null;
  anonymous: boolean;
  content: string;
  prayerCount: number;
  createdAt: string;
  prayedBy: string[];
}

export interface MileageTransaction {
  id: string;
  studentId: string;
  type: string;
  description: string;
  amount: number;
  date: string;
}

export interface Season {
  id: string;
  label: string;
  title: string;
}

export interface CommunityActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export type TabId = "home" | "qt" | "missions" | "we" | "my";

export interface SharedQTPost {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  passage: string;
  verse: string;
  remembered?: string;
  application?: string;
  reward: number;
  date: string;
  commentCount: number;
  likedBy: string[];
}

export interface QTComment {
  id: string;
  postId: string;
  studentId: string;
  studentName: string;
  content: string;
  createdAt: string;
}
