// 매일 달란트 백업 스크립트 (GitHub Actions cron으로 실행)
// 결과:
//  - backup/talents_backup.xlsx : 날짜별 시트(탭) 1개씩 (엑셀)
//  - backup/talents_backup.csv  : 날짜 열 포함 추가형 CSV (기존 유지)
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

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

function roleLabel(s) {
  if (s.role === "admin") return "관리자";
  if (s.is_teacher || s.role === "teacher") return "교사";
  return "학생";
}

const dir = "backup";
fs.mkdirSync(dir, { recursive: true });

// ── CSV (기존 형식 유지, 같은 날짜 재실행 시 중복 제거) ──
const csvFile = path.join(dir, "talents_backup.csv");
const header = "\uFEFFdate,name,grade,class,talents,role,active";
const existing = fs.existsSync(csvFile) ? fs.readFileSync(csvFile, "utf-8") : "";
const rows = existing.trimEnd().split("\n").filter(l => l && !l.startsWith(kst + ",") && !l.startsWith("date,"));
if (!existing.includes("date,name,grade")) rows.unshift(header);
const csvRows = students.map(s => {
  const name = (s.name || "").replace(/,/g, " ");
  const cls = (s.class_name || s.class_id || "").replace(/,/g, " ");
  return [kst, name, s.grade ?? "", cls, s.talents ?? 0, roleLabel(s), s.active !== false ? "Y" : "N"].join(",");
});
fs.writeFileSync(csvFile, [...rows, ...csvRows].join("\n") + "\n");

// ── XLSX (날짜별 시트 탭) ──
const xlsxFile = path.join(dir, "talents_backup.xlsx");
const wb = new ExcelJS.Workbook();
if (fs.existsSync(xlsxFile)) {
  await wb.xlsx.readFile(xlsxFile);
}
let ws = wb.getWorksheet(kst);
const HEADER = ["이름", "학년", "반", "달란트", "역할", "상태"];
if (!ws) {
  ws = wb.addWorksheet(kst);
  ws.addRow(HEADER);
} else {
  // 같은 날짜 재실행 → 기존 행 제거 후 다시 기록 (중복 방지)
  ws.spliceRows(2, Math.max(0, ws.rowCount - 1));
}
ws.getRow(1).font = { bold: true };
ws.getRow(1).height = 20;
ws.getColumn(1).width = 14; // 이름
ws.getColumn(2).width = 8;  // 학년
ws.getColumn(3).width = 16; // 반
ws.getColumn(4).width = 10; // 달란트
ws.getColumn(5).width = 10; // 역할
ws.getColumn(6).width = 8;  // 상태
ws.views = [{ state: "frozen", ySplit: 1 }];
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 6 } };
for (const s of students) {
  ws.addRow([
    s.name || "",
    s.grade ?? "",
    s.class_name || s.class_id || "",
    s.talents ?? 0,
    roleLabel(s),
    s.active !== false ? "활성" : "비활성",
  ]);
}
await wb.xlsx.writeFile(xlsxFile);

console.log(`[backup] 완료: ${kst} ${students.length}명 → ${xlsxFile} (+ ${csvFile})`);
