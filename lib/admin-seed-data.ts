"use client";

import type { User, AdminStudent, AdminTeacher, AttendanceSession, AttendanceRecordAdmin, QTContent, MissionAdmin, MissionCompletionAdmin, Announcement, Reward, RewardRedemption, SeasonAdmin, BadgeAdmin, AuditLog, AdminSettings, MileageActionType } from "./admin-types";

/* ── Seed Users ── */
export const seedUsers: User[] = [
  { id: "a001", name: "관리자", birthDate: "1980-01-01", role: "admin", active: true },
  { id: "t001", name: "김선생", birthDate: "1985-03-20", role: "teacher", assignedClassIds: ["c1", "c2"], active: true },
  { id: "t002", name: "이선생", birthDate: "1988-07-15", role: "teacher", assignedClassIds: ["c3", "c4"], active: true },
  { id: "t003", name: "박선생", birthDate: "1990-11-05", role: "teacher", assignedClassIds: ["c5", "c6"], active: true },
  { id: "t004", name: "최목사", birthDate: "1978-06-30", role: "teacher", assignedClassIds: [], active: true },
  // Students with roles
  { id: "s1", name: "홍길동", birthDate: "2009-03-15", role: "admin", active: true, assignedClassIds: ["c1"] },
  { id: "s2", name: "김민준", birthDate: "2008-11-22", role: "student", active: true },
  { id: "s3", name: "이서연", birthDate: "2009-07-04", role: "student", active: true },
  { id: "s4", name: "박지호", birthDate: "2008-02-10", role: "student", active: true },
  { id: "s5", name: "최수진", birthDate: "2009-09-30", role: "student", active: true },
  { id: "s6", name: "정하은", birthDate: "2008-05-18", role: "student", active: true },
  { id: "s7", name: "강이준", birthDate: "2009-01-25", role: "student", active: true },
  { id: "s8", name: "한지우", birthDate: "2009-06-12", role: "student", active: true },
  { id: "s9", name: "윤서준", birthDate: "2008-08-03", role: "student", active: true },
  { id: "s10", name: "오다은", birthDate: "2009-12-19", role: "student", active: true },
  { id: "s11", name: "노현서", birthDate: "2009-04-22", role: "student", active: true },
  { id: "s12", name: "임도윤", birthDate: "2008-10-07", role: "student", active: true },
  { id: "s13", name: "신예린", birthDate: "2009-08-28", role: "student", active: true },
  { id: "s14", name: "장도현", birthDate: "2008-12-14", role: "student", active: true },
  { id: "s15", name: "문시은", birthDate: "2009-03-09", role: "student", active: true },
];

/* ── Admin Students (with classId + mileage) ── */
export const seedAdminStudents: AdminStudent[] = [
  { id: "s1", name: "홍길동", birthDate: "2009-03-15", role: "student", classId: "c1", mileage: 1420, active: true },
  { id: "s2", name: "김민준", birthDate: "2008-11-22", role: "student", classId: "c1", mileage: 980, active: true },
  { id: "s3", name: "이서연", birthDate: "2009-07-04", role: "student", classId: "c1", mileage: 1100, active: true },
  { id: "s4", name: "박지호", birthDate: "2008-02-10", role: "student", classId: "c1", mileage: 870, active: true },
  { id: "s5", name: "최수진", birthDate: "2009-09-30", role: "student", classId: "c1", mileage: 1350, active: true },
  { id: "s6", name: "정하은", birthDate: "2008-05-18", role: "student", classId: "c1", mileage: 1020, active: true },
  { id: "s15", name: "문시은", birthDate: "2009-03-09", role: "student", classId: "c1", mileage: 1200, active: true },
  { id: "s7", name: "강이준", birthDate: "2009-01-25", role: "student", classId: "c2", mileage: 950, active: true },
  { id: "s8", name: "한지우", birthDate: "2009-06-12", role: "student", classId: "c2", mileage: 1180, active: true },
  { id: "s9", name: "윤서준", birthDate: "2008-08-03", role: "student", classId: "c3", mileage: 870, active: true },
  { id: "s10", name: "오다은", birthDate: "2009-12-19", role: "student", classId: "c3", mileage: 1050, active: true },
  { id: "s11", name: "노현서", birthDate: "2009-04-22", role: "student", classId: "c4", mileage: 1300, active: true },
  { id: "s14", name: "장도현", birthDate: "2008-12-14", role: "student", classId: "c4", mileage: 1080, active: true },
  { id: "s12", name: "임도윤", birthDate: "2008-10-07", role: "student", classId: "c5", mileage: 920, active: true },
  { id: "s13", name: "신예린", birthDate: "2009-08-28", role: "student", classId: "c6", mileage: 1150, active: true },
  { id: "s16", name: "배준혁", birthDate: "2009-02-14", role: "student", classId: "c1", mileage: 780, active: true },
  { id: "s17", name: "하연우", birthDate: "2008-09-03", role: "student", classId: "c2", mileage: 1040, active: true },
  { id: "s18", name: "전도윤", birthDate: "2009-05-18", role: "student", classId: "c2", mileage: 890, active: true },
  { id: "s19", name: "권나윤", birthDate: "2008-04-25", role: "student", classId: "c3", mileage: 1120, active: true },
  { id: "s20", name: "여지호", birthDate: "2009-11-07", role: "student", classId: "c3", mileage: 960, active: true },
  { id: "s21", name: "송시우", birthDate: "2008-01-30", role: "student", classId: "c4", mileage: 840, active: true },
  { id: "s22", name: "황도현", birthDate: "2009-08-12", role: "student", classId: "c4", mileage: 1250, active: true },
  { id: "s23", name: "양하은", birthDate: "2008-06-22", role: "student", classId: "c5", mileage: 1070, active: true },
  { id: "s24", name: "고민서", birthDate: "2009-10-15", role: "student", classId: "c5", mileage: 890, active: true },
  { id: "s25", name: "공예준", birthDate: "2008-03-08", role: "student", classId: "c6", mileage: 1180, active: true },
  { id: "s26", name: "곽지호", birthDate: "2009-07-20", role: "student", classId: "c6", mileage: 930, active: true },
  { id: "s27", name: "성하준", birthDate: "2009-01-12", role: "student", classId: "c1", mileage: 1010, active: true },
  { id: "s28", name: "방준서", birthDate: "2008-11-28", role: "student", classId: "c2", mileage: 850, active: true },
  { id: "s29", name: "탁예원", birthDate: "2009-04-05", role: "student", classId: "c3", mileage: 1160, active: true },
  { id: "s30", name: "노시호", birthDate: "2008-08-19", role: "student", classId: "c4", mileage: 990, active: true },
  { id: "s31", name: "백예은", birthDate: "2009-06-01", role: "student", classId: "c5", mileage: 1220, active: true },
  { id: "s32", name: "곽도훈", birthDate: "2008-02-28", role: "student", classId: "c6", mileage: 870, active: true },
  { id: "s33", name: "심준호", birthDate: "2009-09-14", role: "student", classId: "c1", mileage: 1090, active: true },
  { id: "s34", name: "추하영", birthDate: "2008-05-07", role: "student", classId: "c2", mileage: 1140, active: true },
  { id: "s35", name: "빈예지", birthDate: "2009-12-03", role: "student", classId: "c3", mileage: 970, active: true },
  { id: "s36", name: "탁민수", birthDate: "2008-07-16", role: "student", classId: "c4", mileage: 1280, active: true },
  { id: "s37", name: "어선우", birthDate: "2009-03-27", role: "student", classId: "c5", mileage: 830, active: true },
  { id: "s38", name: "궉준혁", birthDate: "2008-10-11", role: "student", classId: "c6", mileage: 1060, active: true },
  { id: "s39", name: "장세아", birthDate: "2009-08-09", role: "student", classId: "c1", mileage: 1190, active: true },
  { id: "s40", name: "노하늘", birthDate: "2008-12-25", role: "student", classId: "c2", mileage: 920, active: true },
  { id: "s41", name: "채민서", birthDate: "2009-05-30", role: "student", classId: "c3", mileage: 1030, active: true },
  { id: "s42", name: "태이준", birthDate: "2008-04-14", role: "student", classId: "c4", mileage: 1110, active: true },
  { id: "s43", name: "윤하은", birthDate: "2009-02-02", role: "student", classId: "c5", mileage: 950, active: true },
  { id: "s44", name: "강시연", birthDate: "2008-09-21", role: "student", classId: "c6", mileage: 1200, active: true },
  { id: "s45", name: "임준서", birthDate: "2009-07-08", role: "student", classId: "c1", mileage: 880, active: true },
  { id: "s46", name: "원예준", birthDate: "2008-06-15", role: "student", classId: "c2", mileage: 1170, active: true },
  { id: "s47", name: "홍세영", birthDate: "2009-11-23", role: "student", classId: "c3", mileage: 1000, active: true },
  { id: "s48", name: "송도현", birthDate: "2008-01-18", role: "student", classId: "c4", mileage: 1310, active: true },
  { id: "s49", name: "권도윤", birthDate: "2009-10-06", role: "student", classId: "c5", mileage: 940, active: true },
  { id: "s50", name: "양준서", birthDate: "2008-03-29", role: "student", classId: "c6", mileage: 1130, active: true },
];

/* ── Admin Teachers ── */
export const seedAdminTeachers: AdminTeacher[] = [
  { id: "t001", name: "김선생", birthDate: "1985-03-20", role: "teacher", assignedClassIds: ["c1", "c2"], active: true },
  { id: "t002", name: "이선생", birthDate: "1988-07-15", role: "teacher", assignedClassIds: ["c3", "c4"], active: true },
  { id: "t003", name: "박선생", birthDate: "1990-11-05", role: "teacher", assignedClassIds: ["c5", "c6"], active: true },
  { id: "t004", name: "최목사", birthDate: "1978-06-30", role: "admin", assignedClassIds: [], active: true },
];

/* ── Attendance Sessions ── */
export const seedAttendanceSessions: AttendanceSession[] = [
  { id: "as1", eventName: "주일예배", date: "2026-08-31", startTime: "10:00", endTime: "12:00", mileageReward: 100, xpReward: 100, active: true },
  { id: "as2", eventName: "주일예배", date: "2026-08-24", startTime: "10:00", endTime: "12:00", mileageReward: 100, xpReward: 100, active: false },
  { id: "as3", eventName: "수요예배", date: "2026-08-27", startTime: "19:00", endTime: "20:30", mileageReward: 50, xpReward: 50, active: false },
];

/* ── QT Content ── */
export const seedQTContent: QTContent[] = [
  {
    id: "qt1", date: "2026-08-31", title: "염려를 기도로 바꾸세요",
    passage: "빌립보서 4:6-7", verse: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로...",
    content: "바울은 빌립보 교회에 염려를 내려놓고 기도하라고 권면합니다. 염려는 우리를 사로잡지만, 기도는 하나님이 함께하신다는 사실을 상기시켜줍니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: true, status: "active",
  },
  {
    id: "qt2", date: "2026-08-30", title: "감사의 기도",
    passage: "데살로니가전서 5:16-18", verse: "항상 기뻐하고 쉬지 말고 기도하라...",
    content: "감사하는 삶은 기도에서 시작됩니다. 작은 일에도 감사하면 마음이 풍요로워집니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: false, status: "ended",
  },
  {
    id: "qt3", date: "2026-09-01", title: "하나님의 약속",
    passage: "이사야 41:10", verse: "두려워하지 말라 내가 너와 함께 하노라...",
    content: "하나님은 언제나 우리와 함께하십니다. 두려움을 이길 힘은 하나님이 주시는 약속에 있습니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: false, status: "scheduled",
  },
];

/* ── Missions (Admin) ── */
export const seedMissionAdmins: MissionAdmin[] = [
  { id: "m1", title: "처음 보는 친구에게 먼저 인사하기", description: "주변에 인사를 건넬 친구를 찾아보세요!", icon: "🤝", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m2", title: "친구 한 명을 위해 기도하기", description: "하나님께 친구를 위해 간절히 기도해요.", icon: "🙏", type: "weekly", mileageReward: 20, xpReward: 20, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m3", title: "이번 주 설교에서 기억나는 말씀 남기기", description: "설교 후 가장 감동받은 말씀을 적어보세요.", icon: "📖", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m4", title: "은혜를 나누는 말하기", description: "친구나 선생님에게 감사의 말을 건네세요.", icon: "💝", type: "weekly", mileageReward: 20, xpReward: 20, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m5", title: "함께 성경 읽기", description: "친구와 함께 성경을 읽어보세요.", icon: "🌱", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "ms1", title: "친구 초대하기", description: "교회에 친구를 초대해보세요!", icon: "🚪", type: "special", mileageReward: 100, xpReward: 100, startDate: "2026-08-01", endDate: "2026-09-30", target: "all", approvalRequired: true, active: true },
];

/* ── Announcements ── */
export const seedAnnouncements: Announcement[] = [
  { id: "an1", title: "9월 수련회 안내", content: "9월 13-14일 수련회가 있습니다. 참가비 30,000원을 9월 7일까지 납부해주세요.", target: "all", startDate: "2026-08-25", endDate: "2026-09-14", important: true, status: "published", createdAt: "2026-08-25T10:00:00Z" },
  { id: "an2", title: "출석 체크 안내", content: "이번 주부터 QR 출석이 시작됩니다. 예배 시작 전에 QR을 스캔해주세요.", target: "all", startDate: "2026-08-24", endDate: "2026-09-30", important: false, status: "published", createdAt: "2026-08-24T09:00:00Z" },
];

/* ── Rewards ── */
export const seedRewards: Reward[] = [
  { id: "r1", name: "간식 교환권", description: "편의점 간식 3,000원 이내", mileageCost: 500, inventory: 20, active: true, redemptionLimit: 2, category: "교환권" },
  { id: "r2", name: "음료 교환권", description: "카페 음료 1잔", mileageCost: 700, inventory: 15, active: true, redemptionLimit: 2, category: "교환권" },
  { id: "r3", name: "Mystery Box", description: "랜덤 선물 박스", mileageCost: 1000, inventory: 5, active: true, redemptionLimit: 1, category: "박스" },
  { id: "r4", name: "쌤 사다리 타기", description: "쌤과 사다리 타기 이벤트", mileageCost: 300, inventory: 999, active: true, redemptionLimit: 1, category: "이벤트" },
  { id: "r5", name: "자리 선택권", description: "예배 자리 선정 권한", mileageCost: 200, inventory: 10, active: false, redemptionLimit: 1, category: "권한" },
];

/* ── Reward Redemptions ── */
export const seedRedemptions: RewardRedemption[] = [
  { id: "rr1", studentId: "s1", studentName: "홍길동", rewardId: "r1", rewardName: "간식 교환권", mileageCost: 500, status: "completed", createdAt: "2026-08-28T14:00:00Z" },
  { id: "rr2", studentId: "s3", studentName: "이서연", rewardId: "r2", rewardName: "음료 교환권", mileageCost: 700, status: "approved", createdAt: "2026-08-29T16:00:00Z" },
  { id: "rr3", studentId: "s11", studentName: "노현서", rewardId: "r3", rewardName: "Mystery Box", mileageCost: 1000, status: "requested", createdAt: "2026-08-30T10:00:00Z" },
];

/* ── Season ── */
export const seedSeasonAdmin: SeasonAdmin = {
  id: "2026-fall", name: "2026 FALL SEASON", subtitle: "함께 걸어가는 우리",
  startDate: "2026-09-01", endDate: "2026-11-30", active: true,
  sharedGoalXp: 60000, sharedReward: "예배 후 전체 아이스크림 🍦",
};

/* ── Badge Management ── */
export const seedBadgeAdmins: BadgeAdmin[] = [
  { id: "b1", name: "첫 걸음", description: "첫 QT 완료", icon: "🌱", requirementType: "qt_count", requirementValue: 1, active: true },
  { id: "b2", name: "말씀 탐험가", description: "QT 10회", icon: "📖", requirementType: "qt_count", requirementValue: 10, active: true },
  { id: "b3", name: "예배자", description: "예배 10회 참석", icon: "⛪", requirementType: "attendance_count", requirementValue: 10, active: true },
  { id: "b4", name: "중보자", description: "기도 30회", icon: "🙏", requirementType: "prayer_count", requirementValue: 30, active: true },
  { id: "b5", name: "미션 헌터", description: "미션 10개 완료", icon: "🎯", requirementType: "mission_count", requirementValue: 10, active: true },
];

/* ── Audit Logs ── */
export const seedAuditLogs: AuditLog[] = [
  { id: "al1", timestamp: "2026-08-31T09:00:00Z", actorName: "김선생", actorRole: "teacher", actionType: "mileage_award", target: "고2-3반", description: "고2-3반 전체에게 50M 지급 (반별 게임 우승)" },
  { id: "al2", timestamp: "2026-08-30T14:30:00Z", actorName: "관리자", actorRole: "admin", actionType: "qt_update", target: "QT 등록", description: "8/31 QT 콘텐츠 등록" },
  { id: "al3", timestamp: "2026-08-30T10:00:00Z", actorName: "김선생", actorRole: "teacher", actionType: "attendance_change", target: "홍길동", description: "출석 상태 변경: 결석 → 출석" },
];

/* ── Admin Settings ── */
export const seedAdminSettings: AdminSettings = {
  defaultAttendanceMileage: 100,
  defaultQTMileage: 20,
  prayerMileage: 5,
  weeklyMissionReward: 30,
  nameDisplayPolicy: "full",
  anonymousPrayerEnabled: true,
  mileageShopEnabled: true,
  qrAttendanceEnabled: true,
};
