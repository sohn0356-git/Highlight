const SURL = "https://afrzmtwakfkujsnxwinb.supabase.co";
const KEY = "sb_publishable_CXEpWWGXX-dVtqvtPcZs1A_8KYg_pRe";

async function sb(method, path, body) {
  const resp = await fetch(`${SURL}${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!resp.ok) throw new Error(`${method} ${path} -> ${resp.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  // Check badge_levels structure
  try {
    const cols = await sb("GET", "/rest/v1/badge_levels?select=*&limit=1");
    console.log("badge_levels columns:", cols.length ? Object.keys(cols[0]) : "(empty - need to create)");
  } catch(e) {
    console.log("badge_levels error:", e.message);
    // Table might not exist yet
  }

  // Try to create badge_levels entries
  const levels = [
    // 말씀 탐험가 (QT)
    { badge_id: "b1", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "말씀 입문", description: "QT 1회 완료" },
    { badge_id: "b1", level: 2, threshold: 5, reward_mileage: 20, reward_xp: 20, title: "말씀 수련생", description: "QT 5회 완료" },
    { badge_id: "b1", level: 3, threshold: 15, reward_mileage: 30, reward_xp: 30, title: "말씀 탐험가", description: "QT 15회 완료" },
    { badge_id: "b1", level: 4, threshold: 30, reward_mileage: 50, reward_xp: 50, title: "말씀 사냥꾼", description: "QT 30회 완료" },
    { badge_id: "b1", level: 5, threshold: 100, reward_mileage: 100, reward_xp: 100, title: "말씀 마스터", description: "QT 100회 완료" },
    // 예배자
    { badge_id: "b2", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "첫 출석", description: "예배 1회 참석" },
    { badge_id: "b2", level: 2, threshold: 8, reward_mileage: 20, reward_xp: 20, title: "꾸준한 예배자", description: "예배 8회 참석" },
    { badge_id: "b2", level: 3, threshold: 20, reward_mileage: 30, reward_xp: 30, title: "헌신한 예배자", description: "예배 20회 참석" },
    { badge_id: "b2", level: 4, threshold: 40, reward_mileage: 50, reward_xp: 50, title: "예배 충성자", description: "예배 40회 참석" },
    { badge_id: "b2", level: 5, threshold: 100, reward_mileage: 100, reward_xp: 100, title: "예배 마스터", description: "예배 100회 참석" },
    // 중보 기도자
    { badge_id: "b3", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "기도 시작", description: "기도 1회" },
    { badge_id: "b3", level: 2, threshold: 10, reward_mileage: 20, reward_xp: 20, title: "기도 동참자", description: "기도 10회" },
    { badge_id: "b3", level: 3, threshold: 30, reward_mileage: 30, reward_xp: 30, title: "기도 응답자", description: "기도 30회" },
    { badge_id: "b3", level: 4, threshold: 100, reward_mileage: 50, reward_xp: 50, title: "기도 용사", description: "기도 100회" },
    { badge_id: "b3", level: 5, threshold: 300, reward_mileage: 100, reward_xp: 100, title: "기도 마스터", description: "기도 300회" },
    // 미션 정복자
    { badge_id: "b4", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "첫 미션", description: "미션 1회 완료" },
    { badge_id: "b4", level: 2, threshold: 5, reward_mileage: 20, reward_xp: 20, title: "미션 수행자", description: "미션 5회 완료" },
    { badge_id: "b4", level: 3, threshold: 15, reward_mileage: 30, reward_xp: 30, title: "미션 헌신자", description: "미션 15회 완료" },
    { badge_id: "b4", level: 4, threshold: 40, reward_mileage: 50, reward_xp: 50, title: "미션 정복자", description: "미션 40회 완료" },
    { badge_id: "b4", level: 5, threshold: 100, reward_mileage: 100, reward_xp: 100, title: "미션 마스터", description: "미션 100회 완료" },
    // 마일리지 수집가
    { badge_id: "b5", level: 1, threshold: 50, reward_mileage: 10, reward_xp: 10, title: "마일리지 입문", description: "50M 획득" },
    { badge_id: "b5", level: 2, threshold: 200, reward_mileage: 20, reward_xp: 20, title: "마일리지 수집가", description: "200M 획득" },
    { badge_id: "b5", level: 3, threshold: 500, reward_mileage: 30, reward_xp: 30, title: "마일리지 갑부", description: "500M 획득" },
    { badge_id: "b5", level: 4, threshold: 1500, reward_mileage: 50, reward_xp: 50, title: "마일리지 왕", description: "1500M 획득" },
    { badge_id: "b5", level: 5, threshold: 5000, reward_mileage: 100, reward_xp: 100, title: "마일리지 마스터", description: "5000M 획득" },
    // XP 마스터
    { badge_id: "b6", level: 1, threshold: 100, reward_mileage: 10, reward_xp: 10, title: "XP 입문", description: "100 XP 획득" },
    { badge_id: "b6", level: 2, threshold: 500, reward_mileage: 20, reward_xp: 20, title: "XP 모험가", description: "500 XP 획득" },
    { badge_id: "b6", level: 3, threshold: 1500, reward_mileage: 30, reward_xp: 30, title: "XP 전사", description: "1500 XP 획득" },
    { badge_id: "b6", level: 4, threshold: 5000, reward_mileage: 50, reward_xp: 50, title: "XP 영웅", description: "5000 XP 획득" },
    { badge_id: "b6", level: 5, threshold: 15000, reward_mileage: 100, reward_xp: 100, title: "XP 마스터", description: "15000 XP 획득" },
  ];

  for (const l of levels) {
    try {
      await sb("POST", "/rest/v1/badge_levels", [l]);
      console.log(`  ${l.badge_id} lv${l.level} ${l.title} (${l.threshold})`);
    } catch(e) {
      // Might need different columns
      try {
        await sb("POST", "/rest/v1/badge_levels", [{ badge_id: l.badge_id, level: l.level, threshold: l.threshold, title: l.title, description: l.description }]);
        console.log(`  ${l.badge_id} lv${l.level} (minimal)`);
      } catch(e2) {
        console.log(`  ${l.badge_id} lv${l.level} FAILED: ${e2.message}`);
      }
    }
  }

  // Verify
  try {
    const all = await sb("GET", "/rest/v1/badge_levels?select=*&order=badge_id,level");
    console.log(`\nTotal badge_levels: ${all.length}`);
    all.forEach(l => console.log(`  ${l.badge_id} lv${l.level}: ${l.title} (${l.threshold})`));
  } catch(e) {
    console.log("Verify error:", e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
