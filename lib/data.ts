import raw from "./mock-data.json";
import type {
  Season, ClassRoom, Student, AttendanceRecord, QTRecord, Mission,
  Badge, PrayerRequest, MileageTransaction, CommunityActivity, SchoolClass,
} from "./types";

interface MockData {
  season: Season;
  classes: (ClassRoom | SchoolClass)[];
  students: Student[];
  missions: Mission[];
  badges: Badge[];
  prayers: PrayerRequest[];
  transactions: MileageTransaction[];
  activities: CommunityActivity[];
  qt_today: { date: string; passage: string; verse: string; content: string };
  shared_goal: { label: string; current: number; target: number; reward: string };
}

export const mockData = raw as unknown as MockData;
