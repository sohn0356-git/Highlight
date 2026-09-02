import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const resp = await fetch("https://www.duranno.com/qt/view/bible.asp?qtDate=2026-9-2");
const buffer = await resp.arrayBuffer();
const html = iconv.decode(Buffer.from(buffer), "euc-kr");
const $ = cheerio.load(html);

// Look at the bible content div structure
const bibleDiv = $("div.bible");
console.log("=== Bible div HTML (first 1500 chars) ===");
console.log(bibleDiv.html()?.substring(0, 1500));
