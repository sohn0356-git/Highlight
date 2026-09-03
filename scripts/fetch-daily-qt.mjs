/**
 * 드라노 QT 자동 가져오기 스크립트 (plain fetch 사용 - supabase-js 불필요)
 * GitHub Actions에서 매일 실행, supabase REST API에 저장
 */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars");
  process.exit(1);
}

function koreaDateStr(d) {
  const date = d || new Date();
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

async function sbRest(method, path, body) {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "POST" ? "return=representation" : "return=representation",
  };
  const url = `${SUPABASE_URL}${path}`;
  const resp = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!resp.ok) {
    throw new Error(`Supabase ${method} ${path} -> ${resp.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function fetchDurannoHTML(qtDate) {
  const url = `https://www.duranno.com/qt/view/bible.asp?qtDate=${qtDate}`;
  console.log(`Fetching: ${url}`);
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; HighlightBot/1.0)" } });
    if (!resp.ok) {
      console.error(`HTTP ${resp.status}`);
      return null;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    try {
      const decoder = new TextDecoder("euc-kr");
      return decoder.decode(buf);
    } catch {
      return buf.toString("utf8");
    }
  } catch (e) {
    console.error("fetch error:", e.message);
    return null;
  }
}

function stripTags(html) {
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

function normalizeBibleText(text) {
  if (!text) return text;
  let result = text
    .replace(/(\d{1,3})\s*([가-힣])/g, "$1 $2")
    .replace(/(?=\b\d{1,3}\s+[가-힣])/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

function parseDurannoHTML(html, qtDate) {
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/g;
  const h1s = [...html.matchAll(h1Regex)].map((m) => m[1]);
  const rawPassage = h1s.length > 1 ? stripTags(h1s[h1s.length - 1]) : "";

  let passage = rawPassage.trim();
  const passageMatch = passage.match(/^([가-힣]+(?:\s?[0-9]+)?(?:\s?[0-9]+)?(?:\s?:\s?[0-9~\-]+))\s*(.*)$/);
  let bibleReference = passage;
  let verse = "";
  if (passageMatch) {
    bibleReference = passageMatch[1].trim();
    verse = passageMatch[2].trim();
  }

  const bibleDivRegex = /<div[^>]*class="[^"]*\bbible\b[^"]*"[^>]*>([\s\S]*?)<\/div>/;
  const bibleMatch = html.match(bibleDivRegex);
  let bibleText = "";
  if (bibleMatch) {
    bibleText = stripTags(bibleMatch[1]).trim();
  }
  if (!bibleText) {
    const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
    bibleText = tables.map((t) => stripTags(t[1]).trim()).filter((t) => t.length > 3).join("\n");
  }

  const medStart = html.indexOf("묵상 도우미");
  let meditation = "";
  if (medStart > -1) {
    const medText = html.substring(medStart + "묵상 도우미".length);
    const nextSection = medText.indexOf("오늘의 기도");
    let med = nextSection > -1 ? medText.substring(0, nextSection) : medText;
    med = med.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const contentIdx = med.search(/[가-힣]/);
    if (contentIdx > -1) med = med.substring(contentIdx);
    meditation = med;
  }

  const prayStart = html.indexOf("오늘의 기도");
  let prayer = "";
  if (prayStart > -1) {
    const prayText = html.substring(prayStart + "오늘의 기도".length);
    const endIdx = prayText.indexOf("다이어리 쓰기");
    let pr = endIdx > -1 ? prayText.substring(0, endIdx) : prayText;
    pr = pr.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const contentIdx = pr.search(/[가-힣]/);
    if (contentIdx > -1) pr = pr.substring(contentIdx);
    prayer = pr;
  }

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

  bibleText = normalizeBibleText(bibleText);

  return {
    passage: bibleReference,
    verse,
    content: bibleText,
    prayer,
    song,
    helper: meditation,
    question1: "",
    question2: "",
  };
}

async function storeQT(qtData, qtDate) {
  // Check existing
  const existing = await sbRest("GET", `/rest/v1/qt_today?select=id&date=eq.${qtDate}&limit=1`);
  const hasExisting = Array.isArray(existing) && existing.length > 0;

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

  if (hasExisting) {
    const data = await sbRest("PATCH", `/rest/v1/qt_today?date=eq.${qtDate}`, payload);
    return { ok: true, data, action: "updated" };
  } else {
    const row = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
    const data = await sbRest("POST", "/rest/v1/qt_today", [row]);
    return { ok: true, data, action: "inserted" };
  }
}

async function main() {
  const targetDate = process.argv[2] || koreaDateStr();
  console.log(`[QT Fetcher] Target date: ${targetDate}`);

  const html = await fetchDurannoHTML(targetDate);
  if (!html) {
    console.error(`Failed to fetch duranno for ${targetDate}`);
    process.exit(1);
  }

  const parsed = parseDurannoHTML(html, targetDate);
  console.log(`[QT Fetcher] Parsed passage: "${parsed.passage}"`);
  console.log(`[QT Fetcher] Verse: "${parsed.verse}"`);
  console.log(`[QT Fetcher] Content length: ${parsed.content.length}`);
  console.log(`[QT Fetcher] Prayer length: ${parsed.prayer.length}`);
  console.log(`[QT Fetcher] Song length: ${parsed.song.length}`);
  console.log(`[QT Fetcher] Helper length: ${parsed.helper.length}`);

  try {
    const result = await storeQT(parsed, targetDate);
    console.log(`[QT Fetcher] SUCCESS (${result.action}) for ${targetDate}`);
    console.log(JSON.stringify({ passage: parsed.passage, verse: parsed.verse, contentLength: parsed.content.length }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(`[QT Fetcher] FAILED: ${e.message}`);
    process.exit(1);
  }
}

main();
