import type { Student, MileageTransaction, QTRecord, PrayerRequest, CompletedMission } from "./types";

const SESSION_KEY = "mileage_session";
const QT_KEY = "mileage_qt";
const MISSIONS_KEY = "mileage_completed_missions";
const PRAYERS_KEY = "mileage_prayers";

export function getSession(): Student | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    // Supabase 스키마(row) 형식으로 저장된 세션을 애플리케이션 형식으로 변환
    if (s.birthDate === undefined && s.birth_date !== undefined) {
      return {
        id: s.id,
        name: s.name,
        birthDate: s.birth_date,
        classId: s.class_id,
        mileage: Number(s.mileage) || 0,
      };
    }
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

export function getQTRecords(): QTRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function isQTCompletedToday(): boolean {
  if (typeof window === "undefined") return false;
  const records = getQTRecords();
  const today = new Date().toISOString().slice(0, 10);
  return records.some(r => r.date === today);
}

export function addQTRecord(rec: QTRecord) {
  if (typeof window === "undefined") return;
  const records = getQTRecords();
  records.push(rec);
  localStorage.setItem(QT_KEY, JSON.stringify(records));
}

export function getCompletedMissions(): CompletedMission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function completeMission(m: CompletedMission) {
  if (typeof window === "undefined") return;
  const list = getCompletedMissions();
  if (list.some(x => x.missionId === m.missionId)) return;
  list.push(m);
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(list));
}

export function getPrayers(): PrayerRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRAYERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function hasPrayed(prayerId: string, studentId: string): boolean {
  const prayers = getPrayers();
  const p = prayers.find(x => x.id === prayerId);
  return p ? p.prayedBy.includes(studentId) : false;
}

export function togglePrayer(prayerId: string, studentId: string): PrayerRequest[] {
  const prayers = getPrayers();
  return prayers.map(p => {
    if (p.id !== prayerId) return p;
    if (p.prayedBy.includes(studentId)) return p;
    return { ...p, prayerCount: p.prayerCount + 1, prayedBy: [...p.prayedBy, studentId] };
  });
}

export function initPrayers(defaultPrayers: PrayerRequest[]) {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(PRAYERS_KEY)) {
    localStorage.setItem(PRAYERS_KEY, JSON.stringify(defaultPrayers));
  }
}

export function getTransactions(): MileageTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("mileage_transactions");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addTransaction(t: MileageTransaction) {
  const txns = getTransactions();
  txns.push(t);
  if (typeof window !== "undefined")
    localStorage.setItem("mileage_transactions", JSON.stringify(txns));
}

export function updateStudentMileage(studentId: string, delta: number, student: Student): Student {
  const updated = { ...student, mileage: student.mileage + delta };
  setSession(updated);
  return updated;
}
