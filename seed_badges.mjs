/**
 * 배지/레벨 시드 (plain fetch 사용)
 * 실행: node seed_badges.mjs
 */
const SUPABASE_URL = "https://afrzmtwakfkujsnxwinb.supabase.co";
const KEY = "sb_publishable_CXEpWWGXX-dVtqvtPcZs1A_8KYg_pRe";

async function sbRest(method, path, body) {
  const headers = {
    "apikey": KEY,
    "Authorization": `Bearer ${KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "POST" ? "return=representation" : "return=representation",
  };
  const url = `${SUPABASE_URL}${path}`;
  const resp = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!resp.ok) throw new Error(`Supabase ${method} ${path} -> ${resp.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("Seeding badges...");
  
  // Check badges table columns first
  try {
    const cols = await sbRest("GET", "/rest/v1/badges?select=*&limit=1");
    console.log("Badges columns:", cols.length ? Object.keys(cols[0]) : "(empty)");
  } catch(e) {
    console.log("Badges query error:", e.message);
  }

  // Try inserting badges with minimal fields
  const badges = [
    { id: "b1", icon: "📖", name: "말씀 탐험가", description: "QT 완료 횟수에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
    { id: "b2", icon: "⛪", name: "예배자", description: "예배 출석 횟수에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
    { id: "b3", icon: "🙏", name: "중보 기도자", description: "기도 참여 횟수에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
    { id: "b4", icon: "🏆", name: "미션 정복자", description: "미션 완료 횟수에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
    { id: "b5", icon: "💎", name: "마일리지 수집가", description: "마일리지 누적 획득에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
    { id: "b6", icon: "🔥", name: "XP 마스터", description: "XP 누적 획득에 따라 레벨업", criteria: 1, progress: 0, unlocked: false },
  ];
  
  for (const b of badges) {
    try {
      const data = await sbRest("POST", "/rest/v1/badges", [b]);
      console.log(`Badge ${b.id} inserted`);
    } catch(e) {
      // Try minimal insert (maybe criteria/progress/unlocked not needed)
      try {
        const data = await sbRest("POST", "/rest/v1/badges", [{ id: b.id, icon: b.icon, name: b.name, description: b.description }]);
        console.log(`Badge ${b.id} inserted (minimal)`);
      } catch(e2) {
        console.log(`Badge ${b.id} FAILED: ${e2.message}`);
      }
    }
  }
  
  // Check what badges look like now
  try {
    const data = await sbRest("GET", "/rest/v1/badges?select=*");
    console.log("\nAll badges:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.log("Read badges error:", e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
