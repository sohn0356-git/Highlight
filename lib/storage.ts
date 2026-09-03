import type { Student, MileageTransaction, QTRecord, PrayerRequest, CompletedMission } from "./types";
import { koreaDate } from "./korea-date";

const SESSION_KEY = "mileage_session";

export function getSession(): Student | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    return s as Student;
  } catch { return null; }
}

export function setSession(s: Student) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// Legacy QT record functions - now delegated to db.ts
export function getQTRecords(): QTRecord[] { return []; }
export function isQTCompletedToday(): boolean { return false; }
export function updateQTRecord(_id: string, _patch: Partial<QTRecord>) {}
export function deleteQTRecord(_id: string) {}
export function addQTRecord(_rec: QTRecord) {}
export function getCompletedMissions(): CompletedMission[] { return []; }
export function completeMission(_m: CompletedMission) {}
export function getPrayers(): PrayerRequest[] { return []; }
export function initPrayers(_d: PrayerRequest[]) {}
export function hasPrayed(_pid: string, _sid: string): boolean { return false; }
export function togglePrayer(_pid: string, _sid: string): PrayerRequest[] { return []; }
export function getTransactions(): MileageTransaction[] { return []; }
export function addTransaction(_t: MileageTransaction) {}
export function updateStudentMileage(_id: string, _delta: number, student: Student): Student { return student; }
