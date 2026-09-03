const SURL = "https://afrzmtwakfkujsnxwinb.supabase.co";
const KEY = "sb_publishable_CXEpWWGXX-dVtqvtPcZs1A_8KYg_pRe";

async function sb(method, path, body) {
  const resp = await fetch(`${SURL}${path}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!resp.ok) throw new Error(`${method} ${path} -> ${resp.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  // First check badges table columns
  const sample = await sb("GET", "/rest/v1/badges?select=*&limit=1");
  console.log("Badge columns:", sample.length ? Object.keys(sample[0]) : "empty");
  if (sample.length) console.log("Sample:", JSON.stringify(sample[0], null, 2));

  // Check if student_badge_progress exists
  try {
    await sb("GET", "/rest/v1/student_badge_progress?select=*&limit=1");
    console.log("student_badge_progress: exists");
  } catch(e) {
    console.log("student_badge_progress:", e.message.includes("404") ? "DOES NOT EXIST" : e.message);
  }

  // Check completed_missions columns
  try {
    const cm = await sb("GET", "/rest/v1/completed_missions?select=*&limit=1");
    console.log("completed_missions columns:", cm.length ? Object.keys(cm[0]) : "empty");
  } catch(e) {
    console.log("completed_missions error:", e.message);
  }

  // Check prayer_requests columns
  try {
    const pr = await sb("GET", "/rest/v1/prayer_requests?select=*&limit=3");
    console.log("prayer_requests:", pr.length ? JSON.stringify(pr[0]) : "empty");
  } catch(e) {
    console.log("prayer_requests error:", e.message);
  }

  // Check prayer_participants columns
  try {
    const pp = await sb("GET", "/rest/v1/prayer_participants?select=*&limit=1");
    console.log("prayer_participants columns:", pp.length ? Object.keys(pp[0]) : "empty");
  } catch(e) {
    console.log("prayer_participants error:", e.message);
  }

  // Now update badges with proper level_thresholds
  // user requested: 기도 100회 = lv4 (so: 1, 10, 30, 100, 300)
  const badgeDefs = [
    { id: "b1", name: "말씀 탐험가", description: "QT 완료 횟수", level_thresholds: [1, 5, 15, 30, 100], level_titles: ["QT 입문", "QT 수련생", "QT 탐험가", "QT 사냥꾼", "QT 마스터"], requirement_type: "qt_count" },
    { id: "b2", name: "예배자", description: "예배 참석 횟수", level_thresholds: [1, 8, 20, 40, 100], level_titles: ["첫 출석", "꾸준한 예배자", "헌신한 예배자", "예배 충성자", "예배 마스터"], requirement_type: "attendance_count" },
    { id: "b3", name: "중보 기도자", description: "기도 참여 횟수", level_thresholds: [1, 10, 30, 100, 300], level_titles: ["기도 시작", "기도 동참자", "기도 응답자", "기도 용사", "기도 마스터"], requirement_type: "prayer_count" },
    { id: "b4", name: "미션 정복자", description: "미션 완료 횟수", level_thresholds: [1, 5, 15, 40, 100], level_titles: ["첫 미션", "미션 수행자", "미션 헌신자", "미션 정복자", "미션 마스터"], requirement_type: "mission_count" },
    { id: "b5", name: "마일리지 수집가", description: "마일리지 누적 획득", level_thresholds: [50, 200, 500, 1500, 5000], level_titles: ["마일리지 입문", "마일리지 수집가", "마일리지 갑부", "마일리지 왕", "마일리지 마스터"], requirement_type: "mileage_total" },
    { id: "b6", name: "XP 마스터", description: "XP 누적 획득", level_thresholds: [100, 500, 1500, 5000, 15000], level_titles: ["XP 입문", "XP 모험가", "XP 전사", "XP 영웅", "XP 마스터"], requirement_type: "xp_total" },
  ];

  for (const b of badgeDefs) {
    try {
      // Try to update with all fields
      const data = await sb("PATCH", `/rest/v1/badges?id=eq.${b.id}`, {
        level_thresholds: b.level_thresholds,
        requirement_type: b.requirement_type,
        active: true,
      });
      console.log(`Updated ${b.id}: ${b.name} (thresholds: ${b.level_thresholds})`);
    } catch(e) {
      // Try without requirement_type
      try {
        await sb("PATCH", `/rest/v1/badges?id=eq.${b.id}`, {
          level_thresholds: b.level_thresholds,
          active: true,
        });
        console.log(`Updated ${b.id} (no requirement_type)`);
      } catch(e2) {
        console.log(`Failed ${b.id}: ${e2.message}`);
      }
    }
  }

  // Verify
  const all = await sb("GET", "/rest/v1/badges?select=*");
  console.log("\n=== ALL BADGES ===");
  all.forEach(b => console.log(`${b.icon} ${b.name}: thresholds=${JSON.stringify(b.level_thresholds)}, type=${b.requirement_type}`));
}

main().catch(e => { console.error(e); process.exit(1); });
