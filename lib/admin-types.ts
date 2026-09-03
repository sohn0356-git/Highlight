"use client";

/* ── Admin-specific types for the teacher/admin management system ── */

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  birthDate: string;
  role: UserRole;
  assignedClassIds?: string[];
  active?: boolean;
}

export interface AdminStudent extends User {
  role: "student" | "teacher" | "admin";
  classId: string;
  mileage: number;
  phone?: string;
  guardianPhone?: string;
  memo?: string;
}

export interface AdminTeacher extends User {
  role: "teacher" | "admin";
  assignedClassIds: string[];
}

/* ── Attendance ── */
export type AttendanceState = "present" | "late" | "online" | "absent";

export interface AttendanceSession {
  id: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  mileageReward: number;
  xpReward: number;
  active: boolean;
}

export interface AttendanceRecordAdmin {
  id: string;
  studentId: string;
  sessionId: string;
  state: AttendanceState;
  checkTime: string;
  method: "manual";
}

/* ── QT Management ── */
export interface QTContent {
  id: string;
  date: string;
  title: string;
  passage: string;
  verse: string;
  content: string;
  question1: string;
  question2: string;
  mileageReward: number;
  active: boolean;
  status: "scheduled" | "active" | "ended";
}

export interface QTCompletionAdmin {
  id: string;
  qtContentId: string;
  studentId: string;
  date: string;
  remembered: string;
  application: string;
}

/* ── Mission Management ── */
export type MissionType = "weekly" | "special" | "event" | "class-only";
export type MissionTarget = "all" | "grade1" | "grade2" | "grade3" | "custom";

export interface MissionAdmin {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: MissionType;
  mileageReward: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  target: MissionTarget;
  targetClassIds?: string[];
  approvalRequired: boolean;
  active: boolean;
}

export interface MissionCompletionAdmin {
  id: string;
  missionId: string;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  completedAt: string;
}

/* ── Prayer Management ── */
export type PrayerStatus = "active" | "hidden" | "reported" | "deleted";

export interface PrayerRequestAdmin {
  id: string;
  studentId: string;
  authorName: string | null;
  anonymous: boolean;
  content: string;
  prayerCount: number;
  classId: string;
  createdAt: string;
  status: PrayerStatus;
}

/* ── Announcements ── */
export type AnnouncementTarget = "all" | "grade" | "class";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: AnnouncementTarget;
  targetClassIds?: string[];
  targetGrades?: string[];
  startDate: string;
  endDate: string;
  important: boolean;
  status: "draft" | "published" | "ended";
  createdAt: string;
}

/* ── Mileage Management ── */
export type MileageActionType = "attendance" | "qt" | "mission" | "prayer" | "manual_bonus" | "manual_deduction" | "reward_purchase" | "event" | "badge";

export interface MileageTransactionAdmin {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: MileageActionType;
  description: string;
  amount: number;
  date: string;
  actorName?: string;
}

/* ── Rewards ── */
export interface Reward {
  id: string;
  name: string;
  description: string;
  mileageCost: number;
  inventory: number;
  image?: string;
  active: boolean;
  redemptionLimit: number;
  category: string;
}

export type RedemptionStatus = "requested" | "approved" | "completed" | "cancelled";

export interface RewardRedemption {
  id: string;
  studentId: string;
  studentName: string;
  rewardId: string;
  rewardName: string;
  mileageCost: number;
  status: RedemptionStatus;
  createdAt: string;
}

/* ── Seasons ── */
export interface SeasonAdmin {
  id: string;
  name: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  active: boolean;
  sharedGoalXp: number;
  sharedReward: string;
}

/* ── Badge Management ── */
export type BadgeRequirementType = "qt_count" | "attendance_count" | "mission_count" | "prayer_count";

export interface BadgeAdmin {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirementType: BadgeRequirementType;
  requirementValue: number;
  active: boolean;
  mileageReward: number;
  levelThresholds?: number[];
}

/* ── Audit Log ── */
export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  actionType: string;
  target: string;
  description: string;
}

/* ── Admin Settings ── */
export interface AdminSettings {
  defaultAttendanceMileage: number;
  defaultQTMileage: number;
  prayerMileage: number;
  weeklyMissionReward: number;
  nameDisplayPolicy: "full" | "first";
  anonymousPrayerEnabled: boolean;
  mileageShopEnabled: boolean;
}

/* ── Admin Tab Navigation ── */
export type AdminPageId = "dashboard" | "attendance" | "students" | "content" | "management";

export interface AdminNavItem {
  id: AdminPageId;
  label: string;
  icon: string;
}
