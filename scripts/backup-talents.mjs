// 매일 달란트 백업 스크립트 (GitHub Actions cron으로 실행)
// 결과: backup/talents_backup.csv (엑셀 호환, 한글은 BOM 포함)
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error("[backup] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 누락");
  process.exit(1);
}

// 한국 날짜 (Asia/Seoul)
const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/students?select=id,name,class_id,grade,class_name,talents,role,is_teacher,active&order=name`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
);
if (!res.ok) {
  console.error(`[backup] fetch 실패: ${res.status}`, await res.text());
  process.exit(1);
}
const students = await res.json();
if (!Array.isArray(students) || students.length === 0) {
  console.error("[backup] 학생 데이터 없음");
  process.exit(1);
}

const dir = "backup";
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, "talents_backup.csv");
// BOM 포함 → 엑셀에서 한글 깨짐 방지
const header = "\uFEFFdate,name,grade,class,talents,role,active";

const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
// 같은 날짜 기존 행 제거 (재실행 시 중복 방지) — 헤더 유지
const rows = existing.trimEnd().split("\n").filter(l => l && !l.startsWith(kst + ",") && !l.startsWith("date,"));
if (!existing.includes("date,name,grade")) rows.unshift(header);

const newRows = students.map(s => {
  const name = (s.name || "").replace(/,/g, " ");
  const cls = (s.class_name || s.class_id || "").replace(/,/g, " ");
  return [kst, name, s.grade ?? "", cls, s.talents ?? 0, s.role || "student", s.active !== false ? "Y" : "N"].join(",");
});
fs.writeFileSync(file, [...rows, ...newRows].join("\n") + "\n");

console.log(`[backup] 완료: ${kst} ${students.length}명 → ${file}`);
