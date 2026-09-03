/**
 * 드라노 (duranno.com) QT 본문 스크래퍼
 * https://www.duranno.com/qt/view/bible.asp?qtDate=YYYY-MM-DD
 * 매일 00:00 (KST) GitHub Actions에서 호출되어
 * 해당 날짜의 QT를 Supabase qt_today 테이블에 저장한다.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSb() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/** 한국 시간 오늘 날짜 YYYY-MM-DD */
export function koreaDateStr(d?: Date): string {
  const date = d || new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
  return parts;
}

/** 드라노 URL에서 HTML 가져오기 */
async function fetchDurannoHTML(qtDate: string): Promise<string | null> {
  const url = `https://www.duranno.com/qt/view/bible.asp?qtDate=${qtDate}`;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; HighlightBot/1.0)" } });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    // Duranno uses EUC-KR encoding
    try {
      // Use TextDecoder with euc-kr (Node 22+ supports it)
      const decoder = new TextDecoder("euc-kr");
      return decoder.decode(buf);
    } catch {
      return buf.toString("utf8");
    }
  } catch (e) {
    console.error("fetchDurannoHTML error:", (e as Error).message);
    return null;
  }
}

/** HTML에서 QT 정보 추출 */
export function parseDurannoHTML(html: string, qtDate: string) {
  // Simple regex-based extraction (avoid cheerio dependency for edge runtime)
  // Extract passage from h1 element
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/g;
  const h1s = [...html.matchAll(h1Regex)].map(m => m[1]);
  // Last h1 contains the passage (first is site title)
  const rawPassage = h1s.length > 1 ? stripTags(h1s[h1s.length - 1]) : "";

  // Extract passage (skip first - title part)
  let passage = rawPassage.trim();
  // Passage is like "시편 119 : 33~48비방과 수치에서 건지는 진리의 말씀"
  // Split book/chapter/verse from title
  const passageMatch = passage.match(/^([가-힣]+(?:\s?[0-9]+)?(?:\s?[0-9]+)?(?:\s?:\s?[0-9~\-]+))\s*(.*)$/);
  let bibleReference = passage;
  let verse = "";
  if (passageMatch) {
    bibleReference = passageMatch[1].trim();
    verse = passageMatch[2].trim();
  }

  // Extract bible text from div.bible
  const bibleDivRegex = /<div[^>]*class="[^"]*\bbible\b[^"]*"[^>]*>([\s\S]*?)<\/div>/;
  const bibleMatch = html.match(bibleDivRegex);
  let bibleText = "";
  if (bibleMatch) {
    bibleText = stripTags(bibleMatch[1]).trim();
  }

  // Also try to get tables (verse content is in tables)
  if (!bibleText) {
    const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
    bibleText = tables.map(t => stripTags(t[1]).trim()).filter(t => t.length > 3).join("\n");
  }

  // Extract meditation/묵상 도우미
  const medStart = html.indexOf("묵상 도우미");
  let meditation = "";
  if (medStart > -1) {
    const medText = html.substring(medStart + "묵상 도우미".length);
    // Take until 오늘의 기도 or next section
    const nextSection = medText.indexOf("오늘의 기도");
    let med = nextSection > -1 ? medText.substring(0, nextSection) : medText;
    // Clean up
    med = med.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    // Remove leading stuff before actual content
    const contentIdx = med.search(/[가-힣]/);
    if (contentIdx > -1) med = med.substring(contentIdx);
    meditation = med;
  }

  // Extract prayer/오늘의 기도
  const prayStart = html.indexOf("오늘의 기도");
  let prayer = "";
  if (prayStart > -1) {
    const prayText = html.substring(prayStart + "오늘의 기도".length);
    // Take until footer/next section
    const endIdx = prayText.indexOf("다이어리 쓰기");
    let pr = endIdx > -1 ? prayText.substring(0, endIdx) : prayText;
    pr = pr.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const contentIdx = pr.search(/[가-힣]/);
    if (contentIdx > -1) pr = pr.substring(contentIdx);
    prayer = pr;
  }

  // Extract song (찬송)
  const songStart = html.indexOf("오늘의 찬송");
  let song = "";
  if (songStart > -1) {
    const songText = html.substring(songStart + "오늘의 찬송".length);
    const endIdx = songText.indexOf("역본 선택");
    let sg = endIdx > -1 ? songText.substring(0, endIdx) : songText;
    sg = sg.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const contentIdx = sg.search(/[가-힣]/);
    if (contentIdx > -1) sg = sg.substring(contentIdx);
    song = sg;
  }

  // Normalize bible text: add line breaks before verse numbers
  bibleText = normalizeBibleText(bibleText);

  // Quote1/2 (questions) - not available on this page
  const question1 = "";
  const question2 = "";

  return {
    passage: bibleReference,
    verse,
    content: bibleText,
    prayer,
    song,
    helper: meditation,
    question1,
    question2,
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** 성경 본문에 장절 단위로 줄바꿈 추가 */
function normalizeBibleText(text: string): string {
  if (!text) return text;
  // Insert newlines before verse numbers (like "33 여호와여")
  // Pattern: verse number at start followed by Korean text
  let result = text
    // Add space after verse number patterns
    .replace(/(\d{1,3})\s*([가-힣])/g, "$1 $2")
    // Add newline before verse numbers
    .replace(/(?=\b\d{1,3}\s+[가-힣])/g, "\n")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

/** Supabase에 QT 저장 (upsert) */
export async function storeQT(qtData: any, qtDate: string) {
  const sb = getSb();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  try {
    // Check if this row already exists for this date
    const { data: existing } = await sb.from("qt_today").select("id").eq("date", qtDate).limit(1);

    const payload = {
      date: qtDate,
      passage: qtData.passage || "",
      verse: qtData.verse || "",
      content: qtData.content || "",
      prayer: qtData.prayer || "",
      song: qtData.song || "",
      helper: qtData.helper || "",
      question1: qtData.question1 || "",
      question2: qtData.question2 || "",
      source: "duranno",
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length) {
      // Update existing row
      const { data, error } = await sb.from("qt_today").update(payload).eq("date", qtDate).select().single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    } else {
      // Insert new row
      const row = { id: `qt_${qtDate}`, ...payload, created_at: new Date().toISOString() };
      const { data, error } = await sb.from("qt_today").insert([row]).select().single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** 오늘 QT를 가져와서 저장. 직접 실행용 엔트리포인트 */
export async function fetchAndStoreDailyQT(targetDate?: string): Promise<{ ok: boolean; message: string; data?: any }> {
  const date = targetDate || koreaDateStr();
  console.log(`[QT Fetcher] Fetching QT for ${date}`);

  const html = await fetchDurannoHTML(date);
  if (!html) return { ok: false, message: `Failed to fetch duranno HTML for ${date}` };

  const parsed = parseDurannoHTML(html, date);
  const result = await storeQT(parsed, date);

  if (result.ok) {
    return { ok: true, message: `QT saved for ${date}`, data: result.data };
  }
  return { ok: false, message: `Failed to store QT: ${result.error}` };
}

// CLI 직접 실행 지원
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    const dateArg = process.argv[2];
    const result = await fetchAndStoreDailyQT(dateArg);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  })();
}
