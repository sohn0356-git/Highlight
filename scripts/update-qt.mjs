/**
 * Daily QT Uploader
 * - Scrapes today's QT from duranno.com
 * - Upserts into Supabase qt_today table
 */
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase credentials not found");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchQTPage(dateStr) {
  const parts = dateStr.split("-");
  const durannoDate = `${parts[0]}-${parseInt(parts[1])}-${parseInt(parts[2])}`;
  const url = `https://www.duranno.com/qt/view/bible.asp?qtDate=${durannoDate}`;
  console.log(`Fetching: ${url}`);
  const resp = await fetch(url);
  const buffer = await resp.arrayBuffer();
  return iconv.decode(Buffer.from(buffer), "euc-kr");
}

function parseQT(html, dateStr) {
  const $ = cheerio.load(html);

  // Extract passage
  let passage = "";
  const passageEl = $("span.info_bible").first();
  if (passageEl.length) {
    passage = passageEl.text().trim();
  }
  if (!passage) {
    const match = html.match(/((?:시편|창세기|출애굽기|레위기|민수기|신명기|여호수아|사사기|사무엘|열왕기|역대|에스라|느헤미야|에스더|욥기|잠언|전도서|아가|이사야|예레미야|에스겔|다니엘|호세아|요엘|아모스|오바디야|요나|미가|나훔|하바까크|스바니야|학개|스가랴|마태복음|마가복음|루가복음|요한복음|사도행전|로마|고린도|갈라디아|에베소|빌립보|골로새|데살로니가|디모데|디도|히브리|야고보|베드로|요한|유다|요한계시록)\s*\d+\s*:\s*\d+[~\-]\d+)/);
    if (match) passage = match[1].trim();
  }

  // Extract verse/title from h1 > em
  let verse = "";
  const emEl = $("h1 em").first();
  if (emEl.length) {
    verse = emEl.text().trim().replace(/\s+/g, " ");
  }
  if (!verse) {
    const emMatch = html.match(/<em>([^<]+)<\/em>/g);
    if (emMatch) {
      for (const m of emMatch) {
        const text = m.replace(/<[^>]+>/g, "").trim();
        if (text.length > 10 && !text.includes("다이어리") && !text.includes("로그인") && !text.includes("회원가입")) {
          verse = text;
          break;
        }
      }
    }
  }

  // Extract bible content with proper formatting
  let content = "";
  const bibleDiv = $("div.bible");
  if (bibleDiv.length) {
    const lines = [];
    bibleDiv.children().each(function () {
      const el = $(this);
      if (el.is("p.title")) {
        // Section title - add blank line before if not first
        if (lines.length > 0) lines.push("");
        lines.push("【" + el.text().trim() + "】");
        lines.push("");
      } else if (el.is("table")) {
        const th = el.find("th").text().trim();
        const td = el.find("td").text().trim();
        if (th && td) {
          lines.push(th + " " + td);
        }
      }
    });
    content = lines.join("\n").trim();
  }

  // Extract prayer
  let prayer = "";
  const prayerDiv = $("div.helper.box.matop");
  if (prayerDiv.length) {
    const text = prayerDiv.text().trim();
    const prayerMatch = text.match(/오늘의 기도\s*(.+?)(?:$)/s);
    if (prayerMatch) {
      prayer = prayerMatch[1].trim();
    } else {
      prayer = text.replace("오늘의 기도", "").trim();
    }
  }

  // Extract song
  let song = "";
  const songDiv = $("div.song.box");
  if (songDiv.length) {
    song = songDiv.text().trim().replace(/\s+/g, " ");
    song = song.replace("오늘의 찬송", "").trim();
  }

  // Extract helper/meditation notes
  let helper = "";
  const helperDiv = $("div.helper.box").not(".matop");
  if (helperDiv.length) {
    helper = helperDiv.text().trim().replace(/\s+/g, " ");
    helper = helper.replace("묵상 도우미", "").trim();
  }

  // Extract questions
  let question1 = "";
  let question2 = "";
  const qMatches = html.match(/class="mat_q[^"]*"[^>]*>([^<]+)/g);
  if (qMatches) {
    if (qMatches[0]) question1 = qMatches[0].replace(/class="mat_q[^"]*"[^>]*>/, "").trim();
    if (qMatches[1]) question2 = qMatches[1].replace(/class="mat_q[^"]*"[^>]*>/, "").trim();
  }

  return {
    date: dateStr,
    passage: passage || "",
    verse: verse || "",
    content: content || "",
    prayer: prayer || "",
    song: song || "",
    helper: helper || "",
    question1: question1 || "",
    question2: question2 || "",
    source: "duranno",
    updated_at: new Date().toISOString(),
  };
}

async function upsertQT(qtData) {
  console.log(`Upserting QT for ${qtData.date}...`);
  const { error } = await sb.from("qt_today").upsert(
    {
      date: qtData.date,
      passage: qtData.passage,
      verse: qtData.verse,
      content: qtData.content,
      prayer: qtData.prayer,
      song: qtData.song,
      helper: qtData.helper,
      question1: qtData.question1,
      question2: qtData.question2,
      source: qtData.source,
      updated_at: qtData.updated_at,
    },
    { onConflict: "date" }
  );
  if (error) {
    console.error("Upsert error:", error.message);
    return false;
  }
  console.log(`QT for ${qtData.date} saved`);
  return true;
}

async function main() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  console.log(`\nDaily QT Update - ${dateStr}\n`);

  try {
    const html = await fetchQTPage(dateStr);
    const qtData = parseQT(html, dateStr);
    console.log(`Passage: ${qtData.passage}`);
    console.log(`Verse: ${qtData.verse}`);
    console.log(`Content preview:\n${qtData.content.substring(0, 300)}`);
    console.log(`\nPrayer: ${qtData.prayer.substring(0, 100)}`);
    await upsertQT(qtData);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
