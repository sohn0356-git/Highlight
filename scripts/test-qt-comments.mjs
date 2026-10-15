import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

// Exercise the actual query functions with a capped Data API response.
const source = readFileSync(new URL("../lib/db.ts", import.meta.url), "utf8");
const start = source.indexOf("export async function fetchComments(postId:");
const end = source.indexOf("\nasync function syncCommentCount", start);
const code = stripTypeScriptTypes(source.slice(start, end)).replaceAll("export ", "");
function client(rows, cap = 1000, failAt = Infinity) {
  let calls = 0;
  return { from(table) {
    assert.equal(table, "qt_comments");
    let ids;
    const orders = [];
    return {
      select() { return this; },
      in(column, values) { assert.equal(column, "post_id"); assert.ok(values.length <= 100); ids = values; return this; },
      order(column) { orders.push(column); return this; },
      async range(from, to) {
        assert.deepEqual(orders, ["created_at", "id"]);
        if (++calls === failAt) return { data: null, error: new Error("query failed") };
        const matching = rows.filter(r => ids.includes(r.post_id)).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
        return { data: matching.slice(from, Math.min(to + 1, from + cap)), error: null };
      },
    };
  } };
}
function queries(s) {
  return new Function("sb", `${code}; return { fetchComments, fetchCommentsForPosts };`)(() => s);
}
const rows = Array.from({ length: 1201 }, (_, i) => ({
  id: String(i).padStart(5, "0"), post_id: "p1", student_id: "s1",
  content: `comment ${i}`, created_at: "2026-10-15T00:00:00Z",
}));
for (const cap of [1000, 137]) {
  const api = queries(client(rows, cap));
  const all = await api.fetchCommentsForPosts(["p1", "empty", "p1"]);
  assert.equal(all.p1.length, 1201);
  assert.equal(new Set(all.p1.map(r => r.id)).size, 1201);
  assert.deepEqual(all.empty, []);
  assert.deepEqual(await api.fetchComments("p1"), all.p1);
}
const manyPosts = Array.from({ length: 205 }, (_, i) => ({ ...rows[0], id: `c${i}`, post_id: `p${i}` }));
const grouped = await queries(client(manyPosts)).fetchCommentsForPosts(manyPosts.map(r => r.post_id));
assert.ok(Object.values(grouped).every(comments => comments.length === 1));
assert.deepEqual(await queries(client([])).fetchCommentsForPosts([]), {});
await assert.rejects(queries(client(rows, 137, 2)).fetchCommentsForPosts(["p1"]), /query failed/);
const feed = readFileSync(new URL("../components/SharedQTFeed.tsx", import.meta.url), "utf8");
assert.ok(feed.includes("댓글 {comments.length}"));
console.log("QT comments: pagination, server caps, tied timestamps, batching, empty posts, query errors, and displayed count passed.");
