"use client";

export function updateClassXP(
  setClasses: (fn: (prev: any[]) => any[]) => void,
  studentClassId: string,
  delta: number
) {
  setClasses(prev =>
    prev.map(c =>
      c.id === studentClassId
        ? { ...c, xp: (c.xp || 0) + delta, weeklyXp: (c.weeklyXp || 0) + delta }
        : c
    )
  );
}
